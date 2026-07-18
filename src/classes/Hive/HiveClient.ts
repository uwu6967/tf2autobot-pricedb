import axios, { AxiosError } from 'axios';
import Currencies from '@tf2autobot/tf2-currencies';
import SteamID from 'steamid';
import Bot from '../Bot';
import log from '../../lib/logger';
import { currPure } from '../../lib/tools/pure';
import HiveTransfer from './HiveTransfer';
import { HiveBotPublic, HiveHeartbeatResponse, HiveJob, HiveLink } from './types';

export default class HiveClient {
    private timer: NodeJS.Timeout | null = null;

    private registered = false;

    private lastLinks: HiveLink[] = [];

    private lastPending: HiveLink[] = [];

    private lastJobs: HiveJob[] = [];

    private lastDirectory: HiveBotPublic[] = [];

    private executing = new Set<string>();

    readonly transfer: HiveTransfer;

    constructor(private readonly bot: Bot) {
        this.transfer = new HiveTransfer(bot, this);
    }

    get enabled(): boolean {
        return this.bot.options.hive?.enable === true && !!this.token && !!this.apiUrl;
    }

    get apiUrl(): string {
        return (process.env.HIVE_API_URL || this.bot.options.hive?.apiUrl || '').replace(/\/$/, '');
    }

    get token(): string {
        return process.env.HIVE_TOKEN || '';
    }

    get linkedSteamIds(): Set<string> {
        const ids = new Set<string>();
        for (const link of this.lastLinks) {
            if (link.status !== 'accepted') {
                continue;
            }
            ids.add(link.a === this.steamId ? link.b : link.a);
        }
        return ids;
    }

    get steamId(): string {
        if (this.bot.client.steamID) {
            return this.bot.client.steamID.getSteamID64();
        }
        const sid = this.bot.handler.getBotInfo.steamID;
        return sid ? sid.getSteamID64() : '';
    }

    getStatusSummary(): string {
        if (!this.enabled) {
            return '🐝 Pure Hive is disabled (set hive.enable=true and HIVE_TOKEN).';
        }
        const pure = currPure(this.bot);
        const bands = this.getBands();
        const links = this.lastLinks
            .map(l => {
                const other = l.a === this.steamId ? l.b : l.a;
                return `• ${other} (${l.status})`;
            })
            .join('\n');
        const pending = this.lastPending
            .map(l => {
                const other = l.a === this.steamId ? l.b : l.a;
                return `• invite with ${other} (from ${l.invitedBy})`;
            })
            .join('\n');
        const jobs = this.lastJobs
            .filter(j => j.status === 'pending' || j.status === 'sent')
            .map(
                j =>
                    `• ${j.id.slice(0, 8)} ${j.type} ${j.fromSteamId} → ${j.toSteamId}: ${j.keys} keys, ${j.refined} ref [${j.status}]`
            )
            .join('\n');

        return [
            '🐝 Pure Hive status',
            `API: ${this.apiUrl}`,
            `Registered: ${this.registered ? 'yes' : 'no'}`,
            `Pure: ${pure.key} keys, ${Currencies.toRefined(pure.refTotalInScrap)} ref`,
            `Bands: keys ${bands.minKeys}-${bands.maxKeys}, ref ${bands.minRefined}-${bands.maxRefined}`,
            `Auto-rebalance: ${this.bot.options.hive.autoRebalance ? 'on' : 'off'}`,
            `Links:\n${links || '• (none)'}`,
            `Pending invites:\n${pending || '• (none)'}`,
            `Open jobs:\n${jobs || '• (none)'}`
        ].join('\n');
    }

    start(): void {
        if (!this.enabled) {
            log.debug('Pure Hive disabled — skip start');
            return;
        }
        void this.tick();
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.timer = setInterval(() => {
            void this.tick();
        }, 60 * 1000);
        log.info(`Pure Hive started → ${this.apiUrl}`);
    }

    stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    private getBands() {
        const hive = this.bot.options.hive;
        const ak = this.bot.options.autokeys;
        const useAk = hive.useAutokeysBands === true;
        return {
            minKeys: useAk ? ak.minKeys : hive.minKeys,
            maxKeys: useAk ? ak.maxKeys : hive.maxKeys,
            minRefined: useAk ? ak.minRefined : hive.minRefined,
            maxRefined: useAk ? ak.maxRefined : hive.maxRefined
        };
    }

    private authHeaders() {
        return {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'User-Agent': `TF2Autobot-PureHive@${process.env.BOT_VERSION || 'dev'}`
        };
    }

    private async request<T>(method: 'get' | 'post' | 'delete', path: string, data?: unknown): Promise<T> {
        const url = `${this.apiUrl}${path}`;
        try {
            const res = await axios({
                method,
                url,
                data,
                headers: this.authHeaders(),
                timeout: 20000
            });
            return res.data as T;
        } catch (err) {
            const ax = err as AxiosError<{ error?: string }>;
            const msg = ax.response?.data?.error || ax.message;
            throw new Error(msg);
        }
    }

    async tick(): Promise<void> {
        if (!this.enabled) {
            return;
        }
        if (!this.steamId) {
            return;
        }

        try {
            if (!this.registered) {
                await this.request('post', '/v1/register', {
                    steamId: this.steamId,
                    name: this.bot.options.miscSettings?.game?.customName || this.bot.handler.getBotInfo.name
                });
                this.registered = true;
            }

            const pure = currPure(this.bot);
            const bands = this.getBands();
            const hive = this.bot.options.hive;
            const hb = await this.request<HiveHeartbeatResponse>('post', '/v1/heartbeat', {
                name: this.bot.handler.getBotInfo.name || this.steamId,
                keys: pure.key,
                refined: Currencies.toRefined(pure.refTotalInScrap),
                minKeys: bands.minKeys,
                maxKeys: bands.maxKeys,
                minRefined: bands.minRefined,
                maxRefined: bands.maxRefined,
                maxKeysPerTransfer: hive.maxKeysPerTransfer,
                maxRefinedPerTransfer: hive.maxRefinedPerTransfer,
                cooldownSeconds: hive.cooldownSeconds,
                autoRebalance: hive.autoRebalance
            });

            this.lastLinks = hb.links || [];
            this.lastPending = hb.pendingInvites || [];
            this.lastJobs = hb.jobs || [];

            for (const job of this.lastJobs) {
                if (job.status === 'pending' && job.fromSteamId === this.steamId) {
                    void this.executeOutboundJob(job);
                }
            }
        } catch (err) {
            log.warn('Pure Hive tick failed: ' + (err as Error).message);
        }
    }

    async executeOutboundJob(job: HiveJob): Promise<void> {
        if (this.executing.has(job.id)) {
            return;
        }
        this.executing.add(job.id);
        try {
            const offerId = await this.transfer.sendJob(job);
            await this.request('post', `/v1/jobs/${job.id}/result`, {
                status: 'sent',
                offerId,
                message: 'offer_sent'
            });
            job.status = 'sent';
            job.offerId = offerId;
        } catch (err) {
            log.warn(`Hive job ${job.id} send failed: ${(err as Error).message}`);
            try {
                await this.request('post', `/v1/jobs/${job.id}/result`, {
                    status: 'failed',
                    message: (err as Error).message
                });
            } catch {
                // ignore
            }
        } finally {
            this.executing.delete(job.id);
        }
    }

    async markJobDone(jobId: string, offerId?: string): Promise<void> {
        try {
            await this.request('post', `/v1/jobs/${jobId}/result`, {
                status: 'done',
                offerId,
                message: 'accepted'
            });
        } catch (err) {
            log.warn(`Hive mark done failed: ${(err as Error).message}`);
        }
    }

    findInboundJob(partnerSteamId: string, keys: number, refinedScrap: number): HiveJob | null {
        const refined = Currencies.toRefined(refinedScrap);
        for (const job of this.lastJobs) {
            if (job.status !== 'pending' && job.status !== 'sent') {
                continue;
            }
            if (job.toSteamId !== this.steamId || job.fromSteamId !== partnerSteamId) {
                continue;
            }
            const keyOk = (job.keys || 0) === keys;
            const refOk =
                Math.abs(Currencies.toScrap(job.refined || 0) - refinedScrap) <= 1 ||
                Math.abs((job.refined || 0) - refined) < 0.12;
            if (keyOk && refOk) {
                return job;
            }
            // Allow slightly less metal if Steam rounding; keys must match
            if (keyOk && refinedScrap >= Currencies.toScrap(job.refined || 0) - 1) {
                return job;
            }
        }
        return null;
    }

    findJobById(jobId: string): HiveJob | null {
        return this.lastJobs.find(j => j.id === jobId) || null;
    }

    async link(toSteamId: string): Promise<string> {
        if (!new SteamID(toSteamId).isValid()) {
            throw new Error('Invalid SteamID64');
        }
        const res = await this.request<{ link: HiveLink }>('post', '/v1/links', { toSteamId });
        await this.tick();
        return res.link.status === 'accepted'
            ? `✅ Already linked with ${toSteamId}`
            : `✅ Link invite sent to ${toSteamId}. They must !hive accept ${this.steamId}`;
    }

    async accept(fromSteamId: string): Promise<string> {
        const res = await this.request<{ link: HiveLink }>('post', '/v1/links/accept', { fromSteamId });
        await this.tick();
        return `✅ Linked with ${fromSteamId} (${res.link.status})`;
    }

    async unlink(partnerSteamId: string): Promise<string> {
        await this.request('delete', `/v1/links/${partnerSteamId}`);
        await this.tick();
        return `✅ Unlinked ${partnerSteamId}`;
    }

    async push(toSteamId: string, keys: number, refined: number): Promise<string> {
        const res = await this.request<{ job: HiveJob }>('post', '/v1/jobs', {
            toSteamId,
            keys,
            refined
        });
        await this.executeOutboundJob(res.job);
        return `✅ Hive push job ${res.job.id.slice(0, 8)}: ${keys} keys, ${refined} ref → ${toSteamId}`;
    }

    async refreshDirectory(): Promise<HiveBotPublic[]> {
        const res = await this.request<{ bots: HiveBotPublic[] }>('get', '/v1/bots');
        this.lastDirectory = res.bots || [];
        return this.lastDirectory;
    }
}
