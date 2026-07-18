/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */

import {
    Client,
    GatewayIntentBits,
    Message,
    DiscordAPIError,
    Snowflake,
    ActivityType,
    TextChannel,
    Interaction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    ButtonInteraction,
    APIEmbed
} from 'discord.js';
import log from '../lib/logger';
import Options from './Options';
import Bot from './Bot';
import SteamID from 'steamid';
import TradeOfferManager, { ItemsDict, Meta, TradeOffer } from '@tf2autobot/tradeoffer-manager';
import SKU from '@tf2autobot/tf2-sku';
import { DiscordRedirectTarget } from '../lib/discordRedirect';
import { BOT_COMMAND_NAMES, getSlashCommandDefinitions, resolveSlashRoute } from './DiscordSlashCommands';
import { EntryData, PricelistChangedSource } from './Pricelist';

interface PendingTradeAutoAdd {
    items: { sku: string; name: string }[];
    added: Set<number>;
    createdAt: number;
}

export default class DiscordBot {
    readonly client: Client;

    private prefix = '!';

    private MAX_MESSAGE_LENGTH = 2000 - 2; // some characters are reserved

    private readonly pendingTradeAutoAdds = new Map<string, PendingTradeAutoAdd>();

    constructor(private options: Options, private bot: Bot) {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        // 'ready' binding should be executed BEFORE the login() is complete
        /* eslint-disable */
        this.client.on('ready', this.onClientReady.bind(this));
        this.client.on('messageCreate', async message => this.onMessage(message));
        this.client.on('interactionCreate', async interaction => this.onInteraction(interaction));
        /* eslint-enable */
        this.prefix = this.bot.options.miscSettings?.prefixes?.discord ?? this.prefix;
    }

    private static readonly UNHALT_BUTTON_ID = 'tf2autobot:unhalt';
    private static readonly FACCEPT_PREFIX = 'tf2autobot:faccept:';
    private static readonly FDECLINE_PREFIX = 'tf2autobot:fdecline:';
    private static readonly AUTOADD_PREFIX = 'tf2autobot:autoadd:';
    private static readonly PURE_SKUS = new Set(['5000;6', '5001;6', '5002;6', '5021;6']);
    private static readonly AUTOADD_MAX_ITEMS = 20;
    private static readonly AUTOADD_TTL_MS = 24 * 60 * 60 * 1000;

    public async start(): Promise<void> {
        try {
            await this.client.login(this.options.discordBotToken);
            await this.registerSlashCommands();
        } catch (err) {
            const error = err as DiscordAPIError;

            if (error.code && error.code.toString() === 'TOKEN_INVALID') {
                log.error('Failed to login to Discord: bot token is invalid.');
                throw error; // only "incorrect token" error should crash the bot, so "throw" is only here
            } else {
                log.error('Failed to login to Discord, please use Steam chat for now. Error summary:', error);
                this.admins.forEach(admin => {
                    this.bot.sendMessage(
                        admin,
                        'Failed to log in to Discord. You can still use commands in here.\n' +
                            `If https://discordstat.us doesn't indicate any problems right now, you can try to restart.\n` +
                            `If restarting didn't fix the problem - please ask for help on TF2Autobot Discord server: https://pricedb.io/discord`
                    );
                });
            }
        }
    }

    /**
     * After the bot finishes booting in halt mode, post an Unhalt button in Discord.
     */
    public async sendStartupUnhaltButton(): Promise<void> {
        const cfg = this.options.discordChat?.unhaltButton;
        if (cfg?.enable === false) {
            return;
        }

        if (!this.bot.isHalted) {
            return;
        }

        const content =
            '🛑 Bot started in **halt** mode (not trading, listings removed).\n' +
            'Click **Unhalt** when you are ready to go live.';
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(DiscordBot.UNHALT_BUTTON_ID)
                .setLabel('Unhalt')
                .setStyle(ButtonStyle.Success)
        );
        const payload = { content, components: [row] };

        try {
            const channelId = cfg?.channelId?.trim();
            if (channelId) {
                const channel = await this.client.channels.fetch(channelId);
                if (channel && channel.isTextBased() && !channel.isDMBased()) {
                    await channel.send(payload);
                    log.info(`Sent startup Unhalt button to channel ${channelId}`);
                    return;
                }
                log.warn(`discordChat.unhaltButton.channelId ${channelId} is not a usable text channel`);
            }

            // Prefer the guild system / first text channel so it shows "in chat"
            for (const guild of this.client.guilds.cache.values()) {
                const preferred =
                    guild.systemChannel ??
                    guild.channels.cache.find(
                        ch =>
                            ch.type === ChannelType.GuildText &&
                            ch.viewable &&
                            ch.permissionsFor(guild.members.me)?.has('SendMessages')
                    );

                if (preferred && preferred.isTextBased()) {
                    await preferred.send(payload);
                    log.info(`Sent startup Unhalt button to #${preferred.name} in ${guild.name}`);
                    return;
                }
            }

            // Fallback: DM admins
            for (const admin of this.admins) {
                const user = await this.client.users.fetch(admin.discordID).catch(() => null);
                if (!user || user.bot) {
                    continue;
                }
                await user.send(payload).catch(err => {
                    log.warn(`Failed to DM Unhalt button to admin ${admin.discordID}:`, err);
                });
            }
            log.info('Sent startup Unhalt button via admin DMs (no guild channel available)');
        } catch (err) {
            log.error('Failed to send startup Unhalt button:', err);
        }
    }

    /**
     * Post a plain message to the configured ops channel (unhaltButton.channelId), if set.
     */
    public async sendOpsChannelMessage(content: string): Promise<void> {
        const channel = await this.getOpsTextChannel();
        if (!channel) {
            return;
        }

        try {
            await channel.send({ content: content.slice(0, 2000) });
        } catch (err) {
            log.warn('Failed to send ops channel message:', err);
        }
    }

    /**
     * Post FAccept / Decline buttons for an offer waiting for review.
     */
    public async sendOfferReviewButtons(options: {
        offerId: string;
        partnerName: string;
        partnerSteamId: string;
        reasons: string;
    }): Promise<void> {
        if (!this.client.isReady()) {
            return;
        }

        const channel = await this.getOpsTextChannel();
        if (!channel) {
            log.warn('Cannot send offer review buttons — no ops channel configured');
            return;
        }

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`${DiscordBot.FACCEPT_PREFIX}${options.offerId}`)
                .setLabel('FAccept')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`${DiscordBot.FDECLINE_PREFIX}${options.offerId}`)
                .setLabel('Decline')
                .setStyle(ButtonStyle.Danger)
        );

        const content =
            `⚠️ Offer \`#${options.offerId}\` from **${options.partnerName}** is waiting for review.\n` +
            `Reasons: ${options.reasons}\n` +
            `Partner: https://steamcommunity.com/profiles/${options.partnerSteamId}`;

        try {
            await channel.send({ content, components: [row] });
            log.info(`Sent offer review buttons for #${options.offerId}`);
        } catch (err) {
            log.warn(`Failed to send offer review buttons for #${options.offerId}:`, err);
        }
    }

    /**
     * After an accepted trade, post numbered Auto-add buttons for items we received
     * that are not already in the pricelist (excludes pure / weapons-as-currency).
     */
    public async sendTradeAutoAddButtons(offer: TradeOffer): Promise<void> {
        if (!this.client.isReady()) {
            return;
        }

        const items = this.getAddableItemsFromOffer(offer);
        if (items.length === 0) {
            return;
        }

        const channel = await this.getOpsTextChannel();
        if (!channel) {
            log.warn('Cannot send trade auto-add buttons — no ops channel configured');
            return;
        }

        const offerId = String(offer.id);
        this.pruneExpiredAutoAdds();
        this.pendingTradeAutoAdds.set(offerId, {
            items,
            added: new Set(),
            createdAt: Date.now()
        });

        const { content, components } = this.buildAutoAddMessage(offerId, items, new Set());

        try {
            await channel.send({ content, components });
            log.info(`Sent trade auto-add buttons for #${offerId} (${items.length} items)`);
        } catch (err) {
            this.pendingTradeAutoAdds.delete(offerId);
            log.warn(`Failed to send trade auto-add buttons for #${offerId}:`, err);
        }
    }

    private getAddableItemsFromOffer(offer: TradeOffer): { sku: string; name: string }[] {
        const dict = offer.data('dict') as ItemsDict | undefined;
        if (!dict?.their) {
            return [];
        }

        const weaponsAsCurrency = this.bot.handler.isWeaponsAsCurrency;
        const craftWeapons = this.bot.craftWeapons;
        const uncraftWeapons = this.bot.uncraftWeapons;

        const out: { sku: string; name: string }[] = [];
        for (const sku of Object.keys(dict.their)) {
            if (DiscordBot.PURE_SKUS.has(sku)) {
                continue;
            }

            if (
                weaponsAsCurrency.enable &&
                (craftWeapons.includes(sku) || (weaponsAsCurrency.withUncraft && uncraftWeapons.includes(sku)))
            ) {
                continue;
            }

            if (this.bot.pricelist.hasPrice({ priceKey: sku })) {
                continue;
            }

            let name: string;
            try {
                name = this.bot.schema.getName(SKU.fromString(sku), false);
            } catch {
                name = sku;
            }

            out.push({ sku, name });
            if (out.length >= DiscordBot.AUTOADD_MAX_ITEMS) {
                break;
            }
        }

        return out;
    }

    private buildAutoAddMessage(
        offerId: string,
        items: { sku: string; name: string }[],
        added: Set<number>
    ): { content: string; components: ActionRowBuilder<ButtonBuilder>[] } {
        const lines = items.map((item, i) => {
            const mark = added.has(i) ? '✅' : `${i + 1}.`;
            return `${mark} ${item.name} (\`${item.sku}\`)`;
        });

        let content =
            `📥 **Auto-add from trade \`#${offerId}\`?**\n` +
            `Items we received (not yet in pricelist):\n` +
            lines.join('\n');

        if (content.length > 1900) {
            content = content.slice(0, 1890) + '\n…';
        }

        const components: ActionRowBuilder<ButtonBuilder>[] = [];
        const pendingIndexes = items.map((_, i) => i).filter(i => !added.has(i));

        for (let i = 0; i < pendingIndexes.length; i += 5) {
            const chunk = pendingIndexes.slice(i, i + 5);
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                ...chunk.map(idx =>
                    new ButtonBuilder()
                        .setCustomId(`${DiscordBot.AUTOADD_PREFIX}${offerId}:${idx}`)
                        .setLabel(String(idx + 1))
                        .setStyle(ButtonStyle.Primary)
                )
            );
            components.push(row);
        }

        if (pendingIndexes.length > 0) {
            // Discord allows max 5 rows; keep All on its own row when possible
            if (components.length >= 5) {
                // Drop last number row capacity: put All on last row if room, else skip All
                const last = components[components.length - 1];
                if (last.components.length < 5) {
                    last.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`${DiscordBot.AUTOADD_PREFIX}${offerId}:all`)
                            .setLabel('All')
                            .setStyle(ButtonStyle.Success)
                    );
                }
            } else {
                components.push(
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`${DiscordBot.AUTOADD_PREFIX}${offerId}:all`)
                            .setLabel('All')
                            .setStyle(ButtonStyle.Success)
                    )
                );
            }
        }

        return { content, components };
    }

    private pruneExpiredAutoAdds(): void {
        const now = Date.now();
        for (const [id, pending] of this.pendingTradeAutoAdds) {
            if (now - pending.createdAt > DiscordBot.AUTOADD_TTL_MS) {
                this.pendingTradeAutoAdds.delete(id);
            }
        }
    }

    private async getOpsTextChannel(): Promise<TextChannel | null> {
        const channelId = this.options.discordChat?.unhaltButton?.channelId?.trim();
        if (!channelId || !this.client.isReady()) {
            return null;
        }

        try {
            const channel = await this.client.channels.fetch(channelId);
            if (channel && channel.isTextBased() && !channel.isDMBased()) {
                return channel as TextChannel;
            }
        } catch (err) {
            log.warn('Failed to fetch ops channel:', err);
        }

        return null;
    }

    private async registerSlashCommands(): Promise<void> {
        const definitions = getSlashCommandDefinitions();

        // Guild commands update instantly. Clear global commands so Discord does not
        // show duplicates (guild + global with the same name).
        await this.client.application.commands.set([]);
        log.info('Cleared global Discord slash commands');

        const guilds = [...this.client.guilds.cache.values()];
        for (const guild of guilds) {
            await guild.commands.set(definitions);
            log.info(
                `Registered ${definitions.length} Discord slash commands for guild ${guild.name} (${guild.id})`
            );
        }

        if (guilds.length === 0) {
            log.warn('No Discord guilds available to register slash commands');
        }
    }

    public stop(): void {
        log.info('Logging out from Discord...');
        void this.client.destroy();
    }

    public async onMessage(message: Message): Promise<void> {
        if (message.author === this.client.user) {
            return; // don't talk to myself
        }

        if (message.webhookId) {
            return; // Ignore webhook messages
        }

        if (!message.content.startsWith(this.prefix) && !message.content.startsWith('/')) {
            return; // Ignore message that not start with configured prefix or /
        }

        // Allow "/" as an alternate Discord text-command prefix (same as !)
        const content =
            message.content.startsWith('/') && !message.content.startsWith(this.prefix)
                ? this.prefix + message.content.slice(1)
                : message.content;

        log.info(
            `Got new message ${String(message.content)} from ${message.author.tag} (${String(message.author.id)})`
        );

        if (!this.bot.isReady) {
            this.sendAnswer(message, '🛑 The bot is still booting up, please wait');
            return;
        }

        try {
            if (!this.isDiscordAdmin(message.author.id)) {
                // Will return default invalid value
                const dummySteamID = new SteamID(null);
                dummySteamID.redirectAnswerTo = message;
                await this.bot.handler.onMessage(dummySteamID, content);
                return;
            }

            const adminID = this.getAdminBy(message.author.id);
            adminID.redirectAnswerTo = message;
            await this.bot.handler.onMessage(adminID, content);
        } catch (err) {
            log.error(err);
            (message.channel as TextChannel)
                .send(`❌ Error:\n${JSON.stringify(err)}`)
                .catch(err => log.error('Failed to send error message to Discord:', err));
        }
    }

    private static reformat(message: string): string {
        if (message.startsWith('/code')) {
            return '```json\n' + message.slice(6) + '\n```';
        } else if (message.startsWith('/pre2')) {
            return '```\n' + message.slice(5) + '\n```';
        } else if (message.startsWith('/pre')) {
            return '>>> ' + message.slice(5);
        } else {
            return message;
        }
    }

    private async onInteraction(interaction: Interaction): Promise<void> {
        if (interaction.isButton()) {
            await this.onButtonInteraction(interaction);
            return;
        }

        if (interaction.isAutocomplete()) {
            if (interaction.commandName !== 'run') {
                return;
            }

            const focused = interaction.options.getFocused().toLowerCase();
            const choices = BOT_COMMAND_NAMES.filter(name => name.startsWith(focused) || focused === '').slice(0, 25);
            await interaction.respond(choices.map(name => ({ name, value: name })));
            return;
        }

        if (!interaction.isChatInputCommand()) {
            return;
        }

        const route = resolveSlashRoute(interaction.commandName, {
            getString: name => interaction.options.getString(name),
            getInteger: name => interaction.options.getInteger(name),
            getNumber: name => interaction.options.getNumber(name),
            getBoolean: name => interaction.options.getBoolean(name)
        });

        if (!route) {
            await interaction.reply({
                content:
                    '❌ Missing or invalid options. For `/add` and `/update` you need **lookup**, **value**, and **intent** (add only).',
                ephemeral: true
            });
            return;
        }

        log.info(`Got slash /${interaction.commandName} from ${interaction.user.tag} (${interaction.user.id})`);

        if (!this.bot.isReady) {
            await interaction.reply({ content: '🛑 The bot is still booting up, please wait', ephemeral: true });
            return;
        }

        if (route.adminOnly && !this.isDiscordAdmin(interaction.user.id)) {
            await interaction.reply({
                content: '⛔ That command is admin-only. Your Discord ID must be listed in ADMINS in the bot `.env`.',
                ephemeral: true
            });
            return;
        }

        try {
            await interaction.deferReply();

            if (route.adminOnly) {
                const adminID = this.getAdminBy(interaction.user.id);
                adminID.redirectAnswerTo = interaction;
                await this.bot.handler.onMessage(adminID, route.prefixMessage);
                return;
            }

            const dummySteamID = new SteamID(null);
            dummySteamID.redirectAnswerTo = interaction;
            await this.bot.handler.onMessage(dummySteamID, route.prefixMessage);
        } catch (err) {
            log.error(err);
            const errText = `❌ Error:\n${JSON.stringify(err)}`;
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: errText }).catch(() => undefined);
            } else {
                await interaction.reply({ content: errText, ephemeral: true }).catch(() => undefined);
            }
        }
    }

    private async onButtonInteraction(interaction: Interaction): Promise<void> {
        if (!interaction.isButton()) {
            return;
        }

        const customId = interaction.customId;

        if (customId === DiscordBot.UNHALT_BUTTON_ID) {
            await this.handleUnhaltButton(interaction);
            return;
        }

        if (customId.startsWith(DiscordBot.FACCEPT_PREFIX) || customId.startsWith(DiscordBot.FDECLINE_PREFIX)) {
            await this.handleOfferReviewButton(interaction);
            return;
        }

        if (customId.startsWith(DiscordBot.AUTOADD_PREFIX)) {
            await this.handleTradeAutoAddButton(interaction);
            return;
        }
    }

    private async handleUnhaltButton(interaction: ButtonInteraction): Promise<void> {
        if (!this.isDiscordAdmin(interaction.user.id)) {
            await interaction.reply({
                content: '⛔ Only admins can unhalt the bot.',
                ephemeral: true
            });
            return;
        }

        if (!this.bot.isReady) {
            await interaction.reply({ content: '🛑 Bot is still booting, please wait.', ephemeral: true });
            return;
        }

        if (!this.bot.isHalted) {
            await interaction.update({
                content: '✅ Bot is already online (not halted).',
                components: []
            });
            return;
        }

        try {
            await interaction.deferUpdate();
            const recreateFailed = await this.bot.unhalt();
            const note = recreateFailed
                ? '\n⚠️ Listings recreate reported errors — check bot logs.'
                : '';
            await interaction.editReply({
                content: `✅ Unhalted by <@${interaction.user.id}> — bot is live.${note}`,
                components: []
            });
            log.info(`Discord Unhalt button pressed by ${interaction.user.tag} (${interaction.user.id})`);
        } catch (err) {
            log.error('Failed handling Unhalt button:', err);
            await interaction
                .followUp({ content: `❌ Failed to unhalt: ${String(err)}`, ephemeral: true })
                .catch(() => undefined);
        }
    }

    private async handleOfferReviewButton(interaction: ButtonInteraction): Promise<void> {
        const isAccept = interaction.customId.startsWith(DiscordBot.FACCEPT_PREFIX);
        const offerId = interaction.customId
            .slice(isAccept ? DiscordBot.FACCEPT_PREFIX.length : DiscordBot.FDECLINE_PREFIX.length)
            .trim();

        if (!/^\d+$/.test(offerId)) {
            await interaction.reply({ content: '❌ Invalid offer id on button.', ephemeral: true });
            return;
        }

        if (!this.isDiscordAdmin(interaction.user.id)) {
            await interaction.reply({
                content: '⛔ Only admins can force-accept or decline offers.',
                ephemeral: true
            });
            return;
        }

        if (!this.bot.isReady) {
            await interaction.reply({ content: '🛑 Bot is still booting, please wait.', ephemeral: true });
            return;
        }

        const state = this.bot.manager.pollData.received[offerId];
        if (state === undefined) {
            await interaction.update({
                content: `❌ Offer \`#${offerId}\` no longer exists.`,
                components: []
            });
            return;
        }

        if (state !== TradeOfferManager.ETradeOfferState['Active']) {
            await interaction.update({
                content: `⚠️ Offer \`#${offerId}\` is no longer active (state: ${state}).`,
                components: []
            });
            return;
        }

        const actionLabel = isAccept ? 'FAccept' : 'Decline';

        try {
            await interaction.deferUpdate();
            const offer = await this.bot.trades.getOffer(offerId);
            await this.bot.trades.applyActionToOffer(
                isAccept ? 'accept' : 'decline',
                'MANUAL-FORCE',
                isAccept ? ((offer.data('meta') as Meta) ?? {}) : {},
                offer
            );

            await interaction.editReply({
                content:
                    `${isAccept ? '✅' : '⛔'} **${actionLabel}** on offer \`#${offerId}\` ` +
                    `by <@${interaction.user.id}>`,
                components: []
            });
            log.info(
                `Discord ${actionLabel} button pressed for #${offerId} by ${interaction.user.tag} (${interaction.user.id})`
            );
        } catch (err) {
            log.error(`Failed handling ${actionLabel} button for #${offerId}:`, err);
            const errMsg = err instanceof Error ? err.message : String(err);
            await interaction
                .followUp({
                    content: `❌ Failed to ${actionLabel.toLowerCase()} offer \`#${offerId}\`: ${errMsg}`,
                    ephemeral: true
                })
                .catch(() => undefined);
        }
    }

    private async handleTradeAutoAddButton(interaction: ButtonInteraction): Promise<void> {
        const payload = interaction.customId.slice(DiscordBot.AUTOADD_PREFIX.length);
        const sep = payload.lastIndexOf(':');
        if (sep <= 0) {
            await interaction.reply({ content: '❌ Invalid auto-add button.', ephemeral: true });
            return;
        }

        const offerId = payload.slice(0, sep);
        const target = payload.slice(sep + 1);

        if (!/^\d+$/.test(offerId) || (target !== 'all' && !/^\d+$/.test(target))) {
            await interaction.reply({ content: '❌ Invalid auto-add button.', ephemeral: true });
            return;
        }

        if (!this.isDiscordAdmin(interaction.user.id)) {
            await interaction.reply({
                content: '⛔ Only admins can auto-add items.',
                ephemeral: true
            });
            return;
        }

        if (!this.bot.isReady) {
            await interaction.reply({ content: '🛑 Bot is still booting, please wait.', ephemeral: true });
            return;
        }

        const pending = this.pendingTradeAutoAdds.get(offerId);
        if (!pending) {
            await interaction.update({
                content: `⚠️ Auto-add for trade \`#${offerId}\` expired or was already finished.`,
                components: []
            });
            return;
        }

        const indexes =
            target === 'all'
                ? pending.items.map((_, i) => i).filter(i => !pending.added.has(i))
                : [parseInt(target, 10)];

        if (indexes.some(i => i < 0 || i >= pending.items.length)) {
            await interaction.reply({ content: '❌ Invalid item number.', ephemeral: true });
            return;
        }

        try {
            await interaction.deferUpdate();

            const results: string[] = [];
            for (const idx of indexes) {
                if (pending.added.has(idx)) {
                    results.push(`• #${idx + 1} already added`);
                    continue;
                }

                const item = pending.items[idx];
                if (this.bot.pricelist.hasPrice({ priceKey: item.sku })) {
                    pending.added.add(idx);
                    results.push(`• #${idx + 1} ${item.name} (\`${item.sku}\`) — already in pricelist`);
                    continue;
                }

                const entryData: EntryData = {
                    sku: item.sku,
                    enabled: true,
                    autoprice: true,
                    min: 0,
                    max: 1,
                    intent: 2,
                    note: { buy: null, sell: null },
                    group: 'all',
                    promoted: 0,
                    isPartialPriced: false
                };

                try {
                    const entry = await this.bot.pricelist.addPrice({
                        entryData,
                        emitChange: true,
                        src: PricelistChangedSource.Command
                    });
                    pending.added.add(idx);
                    results.push(`• ✅ #${idx + 1} ${entry.name} (\`${item.sku}\`)`);
                } catch (err) {
                    const errMsg = err instanceof Error ? err.message : String(err);
                    results.push(`• ❌ #${idx + 1} ${item.name} (\`${item.sku}\`): ${errMsg}`);
                }
            }

            const allDone = pending.items.every((_, i) => pending.added.has(i));
            if (allDone) {
                this.pendingTradeAutoAdds.delete(offerId);
                await interaction.editReply({
                    content:
                        `✅ Auto-add finished for trade \`#${offerId}\` by <@${interaction.user.id}>\n` +
                        results.join('\n'),
                    components: []
                });
            } else {
                const { content, components } = this.buildAutoAddMessage(offerId, pending.items, pending.added);
                await interaction.editReply({
                    content:
                        content +
                        `\n\n_Last action by <@${interaction.user.id}>:_\n` +
                        results.join('\n'),
                    components
                });
            }

            log.info(
                `Discord auto-add (${target}) for #${offerId} by ${interaction.user.tag}: ${results.join('; ')}`
            );
        } catch (err) {
            log.error(`Failed handling trade auto-add for #${offerId}:`, err);
            const errMsg = err instanceof Error ? err.message : String(err);
            await interaction
                .followUp({ content: `❌ Auto-add failed: ${errMsg}`, ephemeral: true })
                .catch(() => undefined);
        }
    }

    public sendAnswer(origMessage: DiscordRedirectTarget, messageToSend: string): void {
        messageToSend = messageToSend.trim();
        const formattedMessage = DiscordBot.reformat(messageToSend);

        if (messageToSend == formattedMessage) {
            const lines = messageToSend.split('\n');
            let partialMessage = '';
            for (let i = 0; i < lines.length; i += 1) {
                const line = lines[i];
                if (partialMessage.length + 1 + line.length <= this.MAX_MESSAGE_LENGTH) {
                    if (i == 0) {
                        partialMessage += line;
                    } else {
                        partialMessage += '\n' + line;
                    }
                } else {
                    this.sendAnswerPart(origMessage, partialMessage);
                    partialMessage = line;
                }
            }
            this.sendAnswerPart(origMessage, partialMessage);
        } else {
            this.sendAnswerPart(origMessage, formattedMessage);
        }
    }

    public sendAnswerEmbed(origMessage: DiscordRedirectTarget, embed: APIEmbed): void {
        this.sendAnswerEmbeds(origMessage, [embed]);
    }

    /**
     * Send one or more embeds. First goes as the main reply; extras follow up
     * (or as additional channel messages for classic Discord chat).
     */
    public sendAnswerEmbeds(origMessage: DiscordRedirectTarget, embeds: APIEmbed[]): void {
        if (embeds.length === 0) {
            return;
        }

        const [first, ...rest] = embeds;
        const firstPayload = { embeds: [first] };

        const sendRest = (): void => {
            for (const embed of rest) {
                const payload = { embeds: [embed] };
                if (origMessage instanceof Message) {
                    void (origMessage.channel as TextChannel)
                        .send(payload)
                        .catch((err: unknown) => log.error('Failed to send follow-up embed to Discord:', err));
                } else {
                    void origMessage
                        .followUp(payload)
                        .catch((err: unknown) => log.error('Failed to send Discord embed follow-up:', err));
                }
            }
        };

        if (origMessage instanceof Message) {
            void (origMessage.channel as TextChannel)
                .send(firstPayload)
                .then(() => {
                    log.info(
                        `Embed sent to ${origMessage.author.tag} (${origMessage.author.id}): ${first.title ?? ''}`
                    );
                    sendRest();
                })
                .catch((err: unknown) => log.error('Failed to send embed to Discord:', err));
            return;
        }

        const interaction = origMessage;
        const afterFirst = (): void => {
            log.info(`Slash embed reply to ${interaction.user.tag}: ${first.title ?? ''}`);
            sendRest();
        };

        if (!interaction.deferred && !interaction.replied) {
            void interaction.reply(firstPayload).then(afterFirst);
            return;
        }

        if (interaction.deferred && !interaction.replied) {
            void interaction.editReply(firstPayload).then(afterFirst);
            return;
        }

        void interaction.followUp(firstPayload).then(afterFirst);
    }

    private sendAnswerPart(origMessage: DiscordRedirectTarget, message: string): void {
        if (origMessage instanceof Message) {
            this.sendMessage(origMessage, message);
            return;
        }

        const interaction = origMessage;
        if (message.startsWith('\n')) {
            message = '.' + message;
        }
        if (message.endsWith('\n')) {
            message = message + '.';
        }

        const payload = { content: message.slice(0, this.MAX_MESSAGE_LENGTH) };

        if (!interaction.deferred && !interaction.replied) {
            void interaction.reply(payload).then(() => {
                log.info(`Slash reply to ${interaction.user.tag} (${interaction.user.id}): ${message}`);
            });
            return;
        }

        if (interaction.deferred && !interaction.replied) {
            void interaction.editReply(payload).then(() => {
                log.info(`Slash reply to ${interaction.user.tag} (${interaction.user.id}): ${message}`);
            });
            return;
        }

        void interaction.followUp(payload).then(() => {
            log.info(`Slash follow-up to ${interaction.user.tag} (${interaction.user.id}): ${message}`);
        });
    }

    private sendMessage(origMessage: Message, message: string): void {
        if (message.startsWith('\n')) {
            message = '.' + message;
        }
        if (message.endsWith('\n')) {
            message = message + '.';
        }

        (origMessage.channel as TextChannel)
            .send(message)
            .then(() => log.info(`Message sent to ${origMessage.author.tag} (${origMessage.author.id}): ${message}`))
            .catch((err: any) => log.error('Failed to send message to Discord:', err));
    }

    private async onClientReady() {
        log.info(
            `Logged in to Discord as ${String(this.client.user.tag)} to serve on ${
                this.client.guilds.cache.size
            } servers.`
        );
        this.client.user.setStatus('idle');

        // I don't use try-catch here since the bot has to crash if something went wrong
        this.validateAdmins();

        // DM chats won't emit messageCreate until the first usage. This thing fetches required DM chats.
        for (const admin of this.admins) {
            const adminUser = await this.client.users.fetch(admin.discordID).catch(err => {
                log.error('Failed to fetch admin by id:', err);
            });
            if (adminUser && !adminUser.bot) {
                this.client.users.createDM(adminUser).catch(err => {
                    log.error('Failed to fetch DM channel with admin:', err);
                });
            }
        }
    }

    setPresence(type: 'online' | 'halt'): void {
        const opt = this.bot.options.discordChat[type];

        /* eslint-disable */
        this.client?.user?.setPresence({
            activities: [
                {
                    name: opt.name,
                    type:
                        typeof opt.type === 'string'
                            ? ActivityType[capitalizeFirstLetter(opt.type.toLowerCase())]
                            : opt.type
                }
            ],
            status: opt.status
        });
        /* eslint-enable */
    }

    halt(): void {
        this.setPresence('halt');
    }

    notifyAdmins(message: string): void {
        if (!this.client.isReady()) {
            return;
        }

        const formattedMessage = DiscordBot.reformat(message.trim());

        for (const admin of this.admins) {
            void this.client.users
                .fetch(admin.discordID)
                .then(user =>
                    user.send(formattedMessage.slice(0, this.MAX_MESSAGE_LENGTH)).catch(err => {
                        log.warn(`Failed to send version update DM to Discord admin ${admin.discordID}:`, err);
                    })
                )
                .catch(err => {
                    log.warn(`Failed to fetch Discord admin ${admin.discordID} for version update:`, err);
                });
        }
    }

    unhalt(): void {
        this.setPresence('online');
    }

    isDiscordAdmin(discordID: Snowflake): boolean {
        return this.bot.getAdmins.some(admin => admin.discordID === discordID);
    }

    get admins(): SteamID[] {
        return this.bot.getAdmins.filter(admin => admin.discordID);
    }

    private validateAdmins(): void {
        const uniqueAdmins = new Set<Snowflake>();
        this.admins.forEach(admin => {
            const discordID = admin.discordID;
            if (uniqueAdmins.has(discordID)) {
                throw Error(`ADMINS contains more than one entry with discordID ${discordID}`);
            }
            uniqueAdmins.add(discordID);
        });
    }

    private getAdminBy(discordID: Snowflake): SteamID {
        // Intended to use with all checks made before. Throwing errors just to be sure.

        if (!this.isDiscordAdmin(discordID)) {
            throw Error(`Admin with discordID ${discordID} was not found`);
        }

        const result = this.admins.filter(admin => admin.discordID === discordID);
        return result[0];
    }
}

function capitalizeFirstLetter(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
