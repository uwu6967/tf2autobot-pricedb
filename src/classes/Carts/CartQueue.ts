import SteamID from 'steamid';
import * as inspect from 'util';
import dayjs from 'dayjs';
import pluralize from 'pluralize';
import Cart from './Cart';
import Bot from '../Bot';
import log from '../../lib/logger';
import { sendAlert } from '../DiscordWebhook/export';
import { uptime } from '../../lib/tools/export';
import { isBptfBanned } from '../../lib/bans';
import { isInventoryLoadFailure, isSteamInventoryRateLimit } from './inventoryLoadError';

export default class CartQueue {
    private carts: Cart[] = [];

    private busy = false;

    private queuePositionCheck: NodeJS.Timeout;

    private inventoryRetryTimer: NodeJS.Timeout | null = null;

    private inventoryRetryPending: {
        isDonating: boolean;
        isBuyingPremium: boolean;
        steamID64: string;
    } | null = null;

    constructor(private readonly bot: Bot) {
        this.bot = bot;
    }

    enqueue(cart: Cart, isDonating: boolean, isBuyingPremium: boolean): number {
        // TODO: Priority queueing

        log.debug('Enqueueing cart');

        if (this.getPosition(cart.partner) !== -1) {
            log.debug('Already in the queue');
            // Already in the queue
            return -1;
        }

        const position = this.carts.length;

        log.debug(`Added cart to queue at position ${position}`);

        this.carts.push(cart);

        setImmediate(() => {
            // Using set immediate so that the queue will first be handled when done with this event loop cycle
            this.handleQueue(isDonating, isBuyingPremium);
        });

        clearTimeout(this.queuePositionCheck);
        this.queueCheck(cart.partner.getSteamID64());

        return position;
    }

    private queueCheck(steamID: string): void {
        log.debug(`Checking queue position in 3 minutes...`);
        this.queuePositionCheck = setTimeout(() => {
            void this.queueCheckRestartBot(steamID);
        }, 3 * 60 * 1000);
    }

    private async queueCheckRestartBot(steamID: string): Promise<void> {
        const position = this.carts.length;
        log.debug(`Current queue position: ${position}`);

        if (position >= 2) {
            const dwEnabled =
                this.bot.options.discordWebhook.sendAlert.enable &&
                this.bot.options.discordWebhook.sendAlert.url.main !== '';

            // determine whether it's good time to restart or not
            try {
                // test if backpack.tf is alive by performing bptf banned check request
                await isBptfBanned({ steamID, bptfApiKey: this.bot.options.bptfApiKey, userID: this.bot.userID });
            } catch (err) {
                // do not restart, try again after 3 minutes
                clearTimeout(this.queuePositionCheck);
                this.queueCheck(steamID);

                log.error('Failed to perform restart - bptf down: ', err);

                if (dwEnabled) {
                    return sendAlert('queue-problem-not-restart-bptf-down', this.bot, err as string, position);
                } else {
                    const errStringify = JSON.stringify(err);
                    const errMessage = errStringify === '' ? (err as Error)?.message : errStringify;
                    return this.bot.messageAdmins(
                        `❌ Unable to perform automatic restart due to Escrow check problem, which has failed for ${pluralize(
                            'time',
                            position,
                            true
                        )} because backpack.tf is currently down: ${errMessage}`,
                        []
                    );
                }
            }

            const now = dayjs().tz('UTC').format('dddd THH:mm');
            const array30Minutes = [];
            array30Minutes.length = 30;

            const isSteamNotGoodNow =
                now.includes('Tuesday') && array30Minutes.some((v, i) => now.includes(`T23:${i < 10 ? `0${i}` : i}`));

            if (isSteamNotGoodNow) {
                // do not restart during Steam weekly maintenance, try again after 3 minutes
                clearTimeout(this.queuePositionCheck);
                this.queueCheck(steamID);

                log.warn('Failed to perform restart - Steam is not good now: ');

                if (dwEnabled) {
                    return sendAlert('queue-problem-not-restart-steam-maintenance', this.bot, null, position);
                } else {
                    return this.bot.messageAdmins(
                        `❌ Unable to perform automatic restart due to Escrow check problem, which has failed for ${pluralize(
                            'time',
                            position,
                            true
                        )} because Steam is currently down.`,
                        []
                    );
                }
            } else {
                // Good to perform automatic restart
                if (dwEnabled) {
                    sendAlert('queue-problem-perform-restart', this.bot, null, position);
                    void this.bot.botManager
                        .restartProcess()
                        .then(restarting => {
                            if (!restarting) {
                                return sendAlert('failedPM2', this.bot);
                            }
                            this.bot.sendMessage(steamID, 'Sorry! Something went wrong. I am restarting myself...');
                        })
                        .catch(err => {
                            log.error('Error occurred while trying to restart: ', err);
                            sendAlert('failedRestartError', this.bot, null, null, err);
                            // try again after 3 minutes
                            clearTimeout(this.queuePositionCheck);
                            this.queueCheck(steamID);
                        });
                } else {
                    this.bot.messageAdmins(`⚠️ [Queue alert] Current position: ${position}\n\n${uptime()}`, []);
                    void this.bot.botManager
                        .restartProcess()
                        .then(restarting => {
                            if (!restarting) {
                                return this.bot.messageAdmins(
                                    '❌ Automatic restart on queue problem failed because are not running the bot with PM2!',
                                    []
                                );
                            }
                            this.bot.messageAdmins(`🔄 Restarting...`, []);
                            this.bot.sendMessage(steamID, 'Queue problem detected, restarting...');
                        })
                        .catch(err => {
                            log.error('Error occurred while trying to restart: ', err);
                            this.bot.messageAdmins(
                                `❌ An error occurred while trying to restart: ${(err as Error).message}`,
                                []
                            );
                            // try again after 3 minutes
                            clearTimeout(this.queuePositionCheck);
                            this.queueCheck(steamID);
                        });
                }
            }
        }
    }

    dequeue(steamID: SteamID | string): boolean {
        log.debug('Dequeueing cart');
        const position = this.getPosition(steamID);

        if (position === -1) {
            log.debug('Cart is not in the queue');
            return false;
        }

        const steamID64 = steamID.toString();
        if (this.inventoryRetryPending?.steamID64 === steamID64) {
            this.clearInventoryRetry();
            this.busy = false;
        }

        this.carts.splice(position, 1);
        log.debug('Removed cart from the queue');

        return true;
    }

    getPosition(steamID: SteamID | string): number {
        const steamID64 = steamID.toString();
        const position = this.carts.findIndex(cart => cart.partner.toString() === steamID64);
        return position;
    }

    getCart(steamID: SteamID | string): Cart | null {
        const index = this.getPosition(steamID);
        if (index === -1) {
            return null;
        }

        return this.carts[index];
    }

    private clearInventoryRetry(): void {
        if (this.inventoryRetryTimer) {
            clearTimeout(this.inventoryRetryTimer);
            this.inventoryRetryTimer = null;
        }
        this.inventoryRetryPending = null;
    }

    private getInventoryRetryDelaySeconds(err: unknown, failCount: number): number {
        const cfg = this.bot.options.miscSettings.cartInventoryRetry;
        const base = isSteamInventoryRateLimit(err)
            ? cfg?.rateLimitDelaySeconds ?? 120
            : cfg?.delaySeconds ?? 60;
        // Soft backoff: 1x, 1.5x, 2.25x… capped at 5 minutes
        return Math.min(300, Math.round(base * Math.pow(1.5, Math.max(0, failCount - 1))));
    }

    private scheduleInventoryRetry(
        cart: Cart,
        isDonating: boolean,
        isBuyingPremium: boolean,
        attempt: number,
        maxAttempts: number,
        delaySeconds: number
    ): void {
        const steamID64 = cart.partner.getSteamID64();
        this.clearInventoryRetry();
        this.inventoryRetryPending = { isDonating, isBuyingPremium, steamID64 };
        this.busy = true;

        this.inventoryRetryTimer = setTimeout(() => {
            this.inventoryRetryTimer = null;
            this.inventoryRetryPending = null;

            if (this.carts[0]?.partner.getSteamID64() !== steamID64) {
                log.debug('Inventory retry skipped — cart no longer at front of queue');
                this.busy = false;
                this.handleQueue(false, false);
                return;
            }

            if (cart.isCanceled) {
                log.debug('Inventory retry skipped — cart was canceled');
                this.carts.shift();
                this.busy = false;
                this.handleQueue(false, false);
                return;
            }

            cart.sendNotification = `🔄 Retrying your offer now (attempt ${attempt}/${maxAttempts})...`;
            this.busy = false;
            this.handleQueue(isDonating, isBuyingPremium);
        }, delaySeconds * 1000);
    }

    private notifyInventoryRetry(
        cart: Cart,
        attempt: number,
        maxAttempts: number,
        delaySeconds: number,
        exhausted: boolean,
        rateLimited: boolean
    ): void {
        const steamID64 = cart.partner.getSteamID64();
        const name = this.bot.friends.getFriend(cart.partner)?.player_name ?? steamID64;

        if (exhausted) {
            const buyerMsg =
                `❌ Failed to load your inventory after ${maxAttempts} attempts. ` +
                `Steam might be rate-limiting or down, or your profile/inventory is private. Please try again later.`;
            cart.sendNotification = buyerMsg;

            const discordMsg =
                `❌ **Cart inventory load failed** (gave up)\n` +
                `Partner: ${name} (\`${steamID64}\`)\n` +
                `Attempts: ${attempt}/${maxAttempts}`;

            this.sendDiscordInventoryNotice(discordMsg, cart, attempt, maxAttempts, delaySeconds, true);
            return;
        }

        cart.sendNotification =
            `⏳ Failed to load your inventory${rateLimited ? ' (Steam rate limit 429)' : ''}. ` +
            `Retrying in ${delaySeconds} seconds (attempt ${attempt}/${maxAttempts}). ` +
            `Please keep your inventory public.`;

        const discordMsg =
            `⏳ **Cart inventory load failed — retry scheduled**${rateLimited ? ' (429)' : ''}\n` +
            `Partner: ${name} (\`${steamID64}\`)\n` +
            `Retry in: **${delaySeconds}s**\n` +
            `Attempt: ${attempt}/${maxAttempts}`;

        this.sendDiscordInventoryNotice(discordMsg, cart, attempt, maxAttempts, delaySeconds, false);
    }

    private sendDiscordInventoryNotice(
        content: string,
        cart: Cart,
        attempt: number,
        maxAttempts: number,
        delaySeconds: number,
        exhausted: boolean
    ): void {
        const opt = this.bot.options;
        const dwEnabled =
            opt.discordWebhook.sendAlert.enable && opt.discordWebhook.sendAlert.url.main !== '';

        if (dwEnabled) {
            sendAlert(
                'cart-inventory-retry',
                this.bot,
                content,
                attempt,
                null,
                [cart.partner.getSteamID64(), String(maxAttempts), String(delaySeconds), exhausted ? '1' : '0']
            );
        } else {
            this.bot.messageAdmins(content.replace(/\*\*/g, ''), []);
        }

        void this.bot.discordBot?.sendOpsChannelMessage(content);
    }

    private handleQueue(isDonating: boolean, isBuyingPremium: boolean): void {
        log.debug('Handling queue...');

        if (this.busy || this.carts.length === 0) {
            log.debug('Already handling queue or queue is empty');
            return;
        }

        this.busy = true;

        const cart = this.carts[0];

        log.debug('Handling cart for ' + cart.partner.getSteamID64());

        log.debug('Constructing offer');

        const custom = this.bot.options.commands.addToQueue;
        let keepInQueueForRetry = false;

        Promise.resolve(cart.constructOffer())
            .then(alteredMessage => {
                log.debug('Constructed offer');
                if (alteredMessage) {
                    cart.sendNotification = custom.alteredOffer
                        ? custom.alteredOffer.replace(/%altered%/g, alteredMessage)
                        : `⚠️ Your offer has been altered. Reason: ${alteredMessage}.`;
                }

                const summarize = cart.summarize(isDonating, isBuyingPremium);

                const sendNotification = isDonating
                    ? custom.processingOffer.donation
                        ? custom.processingOffer.donation.replace(/%summarize%/g, summarize)
                        : `⌛ Please wait while I process your donation! ${summarize}.`
                    : isBuyingPremium
                    ? custom.processingOffer.isBuyingPremium
                        ? custom.processingOffer.isBuyingPremium.replace(/%summarize%/g, summarize)
                        : `⌛ Please wait while I process your premium purchase! ${summarize}.`
                    : custom.processingOffer.offer
                    ? custom.processingOffer.offer.replace(/%summarize%/g, summarize)
                    : `⌛ Please wait while I process your offer! ${summarize}.`;

                cart.sendNotification = sendNotification;

                log.debug('Sending offer...');
                return cart.sendOffer();
            })
            .then(async status => {
                log.debug('Sent offer');
                if (status === 'pending') {
                    const sendNotification = isDonating
                        ? custom.hasBeenMadeAcceptingMobileConfirmation.donation
                            ? custom.hasBeenMadeAcceptingMobileConfirmation.donation
                            : `⌛ Your donation has been made! Please wait while I accept the mobile confirmation.`
                        : isBuyingPremium
                        ? custom.hasBeenMadeAcceptingMobileConfirmation.isBuyingPremium
                            ? custom.hasBeenMadeAcceptingMobileConfirmation.isBuyingPremium
                            : `⌛ Your premium purchase has been made! Please wait while I accept the mobile confirmation.`
                        : custom.hasBeenMadeAcceptingMobileConfirmation.offer
                        ? custom.hasBeenMadeAcceptingMobileConfirmation.offer
                        : `⌛ Your offer has been made! Please wait while I accept the mobile confirmation.`;

                    cart.sendNotification = sendNotification;

                    log.debug('Accepting mobile confirmation...');

                    // Wait for confirmation to be accepted
                    await this.bot.trades.acceptConfirmation(cart.getOffer).catch(() => {
                        return;
                    });
                    return;
                }
            })
            .catch(err => {
                const retryOpt = this.bot.options.miscSettings.cartInventoryRetry;
                const retryEnabled = retryOpt?.enable !== false;
                const maxAttempts = retryOpt?.maxAttempts ?? 8;

                if (retryEnabled && isInventoryLoadFailure(err)) {
                    cart.inventoryLoadAttempts += 1;
                    const attempt = cart.inventoryLoadAttempts;
                    const rateLimited = isSteamInventoryRateLimit(err);
                    const delaySeconds = this.getInventoryRetryDelaySeconds(err, attempt);

                    if (attempt < maxAttempts) {
                        keepInQueueForRetry = true;
                        this.notifyInventoryRetry(
                            cart,
                            attempt,
                            maxAttempts,
                            delaySeconds,
                            false,
                            rateLimited
                        );
                        this.scheduleInventoryRetry(
                            cart,
                            isDonating,
                            isBuyingPremium,
                            attempt + 1,
                            maxAttempts,
                            delaySeconds
                        );
                        return;
                    }

                    this.notifyInventoryRetry(cart, attempt, maxAttempts, delaySeconds, true, rateLimited);
                    return;
                }

                if (!(err instanceof Error)) {
                    cart.sendNotification = `❌ I failed to make the offer! Reason: ${err as string}.`;
                } else {
                    log.warn('Failed to make offer');
                    log.error(inspect.inspect(err));

                    if (err.message.includes("cause: 'TargetCannotTrade'")) {
                        cart.sendNotification =
                            "❌ You're unable to trade. More information will be shown to you if you invite me to trade.";
                    } else {
                        cart.sendNotification =
                            '❌ Something went wrong while trying to make the offer, try again later!';
                    }
                }
            })
            .finally(() => {
                if (keepInQueueForRetry) {
                    log.debug(
                        `Keeping cart ${cart.partner.getSteamID64()} in queue for inventory retry`
                    );
                    return;
                }

                log.debug(`Done handling cart ${cart.partner.getSteamID64()}`);

                // Remove cart from the queue
                this.carts.shift();

                // Now ready to handle a different cart
                this.busy = false;

                // Handle the queue
                this.handleQueue(false, false);
            });
    }
}
