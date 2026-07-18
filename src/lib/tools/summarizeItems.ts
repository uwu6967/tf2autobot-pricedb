import { TradeOffer, Prices, ItemsDict, ItemsValue, OurTheirItemsDict } from '@tf2autobot/tradeoffer-manager';
import SKU from '@tf2autobot/tf2-sku';
import Currencies from '@tf2autobot/tf2-currencies';
import Bot from '../../classes/Bot';
import { replace, testPriceKey } from '../tools/export';

interface Items {
    invalid: string[];
    disabled: string[];
    overstock: string[];
    understock: string[];
    duped: string[];
    dupedFailed: string[];
    highValue: string[];
}

export default function listItems(offer: TradeOffer, bot: Bot, items: Items, isSteamChat: boolean): string {
    const itemsPrices = bot.options.tradeSummary.showItemPrices ? listPrices(offer, bot, isSteamChat) : '';
    let list = itemsPrices;

    const itemsPricesLength = itemsPrices.length;
    const invalidCount = items.invalid.length;
    const disabledCount = items.disabled.length;
    const overstockedCount = items.overstock.length;
    const understockedCount = items.understock.length;
    const dupedCount = items.duped.length;
    const dupedFailedCount = items.dupedFailed.length;
    const highValueCount = items.highValue.length;

    list +=
        invalidCount > 0
            ? (itemsPricesLength > 0 ? '\n\n' : '') +
              (isSteamChat
                  ? '🟨_INVALID_ITEMS:\n- ' + items.invalid.join(',\n- ')
                  : '🟨`_INVALID_ITEMS:`\n- ' + items.invalid.join(',@\n- '))
            : '';
    list +=
        disabledCount > 0
            ? (itemsPricesLength > 0 || invalidCount > 0 ? '\n\n' : '') +
              (isSteamChat
                  ? '🟧_DISABLED_ITEMS:\n- ' + items.disabled.join(',\n- ')
                  : '🟧`_DISABLED_ITEMS:`\n- ' + items.disabled.join(',@\n- '))
            : '';
    list +=
        overstockedCount > 0
            ? (itemsPricesLength > 0 || invalidCount > 0 || disabledCount > 0 ? '\n\n' : '') +
              (isSteamChat
                  ? '🟦_OVERSTOCKED:\n- ' + items.overstock.join(',\n- ')
                  : '🟦`_OVERSTOCKED:`\n- ' + items.overstock.join(',@\n- '))
            : '';
    list +=
        understockedCount > 0
            ? (itemsPricesLength > 0 || invalidCount > 0 || disabledCount > 0 || overstockedCount > 0 ? '\n\n' : '') +
              (isSteamChat
                  ? '🟩_UNDERSTOCKED:\n- ' + items.understock.join(',\n- ')
                  : '🟩`_UNDERSTOCKED:`\n- ' + items.understock.join(',@\n- '))
            : '';
    list +=
        dupedCount > 0
            ? (itemsPricesLength > 0 ||
              invalidCount > 0 ||
              disabledCount > 0 ||
              overstockedCount > 0 ||
              understockedCount > 0
                  ? '\n\n'
                  : '') +
              (isSteamChat
                  ? '🟫_DUPED_ITEMS:\n- ' + items.duped.join(',\n- ')
                  : '🟫`_DUPED_ITEMS:`\n- ' + items.duped.join(',@\n- '))
            : '';
    list +=
        dupedFailedCount > 0
            ? (itemsPricesLength > 0 ||
              invalidCount > 0 ||
              disabledCount > 0 ||
              overstockedCount > 0 ||
              understockedCount > 0 ||
              dupedCount > 0
                  ? '\n\n'
                  : '') +
              (isSteamChat
                  ? '🟪_DUPE_CHECK_FAILED:\n- ' + items.dupedFailed.join(',\n- ')
                  : '🟪`_DUPE_CHECK_FAILED:`\n- ' + items.dupedFailed.join(',@\n- '))
            : '';
    list +=
        highValueCount > 0
            ? (itemsPricesLength > 0 ||
              invalidCount > 0 ||
              disabledCount > 0 ||
              overstockedCount > 0 ||
              understockedCount > 0 ||
              dupedCount > 0 ||
              dupedFailedCount > 0
                  ? '\n\n'
                  : '') +
              (isSteamChat
                  ? '🔶_HIGH_VALUE_ITEMS:\n- ' + items.highValue.join('\n\n- ')
                  : '🔶`_HIGH_VALUE_ITEMS`\n- ' + items.highValue.join('@\n\n- '))
            : '';

    if (list.length === 0) {
        list = '-';
    }
    return replace.itemName(list);
}

function countKeysInDict(dict: OurTheirItemsDict | null | undefined): number {
    if (!dict) {
        return 0;
    }

    let total = 0;
    for (const priceKey in dict) {
        if (!Object.prototype.hasOwnProperty.call(dict, priceKey)) {
            continue;
        }
        if (priceKey !== '5021;6' && !priceKey.startsWith('5021;6;')) {
            continue;
        }

        const raw = dict[priceKey];
        const amount =
            typeof raw === 'object' && raw !== null
                ? Number((raw as { amount?: number }).amount ?? 0)
                : Number(raw ?? 0);
        if (Number.isFinite(amount) && amount > 0) {
            total += amount;
        }
    }
    return total;
}

function formatWorthInKeys(
    side: { keys: number; metal: number } | undefined,
    keyRate: number
): { refStr: string; keysStr: string } | null {
    if (!side || !(keyRate > 0)) {
        return null;
    }
    const scrapTotal = new Currencies(side).toValue(keyRate);
    const keysEquiv = scrapTotal / Currencies.toScrap(keyRate);
    if (!Number.isFinite(keysEquiv)) {
        return null;
    }
    return {
        refStr: new Currencies(side).toString(),
        keysStr: keysEquiv.toFixed(2)
    };
}

function listPrices(offer: TradeOffer, bot: Bot, isSteamChat: boolean): string {
    const prices = offer.data('prices') as Prices;
    const items = (offer.data('dict') as ItemsDict) || { our: null, their: null };
    const value = offer.data('value') as ItemsValue;

    let text = '';
    const toJoin: string[] = [];
    const properName = bot.options.tradeSummary.showProperName;

    let buyPrice: string;
    let sellPrice: string;

    for (const priceKey in prices) {
        let autoprice = 'removed/not listed';

        if (!Object.prototype.hasOwnProperty.call(prices, priceKey)) {
            continue;
        }

        buyPrice = new Currencies(prices[priceKey].buy).toString();
        sellPrice = new Currencies(prices[priceKey].sell).toString();

        const entry = bot.pricelist.getPriceBySkuOrAsset({ priceKey, onlyEnabled: false });

        if (entry !== null) {
            autoprice = entry.autoprice ? `autopriced${entry.isPartialPriced ? ' - ppu' : ''}` : 'manual';
        }

        const sku = entry?.sku ?? priceKey;
        const name = testPriceKey(priceKey)
            ? bot.schema.getName(SKU.fromString(sku), properName)
            : priceKey;
        const skuTag = testPriceKey(priceKey) ? ` (\`${sku}\`)` : '';

        toJoin.push(
            `${
                isSteamChat
                    ? `${name}${skuTag} — buy ${buyPrice} / sell ${sellPrice} (${autoprice})`
                    : `_${name}_${skuTag} — buy ${buyPrice} / sell ${sellPrice} (${autoprice})`
            }`
        );
    }

    const keysWeGave = countKeysInDict(items.our);
    const keysTheyGave = countKeysInDict(items.their);
    const keyRate =
        value && typeof value.rate === 'number' && value.rate > 0
            ? value.rate
            : bot.pricelist.getKeyPrice.metal;

    const extraLines: string[] = [];
    extraLines.push(
        isSteamChat
            ? `🔑 Keys used: we gave ${keysWeGave} · they gave ${keysTheyGave}`
            : `🔑 **Keys used:** we gave ${keysWeGave} · they gave ${keysTheyGave}`
    );

    const ourWorth = formatWorthInKeys(value?.our, keyRate);
    const theirWorth = formatWorthInKeys(value?.their, keyRate);
    if (ourWorth || theirWorth) {
        // Same value both sides → one line; otherwise show both
        const sameWorth =
            ourWorth &&
            theirWorth &&
            ourWorth.refStr === theirWorth.refStr &&
            ourWorth.keysStr === theirWorth.keysStr;

        if (sameWorth && ourWorth) {
            extraLines.push(
                isSteamChat
                    ? `💵 Worth: ${ourWorth.refStr} ≈ ${ourWorth.keysStr} keys (@ ${keyRate} ref/key)`
                    : `💵 **Worth:** ${ourWorth.refStr} ≈ **${ourWorth.keysStr} keys** (@ ${keyRate} ref/key)`
            );
        } else {
            if (ourWorth) {
                extraLines.push(
                    isSteamChat
                        ? `💵 Worth (we gave): ${ourWorth.refStr} ≈ ${ourWorth.keysStr} keys (@ ${keyRate} ref/key)`
                        : `💵 **Worth (we gave):** ${ourWorth.refStr} ≈ **${ourWorth.keysStr} keys** (@ ${keyRate} ref/key)`
                );
            }
            if (theirWorth) {
                extraLines.push(
                    isSteamChat
                        ? `💵 Worth (they gave): ${theirWorth.refStr} ≈ ${theirWorth.keysStr} keys (@ ${keyRate} ref/key)`
                        : `💵 **Worth (they gave):** ${theirWorth.refStr} ≈ **${theirWorth.keysStr} keys** (@ ${keyRate} ref/key)`
                );
            }
        }
    }

    const extrasJoined = isSteamChat ? extraLines.join('\n') : extraLines.join('@\n');

    if (toJoin.length > 0) {
        text = isSteamChat
            ? '📜 Pricelist used\n- ' + toJoin.join(',\n- ') + '\n' + extrasJoined
            : '📜 **Pricelist used**\n- ' + toJoin.join(',@\n- ') + '@\n' + extrasJoined;
    } else {
        text = extrasJoined;
    }

    return text;
}
