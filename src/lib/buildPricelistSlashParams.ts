export type ItemLookupType = 'sku' | 'id' | 'item' | 'defindex' | 'name';

export interface PricelistSlashFields {
    lookup: ItemLookupType;
    value: string;
    intent?: 'buy' | 'sell' | 'bank' | null;
    autoprice?: boolean | null;
    autopriceSell?: boolean | null;
    autopriceBuy?: boolean | null;
    sellKeys?: number | null;
    sellMetal?: number | null;
    buyKeys?: number | null;
    buyMetal?: number | null;
    minSellKeys?: number | null;
    minSellMetal?: number | null;
    maxSellKeys?: number | null;
    maxSellMetal?: number | null;
    minBuyKeys?: number | null;
    minBuyMetal?: number | null;
    maxBuyKeys?: number | null;
    maxBuyMetal?: number | null;
    enabled?: boolean | null;
    min?: number | null;
    max?: number | null;
    group?: string | null;
}

const VALID_LOOKUPS = new Set<ItemLookupType>(['sku', 'id', 'item', 'defindex', 'name']);

function pushCurrencySide(
    parts: string[],
    prefix: string,
    keys: number | null | undefined,
    metal: number | null | undefined
): void {
    if (keys == null && metal == null) {
        return;
    }
    parts.push(`${prefix}.keys=${keys ?? 0}`);
    parts.push(`${prefix}.metal=${metal ?? 0}`);
}

export function buildPricelistParamString(fields: PricelistSlashFields): string | null {
    const lookup = fields.lookup?.trim().toLowerCase() as ItemLookupType;
    const value = fields.value?.trim();

    if (!VALID_LOOKUPS.has(lookup) || !value) {
        return null;
    }

    const parts: string[] = [`${lookup}=${value}`];

    if (fields.intent) {
        parts.push(`intent=${fields.intent}`);
    }

    const hasSellPrice = fields.sellKeys != null || fields.sellMetal != null;
    const hasBuyPrice = fields.buyKeys != null || fields.buyMetal != null;

    if (hasSellPrice) {
        parts.push(`sell.keys=${fields.sellKeys ?? 0}`);
        parts.push(`sell.metal=${fields.sellMetal ?? 0}`);
    }

    if (hasBuyPrice) {
        parts.push(`buy.keys=${fields.buyKeys ?? 0}`);
        parts.push(`buy.metal=${fields.buyMetal ?? 0}`);
    }

    pushCurrencySide(parts, 'minSell', fields.minSellKeys, fields.minSellMetal);
    pushCurrencySide(parts, 'maxSell', fields.maxSellKeys, fields.maxSellMetal);
    pushCurrencySide(parts, 'minBuy', fields.minBuyKeys, fields.minBuyMetal);
    pushCurrencySide(parts, 'maxBuy', fields.maxBuyKeys, fields.maxBuyMetal);

    if (fields.autopriceSell === true) {
        parts.push('autoprice=false');
        parts.push('autopriceSell=true');
    } else if (fields.autopriceBuy === true) {
        parts.push('autoprice=false');
        parts.push('autopriceBuy=true');
    } else {
        if (hasSellPrice || hasBuyPrice) {
            parts.push(`autoprice=${fields.autoprice === true ? 'true' : 'false'}`);
        } else if (fields.autoprice === true) {
            parts.push('autoprice=true');
        } else if (fields.autoprice === false) {
            parts.push('autoprice=false');
        }

        if (fields.autopriceSell === false) {
            parts.push('autopriceSell=false');
        }

        if (fields.autopriceBuy === false) {
            parts.push('autopriceBuy=false');
        }
    }

    if (fields.enabled != null) {
        parts.push(`enabled=${fields.enabled ? 'true' : 'false'}`);
    }

    if (fields.min != null) {
        parts.push(`min=${fields.min}`);
    }

    if (fields.max != null) {
        parts.push(`max=${fields.max}`);
    }

    if (fields.group) {
        parts.push(`group=${fields.group}`);
    }

    return parts.join('&');
}

export function buildLookupOnlyParamString(lookup: ItemLookupType, value: string): string | null {
    return buildPricelistParamString({ lookup, value });
}
