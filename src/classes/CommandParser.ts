import { setProperty } from 'dot-prop';
import { UnknownDictionaryKnownValues } from '../types/common';
import { parseJSON } from '../lib/helpers';

/** Map lowercased param keys to the canonical camelCase names used in code / EntryData. */
const CANONICAL_PARAM_KEYS: Readonly<Record<string, string>> = {
    autopricesell: 'autopriceSell',
    autopricebuy: 'autopriceBuy',
    ispartialpriced: 'isPartialPriced',
    outputquality: 'outputQuality',
    minkeys: 'minKeys',
    maxkeys: 'maxKeys',
    minrefined: 'minRefined',
    maxrefined: 'maxRefined',
    scrapadjustment: 'scrapAdjustment',
    scrapadjustmentvalue: 'scrapAdjustmentValue',
    minbuy: 'minBuy',
    maxbuy: 'maxBuy',
    minsell: 'minSell',
    maxsell: 'maxSell'
};

/**
 * Pricelist / listing keys that should be matched case-insensitively.
 * Nested config keys like highValue.sheens keep their original casing.
 */
const CASE_INSENSITIVE_ROOTS = new Set([
    'sku',
    'id',
    'item',
    'name',
    'defindex',
    'intent',
    'autoprice',
    'autopricesell',
    'autopricebuy',
    'enabled',
    'enable',
    'min',
    'max',
    'minkeys',
    'maxkeys',
    'minrefined',
    'maxrefined',
    'banking',
    'scrapadjustment',
    'scrapadjustmentvalue',
    'group',
    'promoted',
    'buy',
    'sell',
    'minbuy',
    'maxbuy',
    'minsell',
    'maxsell',
    'note',
    'ispartialpriced',
    'removenote',
    'removebuynote',
    'removesellnote',
    'resetgroup',
    'withgroup',
    'withoutgroup',
    'all'
]);

function canonicalizeParamKey(rawKey: string): string {
    const trimmed = rawKey.trim();
    const lower = trimmed.toLowerCase();

    if (CANONICAL_PARAM_KEYS[lower]) {
        return CANONICAL_PARAM_KEYS[lower];
    }

    const parts = lower.split('.');
    const root = parts[0];

    // Nested keys like minSell.keys / maxBuy.metal must keep camelCase roots
    if (CANONICAL_PARAM_KEYS[root]) {
        parts[0] = CANONICAL_PARAM_KEYS[root];
        return parts.join('.');
    }

    if (CASE_INSENSITIVE_ROOTS.has(root)) {
        return lower;
    }

    // Preserve camelCase for config keys (e.g. highValue.sheens)
    return trimmed;
}

export default class CommandParser {
    static getCommand(message: string, prefix: string): string | null {
        if (message.startsWith(prefix)) {
            return message.slice(prefix.length).trim().split(/ +/g).shift()?.toLowerCase();
        }

        return null;
    }

    static removeCommand(message: string): string {
        return message.substring(message.indexOf(' ') + 1);
    }

    static parseParams(paramString: string): UnknownDictionaryKnownValues {
        const params: UnknownDictionaryKnownValues = parseJSON(
            '{"' +
                paramString
                    .replace(/"/g, '\\"')
                    .replace(/&(?!&)(?=[^&=]+=[^&]*)/g, '","') // Split only valid key-value pairs
                    .replace(/=/g, '":"') +
                '"}'
        );

        const parsed: UnknownDictionaryKnownValues = {};
        if (params !== null) {
            for (const key in params) {
                if (!Object.prototype.hasOwnProperty.call(params, key)) continue;

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                let value = params[key];

                const canonicalKey = canonicalizeParamKey(key);

                if (canonicalKey !== 'sku') {
                    const lowerCase = (value as string).toLowerCase();
                    if (/^-?\d+$/.test(lowerCase)) {
                        value = parseInt(lowerCase);
                    } else if (/^-?\d+(\.\d+)?$/.test(lowerCase)) {
                        value = parseFloat(lowerCase);
                    } else if (lowerCase === 'true') {
                        value = true;
                    } else if (lowerCase === 'false') {
                        value = false;
                    } else if (typeof value === 'string' && value[0] === '[' && value[value.length - 1] === ']') {
                        if (value.length === 2) {
                            value = [];
                        } else {
                            value = value
                                .slice(1, -1)
                                .split(',')
                                .map(v => v.trim().replace(/["']/g, ''));
                        }
                    }
                }

                setProperty(parsed, canonicalKey, value);
            }
        }

        return parsed;
    }
}
