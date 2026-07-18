import { APIEmbed, APIEmbedField } from 'discord.js';
import Bot from '../classes/Bot';
import { Entry } from '../classes/Pricelist';

function intentLabel(intent: 0 | 1 | 2): string {
    return intent === 2 ? 'bank' : intent === 1 ? 'sell' : 'buy';
}

function boolEmoji(value: boolean): string {
    return value ? '✅' : '❌';
}

function changeOrSame(oldVal: string, newVal: string): string {
    return oldVal !== newVal ? `${oldVal} → ${newVal}` : newVal;
}

function embedColor(bot: Bot, success: boolean): number {
    if (!success) {
        return 16711680; // red
    }
    const raw = bot.options.discordWebhook?.embedColor;
    const parsed = raw ? parseInt(String(raw), 10) : NaN;
    return Number.isFinite(parsed) ? parsed : 5763719; // green
}

function stockAmount(bot: Bot, entry: Entry): number {
    return bot.inventoryManager.getInventory.getAmount({
        priceKey: entry.id ?? entry.sku,
        includeNonNormalized: false
    });
}

function settingsLines(entry: Entry, isPremium: boolean): string {
    const lines = [
        `📋 **Enabled:** ${boolEmoji(entry.enabled)}`,
        `🔄 **Autoprice:** ${boolEmoji(entry.autoprice)}`,
        `🔄 **Autoprice sell:** ${boolEmoji(entry.autopriceSell)}`,
        `🔄 **Autoprice buy:** ${boolEmoji(entry.autopriceBuy)}`,
        `½🔄 **isPartialPriced:** ${boolEmoji(entry.isPartialPriced)}`
    ];
    if (entry.minBuy || entry.maxBuy) {
        lines.push(
            `📏 **Buy range:** ${entry.minBuy ? entry.minBuy.toString() : '—'} → ${
                entry.maxBuy ? entry.maxBuy.toString() : '—'
            }`
        );
    }
    if (entry.minSell || entry.maxSell) {
        lines.push(
            `📏 **Sell range:** ${entry.minSell ? entry.minSell.toString() : '—'} → ${
                entry.maxSell ? entry.maxSell.toString() : '—'
            }`
        );
    }
    if (isPremium) {
        lines.push(`📢 **Promoted:** ${boolEmoji(entry.promoted === 1)}`);
    }
    lines.push(`🔰 **Group:** ${entry.group}`);
    if (entry.note.buy) {
        lines.push(`📥 **Buy note:** ${entry.note.buy}`);
    }
    if (entry.note.sell) {
        lines.push(`📤 **Sell note:** ${entry.note.sell}`);
    }
    return lines.join('\n');
}

function settingsLinesUpdate(oldEntry: Entry, newEntry: Entry, isPremium: boolean): string {
    const lines = [
        `📋 **Enabled:** ${changeOrSame(boolEmoji(oldEntry.enabled), boolEmoji(newEntry.enabled))}`,
        `🔄 **Autoprice:** ${changeOrSame(boolEmoji(oldEntry.autoprice), boolEmoji(newEntry.autoprice))}`,
        `🔄 **Autoprice sell:** ${changeOrSame(
            boolEmoji(oldEntry.autopriceSell),
            boolEmoji(newEntry.autopriceSell)
        )}`,
        `🔄 **Autoprice buy:** ${changeOrSame(boolEmoji(oldEntry.autopriceBuy), boolEmoji(newEntry.autopriceBuy))}`,
        `½🔄 **isPartialPriced:** ${changeOrSame(
            boolEmoji(oldEntry.isPartialPriced),
            boolEmoji(newEntry.isPartialPriced)
        )}`
    ];
    if (isPremium) {
        lines.push(
            `📢 **Promoted:** ${changeOrSame(
                boolEmoji(oldEntry.promoted === 1),
                boolEmoji(newEntry.promoted === 1)
            )}`
        );
    }
    lines.push(`🔰 **Group:** ${changeOrSame(oldEntry.group, newEntry.group)}`);
    if (newEntry.note.buy) {
        lines.push(`📥 **Buy note:** ${newEntry.note.buy}`);
    }
    if (newEntry.note.sell) {
        lines.push(`📤 **Sell note:** ${newEntry.note.sell}`);
    }
    return lines.join('\n');
}

function bptfClassifiedsUrl(name: string): string {
    return `https://backpack.tf/classifieds?item=${encodeURIComponent(name)}`;
}

export function buildAddedEntryEmbed(bot: Bot, entry: Entry, priceKey: string, isPremium: boolean): APIEmbed {
    const amount = stockAmount(bot, entry);
    const fields: APIEmbedField[] = [
        {
            name: '__Pricing__',
            value: `💲 **Buy:** ${entry.buy.toString()}\n💲 **Sell:** ${entry.sell.toString()}`
        },
        {
            name: '__Stock__',
            value: `📦 **Stock:** ${amount} | **Min:** ${entry.min} | **Max:** ${entry.max}`
        },
        {
            name: '__Intent__',
            value: `🛒 ${intentLabel(entry.intent)}`
        },
        {
            name: '__Settings__',
            value: settingsLines(entry, isPremium)
        }
    ];

    return {
        title: '✅ Item added to pricelist',
        description:
            `**${entry.name}**\n\`${priceKey}\`\n` +
            `[Check on backpack.tf](${bptfClassifiedsUrl(entry.name)})`,
        color: embedColor(bot, true),
        fields,
        footer: {
            text: `${priceKey} • v${process.env.BOT_VERSION ?? ''}`
        }
    };
}

export function buildUpdatedEntryEmbed(
    bot: Bot,
    oldEntry: Entry,
    newEntry: Entry,
    priceKey: string,
    isPremium: boolean
): APIEmbed {
    const keyPrice = bot.pricelist.getKeyPrice;
    const amount = stockAmount(bot, oldEntry);

    const buy =
        oldEntry.buy.toValue(keyPrice.metal) !== newEntry.buy.toValue(keyPrice.metal)
            ? `${oldEntry.buy.toString()} → ${newEntry.buy.toString()}`
            : newEntry.buy.toString();
    const sell =
        oldEntry.sell.toValue(keyPrice.metal) !== newEntry.sell.toValue(keyPrice.metal)
            ? `${oldEntry.sell.toString()} → ${newEntry.sell.toString()}`
            : newEntry.sell.toString();

    const min = oldEntry.min !== newEntry.min ? `${oldEntry.min} → ${newEntry.min}` : String(newEntry.min);
    const max = oldEntry.max !== newEntry.max ? `${oldEntry.max} → ${newEntry.max}` : String(newEntry.max);
    const intent =
        oldEntry.intent !== newEntry.intent
            ? `${intentLabel(oldEntry.intent)} → ${intentLabel(newEntry.intent)}`
            : intentLabel(newEntry.intent);

    const fields: APIEmbedField[] = [
        {
            name: '__Pricing__',
            value: `💲 **Buy:** ${buy}\n💲 **Sell:** ${sell}`
        },
        {
            name: '__Stock__',
            value: `📦 **Stock:** ${amount} | **Min:** ${min} | **Max:** ${max}`
        },
        {
            name: '__Intent__',
            value: `🛒 ${intent}`
        },
        {
            name: '__Settings__',
            value: settingsLinesUpdate(oldEntry, newEntry, isPremium)
        }
    ];

    return {
        title: '✅ Item updated',
        description:
            `**${newEntry.name}**\n\`${priceKey}\`\n` +
            `[Check on backpack.tf](${bptfClassifiedsUrl(newEntry.name)})`,
        color: embedColor(bot, true),
        fields,
        footer: {
            text: `${priceKey} • v${process.env.BOT_VERSION ?? ''}`
        }
    };
}
