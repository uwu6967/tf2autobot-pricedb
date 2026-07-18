import { APIEmbed, APIEmbedField } from 'discord.js';
import Currencies from '@tf2autobot/tf2-currencies';
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

function formatKeysMetal(keys: number, metal: number): string {
    return new Currencies({ keys, metal }).toString();
}

function formatRange(
    min: { toString(): string } | null | undefined,
    max: { toString(): string } | null | undefined
): string {
    if (!min && !max) {
        return '';
    }
    return `${min ? min.toString() : '—'} → ${max ? max.toString() : '—'}`;
}

function priceRangeLines(entry: Entry): string {
    const lines: string[] = [];
    if (entry.minBuy || entry.maxBuy) {
        lines.push(`📏 **Buy range:** ${formatRange(entry.minBuy, entry.maxBuy)}`);
    }
    if (entry.minSell || entry.maxSell) {
        lines.push(`📏 **Sell range:** ${formatRange(entry.minSell, entry.maxSell)}`);
    }
    return lines.join('\n');
}

function priceRangeLinesUpdate(oldEntry: Entry, newEntry: Entry): string {
    const lines: string[] = [];

    const oldBuyRange = formatRange(oldEntry.minBuy, oldEntry.maxBuy);
    const newBuyRange = formatRange(newEntry.minBuy, newEntry.maxBuy);
    if (oldBuyRange || newBuyRange) {
        lines.push(`📏 **Buy range:** ${changeOrSame(oldBuyRange || '—', newBuyRange || '—')}`);
    }

    const oldSellRange = formatRange(oldEntry.minSell, oldEntry.maxSell);
    const newSellRange = formatRange(newEntry.minSell, newEntry.maxSell);
    if (oldSellRange || newSellRange) {
        lines.push(`📏 **Sell range:** ${changeOrSame(oldSellRange || '—', newSellRange || '—')}`);
    }

    return lines.join('\n');
}

function costBasisLines(bot: Bot, sku: string): string {
    const keyPrice = bot.pricelist.getKeyPrice.metal;
    const summary = bot.inventoryCostBasis.getSkuCostSummary(sku, keyPrice);
    if (!summary) {
        return '🧾 No FIFO buy history for this SKU yet.';
    }

    const ppuOn = bot.options.pricelist.partialPriceUpdate?.enable === true;
    const lines = [
        `🧾 **Tracked buys:** ${summary.count}`,
        `Oldest (FIFO): **${formatKeysMetal(summary.fifoKeys, summary.fifoMetal)}**`,
        `Average: **${formatKeysMetal(summary.avgKeys, summary.avgMetal)}**`,
        `Paid range: ${formatKeysMetal(summary.minKeys, summary.minMetal)} → ${formatKeysMetal(
            summary.maxKeys,
            summary.maxMetal
        )}`,
        `Total cost basis: **${formatKeysMetal(summary.totalKeys, summary.totalMetal)}**`
    ];

    if (ppuOn) {
        lines.push(
            `PPU floor (oldest + min profit): **${formatKeysMetal(
                summary.floorSellKeys,
                summary.floorSellMetal
            )}**`
        );
    }

    return lines.join('\n');
}

function settingsLines(entry: Entry, isPremium: boolean): string {
    const lines = [
        `📋 **Enabled:** ${boolEmoji(entry.enabled)}`,
        `🔄 **Autoprice:** ${boolEmoji(entry.autoprice)}`,
        `🔄 **Autoprice sell:** ${boolEmoji(entry.autopriceSell)}`,
        `🔄 **Autoprice buy:** ${boolEmoji(entry.autopriceBuy)}`,
        `½🔄 **isPartialPriced:** ${boolEmoji(entry.isPartialPriced)}`
    ];
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

function buildCommonFields(
    bot: Bot,
    entry: Entry,
    priceKey: string,
    isPremium: boolean,
    options: {
        pricingValue: string;
        stockValue: string;
        intentValue: string;
        settingsValue: string;
        rangeValue?: string;
    }
): APIEmbedField[] {
    const fields: APIEmbedField[] = [
        {
            name: '__Pricing__',
            value: options.pricingValue
        }
    ];

    if (options.rangeValue) {
        fields.push({
            name: '__Price range__',
            value: options.rangeValue
        });
    }

    fields.push({
        name: '__Cost basis (FIFO)__',
        value: costBasisLines(bot, entry.sku)
    });

    fields.push(
        {
            name: '__Stock__',
            value: options.stockValue
        },
        {
            name: '__Intent__',
            value: options.intentValue
        },
        {
            name: '__Settings__',
            value: options.settingsValue
        }
    );

    return fields;
}

export function buildAddedEntryEmbed(bot: Bot, entry: Entry, priceKey: string, isPremium: boolean): APIEmbed {
    const amount = stockAmount(bot, entry);
    const fields = buildCommonFields(bot, entry, priceKey, isPremium, {
        pricingValue: `💲 **Buy:** ${entry.buy.toString()}\n💲 **Sell:** ${entry.sell.toString()}`,
        stockValue: `📦 **Stock:** ${amount} | **Min:** ${entry.min} | **Max:** ${entry.max}`,
        intentValue: `🛒 ${intentLabel(entry.intent)}`,
        settingsValue: settingsLines(entry, isPremium),
        rangeValue: priceRangeLines(entry) || undefined
    });

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

    const fields = buildCommonFields(bot, newEntry, priceKey, isPremium, {
        pricingValue: `💲 **Buy:** ${buy}\n💲 **Sell:** ${sell}`,
        stockValue: `📦 **Stock:** ${amount} | **Min:** ${min} | **Max:** ${max}`,
        intentValue: `🛒 ${intent}`,
        settingsValue: settingsLinesUpdate(oldEntry, newEntry, isPremium),
        rangeValue: priceRangeLinesUpdate(oldEntry, newEntry) || undefined
    });

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

export function buildGetEntryEmbed(bot: Bot, entry: Entry, priceKey: string, isPremium: boolean): APIEmbed {
    const amount = stockAmount(bot, entry);
    const fields = buildCommonFields(bot, entry, priceKey, isPremium, {
        pricingValue: `💲 **Buy:** ${entry.buy.toString()}\n💲 **Sell:** ${entry.sell.toString()}`,
        stockValue: `📦 **Stock:** ${amount} | **Min:** ${entry.min} | **Max:** ${entry.max}`,
        intentValue: `🛒 ${intentLabel(entry.intent)}`,
        settingsValue: settingsLines(entry, isPremium),
        rangeValue: priceRangeLines(entry) || undefined
    });

    return {
        title: '📋 Pricelist entry',
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

function formatPurchaseLotLine(lot: {
    quantity: number;
    paidKeys: number;
    paidMetal: number;
    keyPriceMetal: number | null;
    keyPriceEstimated: boolean;
}): string {
    const paid = formatKeysMetal(lot.paidKeys, lot.paidMetal);
    const keyRate =
        lot.keyPriceMetal !== null
            ? `${lot.keyPriceEstimated ? '~' : ''}${Number(lot.keyPriceMetal.toFixed(2))}ref`
            : '?ref';
    const qtyLabel = lot.quantity === 1 ? '1 item' : `${lot.quantity} items`;
    return `${qtyLabel} → ${paid} (${keyRate})`;
}

/**
 * Second Discord message(s) for /get: stock-only FIFO purchase lots.
 * Format: `46 items → 3 keys (56ref)` where () is key price in ref at buy time.
 */
export function buildPurchaseHistoryEmbeds(bot: Bot, entry: Entry, priceKey: string): APIEmbed[] {
    const stock = stockAmount(bot, entry);
    const lots = bot.inventoryCostBasis.getSkuPurchaseLots(entry.sku, stock);

    if (lots.length === 0) {
        return [
            {
                title: '🧾 Purchase history (stock)',
                description:
                    `**${entry.name}**\n\`${priceKey}\`\n\n` +
                    `No FIFO buy lots for current stock (${stock}).`,
                color: embedColor(bot, true),
                footer: {
                    text: `${priceKey} • stock ${stock} • v${process.env.BOT_VERSION ?? ''}`
                }
            }
        ];
    }

    const lines = lots.map(formatPurchaseLotLine);
    const tracked = lots.reduce((sum, l) => sum + l.quantity, 0);
    const chunks: string[] = [];
    let buf = '';
    for (const line of lines) {
        const next = buf ? `${buf}\n${line}` : line;
        // Discord embed description limit 4096; keep headroom
        if (next.length > 3800) {
            chunks.push(buf);
            buf = line;
        } else {
            buf = next;
        }
    }
    if (buf) {
        chunks.push(buf);
    }

    return chunks.map((description, index) => ({
        title:
            chunks.length > 1
                ? `🧾 Purchase history (stock) (${index + 1}/${chunks.length})`
                : '🧾 Purchase history (stock)',
        description:
            `**${entry.name}**\n\`${priceKey}\`\n` +
            `Showing **${tracked}** of **${stock}** in stock (sold lots drop off FIFO).\n\n` +
            description,
        color: embedColor(bot, true),
        footer: {
            text: `${priceKey} • stock ${stock} • v${process.env.BOT_VERSION ?? ''}`
        }
    }));
}

/** Plain-text purchase history for Steam / non-embed replies. */
export function formatPurchaseHistoryText(bot: Bot, entry: Entry): string {
    const stock = stockAmount(bot, entry);
    const lots = bot.inventoryCostBasis.getSkuPurchaseLots(entry.sku, stock);
    if (lots.length === 0) {
        return `\n🧾 Purchase history (stock): none for ${stock} in stock`;
    }
    const lines = lots.map(l => `• ${formatPurchaseLotLine(l)}`);
    const tracked = lots.reduce((sum, l) => sum + l.quantity, 0);
    return (
        `\n🧾 Purchase history (stock): ${tracked}/${stock}` +
        `\n${lines.join('\n')}`
    );
}
