import Currencies from '@tf2autobot/tf2-currencies';
import SteamID from 'steamid';
import Bot from '../Bot';
import log from '../../lib/logger';
import HiveClient from './HiveClient';
import { HIVE_JOB_MESSAGE_PREFIX, HiveJob, PURE_SKUS } from './types';

export default class HiveTransfer {
    constructor(
        private readonly bot: Bot,
        private readonly client: HiveClient
    ) {}

    async sendJob(job: HiveJob): Promise<string> {
        if (job.fromSteamId !== this.client.steamId) {
            throw new Error('Not the sender for this job');
        }
        if (!this.client.linkedSteamIds.has(job.toSteamId)) {
            throw new Error('Partner not linked');
        }

        const partner = new SteamID(job.toSteamId);
        if (!this.bot.friends.isFriend(partner)) {
            // Best-effort friend request; offer may still work if they are friends already soon
            try {
                this.bot.client.addFriend(partner);
            } catch (err) {
                log.warn('Hive: failed to add friend: ' + (err as Error).message);
            }
        }

        const offer = this.bot.manager.createOffer(partner);
        const inv = this.bot.inventoryManager.getInventory;

        const keyAssets = inv.findBySKU('5021;6', true);
        let keysNeeded = job.keys || 0;
        for (const assetid of keyAssets) {
            if (keysNeeded <= 0) {
                break;
            }
            if (this.bot.options.miscSettings.skipItemsInTrade.enable && this.bot.trades.isInTrade(assetid)) {
                continue;
            }
            offer.addMyItem({ appid: 440, contextid: '2', assetid });
            keysNeeded--;
        }
        if (keysNeeded > 0) {
            throw new Error(`Not enough tradable keys (need ${job.keys})`);
        }

        let scrapNeeded = Currencies.toScrap(job.refined || 0);
        if (scrapNeeded > 0) {
            scrapNeeded = this.addMetal(offer, scrapNeeded);
            if (scrapNeeded > 0) {
                throw new Error(`Not enough tradable metal (short ${Currencies.toRefined(scrapNeeded)} ref)`);
            }
        }

        offer.setMessage(`${HIVE_JOB_MESSAGE_PREFIX}${job.id}`);

        const status = await this.bot.trades.sendOffer(offer);
        log.info(`Hive job ${job.id}: offer ${offer.id} status=${status}`);
        if (!offer.id) {
            throw new Error('Offer sent but no offer id');
        }
        return String(offer.id);
    }

    private addMetal(
        offer: ReturnType<Bot['manager']['createOffer']>,
        scrapNeeded: number
    ): number {
        const inv = this.bot.inventoryManager.getInventory;
        const order: Array<{ sku: string; value: number }> = [
            { sku: '5002;6', value: 9 },
            { sku: '5001;6', value: 3 },
            { sku: '5000;6', value: 1 }
        ];

        for (const { sku, value } of order) {
            if (scrapNeeded <= 0) {
                break;
            }
            const assets = inv.findBySKU(sku, true);
            for (const assetid of assets) {
                if (scrapNeeded < value && value > 1) {
                    // Prefer smaller denominations when remaining is less than this coin
                    continue;
                }
                if (this.bot.options.miscSettings.skipItemsInTrade.enable && this.bot.trades.isInTrade(assetid)) {
                    continue;
                }
                const added = offer.addMyItem({ appid: 440, contextid: '2', assetid });
                if (added) {
                    scrapNeeded -= value;
                }
                if (scrapNeeded <= 0) {
                    break;
                }
            }
        }

        // Second pass: allow overshoot with larger coins if still short
        if (scrapNeeded > 0) {
            for (const { sku, value } of order) {
                if (scrapNeeded <= 0) {
                    break;
                }
                const assets = inv.findBySKU(sku, true);
                for (const assetid of assets) {
                    if (this.bot.options.miscSettings.skipItemsInTrade.enable && this.bot.trades.isInTrade(assetid)) {
                        continue;
                    }
                    // Skip if already in offer — tradeoffer-manager doesn't expose easy check; rely on inventory
                    const added = offer.addMyItem({ appid: 440, contextid: '2', assetid });
                    if (added) {
                        scrapNeeded -= value;
                    }
                    if (scrapNeeded <= 0) {
                        break;
                    }
                }
            }
        }

        return Math.max(0, scrapNeeded);
    }

    /**
     * Returns job id if this incoming offer should be auto-accepted as a hive transfer.
     */
    matchIncomingHiveOffer(
        partnerSteamId: string,
        ourItems: Record<string, number>,
        theirItems: Record<string, number>,
        offerMessage: string
    ): string | null {
        if (!this.client.enabled) {
            return null;
        }
        if (!this.client.linkedSteamIds.has(partnerSteamId)) {
            return null;
        }

        // We must give nothing; they give pure only
        const ourSkus = Object.keys(ourItems);
        if (ourSkus.length > 0) {
            return null;
        }

        let keys = 0;
        let scrap = 0;
        for (const sku of Object.keys(theirItems)) {
            if (!PURE_SKUS.has(sku)) {
                return null;
            }
            const amount = theirItems[sku];
            if (sku === '5021;6') {
                keys += amount;
            } else if (sku === '5002;6') {
                scrap += amount * 9;
            } else if (sku === '5001;6') {
                scrap += amount * 3;
            } else if (sku === '5000;6') {
                scrap += amount;
            }
        }

        if (keys < 1 && scrap < 1) {
            return null;
        }

        if (offerMessage && offerMessage.startsWith(HIVE_JOB_MESSAGE_PREFIX)) {
            const jobId = offerMessage.slice(HIVE_JOB_MESSAGE_PREFIX.length).trim();
            const byId = this.client.findJobById(jobId);
            if (byId && byId.toSteamId === this.client.steamId && byId.fromSteamId === partnerSteamId) {
                return jobId;
            }
        }

        const job = this.client.findInboundJob(partnerSteamId, keys, scrap);
        return job ? job.id : null;
    }
}
