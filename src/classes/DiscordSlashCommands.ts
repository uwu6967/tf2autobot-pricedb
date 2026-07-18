import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    RESTPostAPIChatInputApplicationCommandsJSONBody
} from 'discord.js';
import {
    buildLookupOnlyParamString,
    buildPricelistParamString,
    ItemLookupType,
    PricelistSlashFields
} from '../lib/buildPricelistSlashParams';

/** All bot commands for /run autocomplete (without ! prefix). */
export const BOT_COMMAND_NAMES = [
    'help',
    'how2trade',
    'more',
    'price',
    'pc',
    'buy',
    'b',
    'sell',
    's',
    'buycart',
    'sellcart',
    'cart',
    'clearcart',
    'checkout',
    'cancel',
    'queue',
    'time',
    'uptime',
    'pure',
    'rate',
    'owner',
    'discord',
    'links',
    'stock',
    'sku',
    'message',
    'add',
    'addbulk',
    'update',
    'updatebulk',
    'remove',
    'removebulk',
    'get',
    'getall',
    'find',
    'ppu',
    'ppurecalc',
    'getslots',
    'listings',
    'groups',
    'autoadd',
    'stopautoadd',
    'autokeys',
    'hive',
    'deposit',
    'd',
    'withdraw',
    'w',
    'halt',
    'unhalt',
    'haltstatus',
    'stop',
    'restart',
    'updaterepo',
    'refreshlist',
    'refreshautokeys',
    'stats',
    'statsdw',
    'inventory',
    'version',
    'trades',
    'trade',
    'accept',
    'decline',
    'offerinfo',
    'check',
    'pricecheck',
    'pricecheckall',
    'options',
    'config',
    'backup',
    'expand',
    'use',
    'delete',
    'clearfriends',
    'block',
    'unblock',
    'blockedlist',
    'refreshschema',
    'crafttoken',
    'crittfgroup',
    'crittfinvite',
    'crittfinvites',
    'crittfaccept',
    'crittfleave'
] as const;

const ADMIN_ONLY = new Set([
    'add',
    'addbulk',
    'update',
    'updatebulk',
    'remove',
    'removebulk',
    'get',
    'getall',
    'find',
    'ppu',
    'ppurecalc',
    'getslots',
    'listings',
    'groups',
    'autoadd',
    'stopautoadd',
    'autokeys',
    'hive',
    'deposit',
    'd',
    'withdraw',
    'w',
    'halt',
    'unhalt',
    'haltstatus',
    'stop',
    'restart',
    'updaterepo',
    'refreshlist',
    'refreshautokeys',
    'stats',
    'statsdw',
    'inventory',
    'trades',
    'trade',
    'accept',
    'decline',
    'offerinfo',
    'check',
    'pricecheck',
    'pricecheckall',
    'options',
    'config',
    'backup',
    'expand',
    'use',
    'delete',
    'clearfriends',
    'block',
    'unblock',
    'blockedlist',
    'refreshschema',
    'crafttoken',
    'crittfgroup',
    'crittfinvite',
    'crittfinvites',
    'crittfaccept',
    'crittfleave'
]);

const LOOKUP_CHOICES = [
    { name: 'SKU', value: 'sku' },
    { name: 'Asset ID (unique item)', value: 'id' },
    { name: 'Full item name', value: 'item' },
    { name: 'Defindex', value: 'defindex' },
    { name: 'Schema item name', value: 'name' }
] as const;

const INTENT_CHOICES = [
    { name: 'Buy only', value: 'buy' },
    { name: 'Sell only', value: 'sell' },
    { name: 'Buy & sell (bank)', value: 'bank' }
] as const;

export function isAdminSlashCommand(commandName: string): boolean {
    const base = commandName.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
    return ADMIN_ONLY.has(base);
}

export interface SlashOptionReader {
    getString(name: string): string | null;
    getInteger(name: string): number | null;
    getNumber(name: string): number | null;
    getBoolean(name: string): boolean | null;
}

function lookupOption(required = true) {
    return {
        name: 'lookup',
        description: 'How to identify the item',
        type: ApplicationCommandOptionType.String as const,
        required,
        choices: LOOKUP_CHOICES.map(c => ({ name: c.name, value: c.value }))
    };
}

function valueOption(description: string) {
    return {
        name: 'value',
        description,
        type: ApplicationCommandOptionType.String as const,
        required: true
    };
}

function pricelistListingOptions(intentRequired: boolean) {
    return [
        lookupOption(true),
        valueOption('SKU, asset id, item name, defindex, or schema name — depending on lookup'),
        {
            name: 'intent',
            description: 'Listing intent (asset id listings are always sell)',
            type: ApplicationCommandOptionType.String as const,
            required: intentRequired,
            choices: INTENT_CHOICES.map(c => ({ name: c.name, value: c.value }))
        },
        {
            name: 'autoprice',
            description: 'Live PriceDB (sell-only→sell+buy0; buy-only→buy+sell0; bank→both)',
            type: ApplicationCommandOptionType.Boolean as const,
            required: false
        },
        {
            name: 'autopricesell',
            description: 'Manual buy + live sell (set buy_keys/buy_metal)',
            type: ApplicationCommandOptionType.Boolean as const,
            required: false
        },
        {
            name: 'autopricebuy',
            description: 'Manual sell + live buy (set sell_keys/sell_metal)',
            type: ApplicationCommandOptionType.Boolean as const,
            required: false
        },
        {
            name: 'sell_keys',
            description: 'Manual sell price — keys',
            type: ApplicationCommandOptionType.Integer as const,
            required: false,
            min_value: 0
        },
        {
            name: 'sell_metal',
            description: 'Manual sell price — ref',
            type: ApplicationCommandOptionType.Number as const,
            required: false,
            min_value: 0
        },
        {
            name: 'buy_keys',
            description: 'Manual buy price — keys',
            type: ApplicationCommandOptionType.Integer as const,
            required: false,
            min_value: 0
        },
        {
            name: 'buy_metal',
            description: 'Manual buy price — ref',
            type: ApplicationCommandOptionType.Number as const,
            required: false,
            min_value: 0
        },
        {
            name: 'min_sell_keys',
            description: 'Sell price floor — keys (live prices won’t go below)',
            type: ApplicationCommandOptionType.Integer as const,
            required: false,
            min_value: 0
        },
        {
            name: 'min_sell_metal',
            description: 'Sell price floor — ref',
            type: ApplicationCommandOptionType.Number as const,
            required: false,
            min_value: 0
        },
        {
            name: 'max_sell_keys',
            description: 'Sell price ceiling — keys (live prices won’t go above)',
            type: ApplicationCommandOptionType.Integer as const,
            required: false,
            min_value: 0
        },
        {
            name: 'max_sell_metal',
            description: 'Sell price ceiling — ref',
            type: ApplicationCommandOptionType.Number as const,
            required: false,
            min_value: 0
        },
        {
            name: 'min_buy_keys',
            description: 'Buy price floor — keys',
            type: ApplicationCommandOptionType.Integer as const,
            required: false,
            min_value: 0
        },
        {
            name: 'min_buy_metal',
            description: 'Buy price floor — ref',
            type: ApplicationCommandOptionType.Number as const,
            required: false,
            min_value: 0
        },
        {
            name: 'max_buy_keys',
            description: 'Buy price ceiling — keys',
            type: ApplicationCommandOptionType.Integer as const,
            required: false,
            min_value: 0
        },
        {
            name: 'max_buy_metal',
            description: 'Buy price ceiling — ref',
            type: ApplicationCommandOptionType.Number as const,
            required: false,
            min_value: 0
        },
        {
            name: 'enabled',
            description: 'Enable this listing',
            type: ApplicationCommandOptionType.Boolean as const,
            required: false
        },
        {
            name: 'min',
            description: 'Minimum stock',
            type: ApplicationCommandOptionType.Integer as const,
            required: false,
            min_value: 0
        },
        {
            name: 'max',
            description: 'Maximum stock',
            type: ApplicationCommandOptionType.Integer as const,
            required: false,
            min_value: -1
        },
        {
            name: 'group',
            description: 'Pricelist group (default: all)',
            type: ApplicationCommandOptionType.String as const,
            required: false
        }
    ];
}

function lookupOnlyOptions(valueDescription: string) {
    return [lookupOption(true), valueOption(valueDescription)];
}

function autokeysOptions() {
    return [
        {
            name: 'enable',
            description: 'Turn Autokeys on or off',
            type: ApplicationCommandOptionType.Boolean as const,
            required: false
        },
        {
            name: 'min_keys',
            description: 'Minimum keys to keep',
            type: ApplicationCommandOptionType.Integer as const,
            required: false,
            min_value: 0
        },
        {
            name: 'max_keys',
            description: 'Maximum keys to keep',
            type: ApplicationCommandOptionType.Integer as const,
            required: false,
            min_value: 0
        },
        {
            name: 'min_refined',
            description: 'Minimum refined metal',
            type: ApplicationCommandOptionType.Number as const,
            required: false,
            min_value: 0
        },
        {
            name: 'max_refined',
            description: 'Maximum refined metal',
            type: ApplicationCommandOptionType.Number as const,
            required: false,
            min_value: 0
        },
        {
            name: 'banking',
            description: 'Enable key auto-banking',
            type: ApplicationCommandOptionType.Boolean as const,
            required: false
        },
        {
            name: 'scrap_adjustment',
            description: 'Enable scrap adjustment',
            type: ApplicationCommandOptionType.Boolean as const,
            required: false
        },
        {
            name: 'scrap_value',
            description: 'Scrap adjustment value (scraps)',
            type: ApplicationCommandOptionType.Integer as const,
            required: false,
            min_value: 0
        }
    ];
}

function hiveOptions() {
    return [
        {
            name: 'action',
            description: 'Hive action',
            type: ApplicationCommandOptionType.String as const,
            required: false,
            choices: [
                { name: 'status', value: 'status' },
                { name: 'enable', value: 'enable' },
                { name: 'disable', value: 'disable' },
                { name: 'link', value: 'link' },
                { name: 'accept', value: 'accept' },
                { name: 'unlink', value: 'unlink' },
                { name: 'push', value: 'push' },
                { name: 'bots', value: 'bots' }
            ]
        },
        {
            name: 'steamid',
            description: 'Partner SteamID64 (link/accept/unlink/push)',
            type: ApplicationCommandOptionType.String as const,
            required: false
        },
        {
            name: 'keys',
            description: 'Keys to push',
            type: ApplicationCommandOptionType.Integer as const,
            required: false,
            min_value: 0
        },
        {
            name: 'ref',
            description: 'Refined to push',
            type: ApplicationCommandOptionType.Number as const,
            required: false,
            min_value: 0
        }
    ];
}

function buildHiveSlashMessage(options: SlashOptionReader): string {
    const action = options.getString('action') || 'status';
    if (action === 'status' || action === 'enable' || action === 'disable' || action === 'bots') {
        return `!hive ${action}`;
    }
    const steamid = options.getString('steamid');
    if (action === 'link' || action === 'accept' || action === 'unlink') {
        return steamid ? `!hive ${action} ${steamid}` : `!hive ${action}`;
    }
    if (action === 'push') {
        const keys = options.getInteger('keys') ?? 0;
        const ref = options.getNumber('ref') ?? 0;
        if (!steamid) {
            return '!hive push';
        }
        return `!hive push keys=${keys}&ref=${ref}&to=${steamid}`;
    }
    return '!hive status';
}

function buildAutokeysSlashParams(options: SlashOptionReader): string {
    const parts: string[] = [];
    const enable = options.getBoolean('enable');
    if (enable !== null) {
        parts.push(`enable=${enable}`);
    }
    const minKeys = options.getInteger('min_keys');
    if (minKeys !== null) {
        parts.push(`minKeys=${minKeys}`);
    }
    const maxKeys = options.getInteger('max_keys');
    if (maxKeys !== null) {
        parts.push(`maxKeys=${maxKeys}`);
    }
    const minRef = options.getNumber('min_refined');
    if (minRef !== null) {
        parts.push(`minRefined=${minRef}`);
    }
    const maxRef = options.getNumber('max_refined');
    if (maxRef !== null) {
        parts.push(`maxRefined=${maxRef}`);
    }
    const banking = options.getBoolean('banking');
    if (banking !== null) {
        parts.push(`banking=${banking}`);
    }
    const scrapAdj = options.getBoolean('scrap_adjustment');
    if (scrapAdj !== null) {
        parts.push(`scrapAdjustment=${scrapAdj}`);
    }
    const scrapValue = options.getInteger('scrap_value');
    if (scrapValue !== null) {
        parts.push(`scrapAdjustmentValue=${scrapValue}`);
    }
    return parts.join('&');
}

/** Slash commands registered with Discord on bot startup. */
export function getSlashCommandDefinitions(): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
    const cmd = (
        name: string,
        description: string,
        options?: RESTPostAPIChatInputApplicationCommandsJSONBody['options']
    ): RESTPostAPIChatInputApplicationCommandsJSONBody => ({
        name,
        description,
        type: ApplicationCommandType.ChatInput,
        ...(options ? { options } : {})
    });

    return [
        cmd('run', 'Advanced: run any raw bot command without ! (for power users)', [
            {
                name: 'command',
                description: 'Full command without ! — e.g. find intent=sell&limit=5',
                type: ApplicationCommandOptionType.String as const,
                required: true,
                autocomplete: true
            }
        ]),
        cmd('help', 'List bot commands'),
        cmd('how2trade', 'How to trade with the bot'),
        cmd('price', 'Look up an item price', lookupOnlyOptions('SKU, asset id, or item name')),
        cmd('sku', 'Get the SKU for an item name', [
            valueOption('Item name or SKU')
        ]),
        cmd('cart', 'View your shopping cart'),
        cmd('clearcart', 'Clear your cart'),
        cmd('checkout', 'Send a trade offer from your cart'),
        cmd('halt', 'Stop the bot from trading (admin)'),
        cmd('unhalt', 'Resume trading (admin)'),
        cmd('haltstatus', 'Check halt mode status (admin)'),
        cmd('stats', 'Show bot statistics (admin)'),
        cmd('inventory', 'Show bot inventory summary (admin)'),
        cmd('version', 'Show bot version'),
        cmd('uptime', 'Show how long the bot has been online'),
        cmd('check', 'Force a listings check (admin)'),
        cmd('refreshlist', 'Refresh backpack.tf listings (admin)'),
        cmd('autokeys', 'Show or change Autokeys settings (set options are admin-only)', autokeysOptions()),
        cmd('refreshautokeys', 'Force a refresh of Autokeys settings (admin)'),
        cmd('hive', 'Pure Hive: share keys/ref with linked fork bots (admin)', hiveOptions()),
        cmd('add', 'Add a pricelist entry (admin)', pricelistListingOptions(true)),
        cmd('update', 'Update a pricelist entry (admin)', pricelistListingOptions(false)),
        cmd('remove', 'Remove a pricelist entry (admin)', lookupOnlyOptions('Item to remove')),
        cmd('get', 'Get pricelist entry details (admin)', lookupOnlyOptions('Item to look up')),
        cmd('offerinfo', 'Get trade offer details (admin)', [
            {
                name: 'offer_id',
                description: 'Steam trade offer ID',
                type: ApplicationCommandOptionType.String as const,
                required: true
            }
        ]),
        cmd('time', 'Show current bot time'),
        cmd('owner', 'Owner profile links'),
        cmd('discord', 'Discord server links')
    ];
}

export interface SlashRoute {
    prefixMessage: string;
    adminOnly: boolean;
}

function readPricelistFields(options: SlashOptionReader, intentRequired: boolean): PricelistSlashFields | null {
    const lookup = options.getString('lookup') as ItemLookupType | null;
    const value = options.getString('value');
    const intent = options.getString('intent') as PricelistSlashFields['intent'];

    if (!lookup || !value) {
        return null;
    }

    if (intentRequired && !intent) {
        return null;
    }

    return {
        lookup,
        value,
        intent: intent ?? null,
        autoprice: options.getBoolean('autoprice'),
        autopriceSell: options.getBoolean('autopricesell'),
        autopriceBuy: options.getBoolean('autopricebuy'),
        sellKeys: options.getInteger('sell_keys'),
        sellMetal: options.getNumber('sell_metal'),
        buyKeys: options.getInteger('buy_keys'),
        buyMetal: options.getNumber('buy_metal'),
        minSellKeys: options.getInteger('min_sell_keys'),
        minSellMetal: options.getNumber('min_sell_metal'),
        maxSellKeys: options.getInteger('max_sell_keys'),
        maxSellMetal: options.getNumber('max_sell_metal'),
        minBuyKeys: options.getInteger('min_buy_keys'),
        minBuyMetal: options.getNumber('min_buy_metal'),
        maxBuyKeys: options.getInteger('max_buy_keys'),
        maxBuyMetal: options.getNumber('max_buy_metal'),
        enabled: options.getBoolean('enabled'),
        min: options.getInteger('min'),
        max: options.getInteger('max'),
        group: options.getString('group')
    };
}

function routeFromPricelistCommand(
    command: 'add' | 'update' | 'remove' | 'get',
    options: SlashOptionReader,
    intentRequired: boolean
): SlashRoute | null {
    if (command === 'remove' || command === 'get') {
        const lookup = options.getString('lookup') as ItemLookupType | null;
        const value = options.getString('value');
        const params = lookup && value ? buildLookupOnlyParamString(lookup, value) : null;
        return params ? { prefixMessage: `!${command} ${params}`, adminOnly: true } : null;
    }

    const fields = readPricelistFields(options, intentRequired);
    if (!fields) {
        return null;
    }

    const params = buildPricelistParamString(fields);
    return params ? { prefixMessage: `!${command} ${params}`, adminOnly: true } : null;
}

/** Map slash command name -> equivalent ! message for the bot handler. */
export function resolveSlashRoute(interactionName: string, options: SlashOptionReader): SlashRoute | null {
    switch (interactionName) {
        case 'run': {
            const raw = options.getString('command')?.trim();
            if (!raw) return null;
            // Accept !cmd, /cmd, or bare cmd — always normalize to ! for the bot handler
            const withoutPrefix = raw.replace(/^[!/]+/, '');
            return {
                prefixMessage: `!${withoutPrefix}`,
                adminOnly: isAdminSlashCommand(withoutPrefix)
            };
        }
        case 'help':
            return { prefixMessage: '!help', adminOnly: false };
        case 'how2trade':
            return { prefixMessage: '!how2trade', adminOnly: false };
        case 'price': {
            const lookup = options.getString('lookup') as ItemLookupType | null;
            const value = options.getString('value');
            if (lookup && value) {
                const params = buildLookupOnlyParamString(lookup, value);
                return params ? { prefixMessage: `!price ${params}`, adminOnly: false } : null;
            }
            const item = options.getString('value') ?? options.getString('item');
            return item ? { prefixMessage: `!price ${item}`, adminOnly: false } : null;
        }
        case 'sku': {
            const query = options.getString('value') ?? options.getString('query');
            return query ? { prefixMessage: `!sku ${query}`, adminOnly: false } : null;
        }
        case 'cart':
            return { prefixMessage: '!cart', adminOnly: false };
        case 'clearcart':
            return { prefixMessage: '!clearcart', adminOnly: false };
        case 'checkout':
            return { prefixMessage: '!checkout', adminOnly: false };
        case 'halt':
            return { prefixMessage: '!halt', adminOnly: true };
        case 'unhalt':
            return { prefixMessage: '!unhalt', adminOnly: true };
        case 'haltstatus':
            return { prefixMessage: '!haltstatus', adminOnly: true };
        case 'stats':
            return { prefixMessage: '!stats', adminOnly: true };
        case 'inventory':
            return { prefixMessage: '!inventory', adminOnly: true };
        case 'version':
            return { prefixMessage: '!version', adminOnly: false };
        case 'uptime':
            return { prefixMessage: '!uptime', adminOnly: false };
        case 'check':
            return { prefixMessage: '!check', adminOnly: true };
        case 'refreshlist':
            return { prefixMessage: '!refreshlist', adminOnly: true };
        case 'autokeys': {
            const params = buildAutokeysSlashParams(options);
            // Viewing status is open; changing any setting requires Discord admin
            return {
                prefixMessage: params ? `!autokeys ${params}` : '!autokeys',
                adminOnly: params.length > 0
            };
        }
        case 'refreshautokeys':
            return { prefixMessage: '!refreshautokeys', adminOnly: true };
        case 'hive':
            return { prefixMessage: buildHiveSlashMessage(options), adminOnly: true };
        case 'add':
            return routeFromPricelistCommand('add', options, true);
        case 'update':
            return routeFromPricelistCommand('update', options, false);
        case 'remove':
            return routeFromPricelistCommand('remove', options, false);
        case 'get':
            return routeFromPricelistCommand('get', options, false);
        case 'offerinfo': {
            const id = options.getString('offer_id') ?? options.getString('id');
            return id ? { prefixMessage: `!offerinfo ${id}`, adminOnly: true } : null;
        }
        case 'time':
            return { prefixMessage: '!time', adminOnly: false };
        case 'owner':
            return { prefixMessage: '!owner', adminOnly: false };
        case 'discord':
            return { prefixMessage: '!discord', adminOnly: false };
        default:
            return null;
    }
}
