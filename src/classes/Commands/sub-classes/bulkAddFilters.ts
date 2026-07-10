import SKU from '@tf2autobot/tf2-sku';
import Bot from '../../Bot';
import IPricer, { Item } from '../../IPricer';

const PURE_SKUS = new Set(['5021;6', '5000;6', '5001;6', '5002;6']);

const JUNK_NAME_PATTERNS = [
    'killstreak kit',
    'fabricator',
    'strangifier',
    'ticket',
    'gift',
    'supply crate key',
    'refined metal',
    'reclaimed metal',
    'scrap metal'
];

export const BULK_ADD_CATEGORIES = [
    'unusual',
    'unique',
    'strange',
    'vintage',
    'genuine',
    'haunted',
    'collectors',
    'all'
] as const;

export type BulkAddCategory = (typeof BULK_ADD_CATEGORIES)[number];

type ParsedSku = ReturnType<typeof SKU.fromString> & { strange?: boolean };

export function normalizeBulkAddCategory(raw: string): BulkAddCategory | null {
    const value = raw.toLowerCase().trim().replace(/s$/, '');

    if (value === 'unusual') return 'unusual';
    if (value === 'unique') return 'unique';
    if (value === 'strange') return 'strange';
    if (value === 'vintage') return 'vintage';
    if (value === 'genuine') return 'genuine';
    if (value === 'haunted') return 'haunted';
    if (value === 'collector') return 'collectors';
    if (value === 'all') return 'all';

    return null;
}

function isJunkSku(sku: string, bot: Bot): boolean {
    if (PURE_SKUS.has(sku)) {
        return true;
    }

    let item: ParsedSku;
    try {
        item = SKU.fromString(sku);
    } catch {
        return true;
    }

    const name = bot.schema.getName(item, false).toLowerCase();
    return JUNK_NAME_PATTERNS.some(pattern => name.includes(pattern));
}

function matchesCategory(sku: string, category: BulkAddCategory, bot: Bot): boolean {
    if (category === 'all') {
        return !isJunkSku(sku, bot);
    }

    let item: ParsedSku;
    try {
        item = SKU.fromString(sku);
    } catch {
        return false;
    }

    switch (category) {
        case 'unusual':
            return item.quality === 5;
        case 'unique':
            return item.quality === 6 && !item.strange;
        case 'strange':
            return item.quality === 11 || item.strange === true;
        case 'vintage':
            return item.quality === 3;
        case 'genuine':
            return item.quality === 1;
        case 'haunted':
            return item.quality === 13;
        case 'collectors':
            return item.quality === 14;
        default:
            return false;
    }
}

export async function resolveCategorySkus(
    bot: Bot,
    priceSource: IPricer,
    category: BulkAddCategory
): Promise<string[]> {
    const response = await priceSource.getPricelist();
    const items = response.items ?? [];
    const seen = new Set<string>();
    const skus: string[] = [];

    for (const entry of items) {
        if (!entry.sku || seen.has(entry.sku)) {
            continue;
        }

        if (!matchesCategory(entry.sku, category, bot)) {
            continue;
        }

        seen.add(entry.sku);
        skus.push(entry.sku);
    }

    return skus.sort();
}

export function formatCategoryList(): string {
    return BULK_ADD_CATEGORIES.join(', ');
}

export interface PricedbAddOptions {
    excludeJunk: boolean;
    pricedOnly: boolean;
    skipListed: boolean;
    category: BulkAddCategory | null;
}

export interface PricedbAddResult {
    skus: string[];
    pricerItems: Item[];
    totalInPricer: number;
    skippedListed: number;
    skippedUnpriced: number;
    skippedJunk: number;
}

function hasBuyAndSell(entry: Item): boolean {
    return entry.buy !== null && entry.sell !== null;
}

export async function resolvePricedbSkus(
    bot: Bot,
    priceSource: IPricer,
    listedSkus: Set<string>,
    options: PricedbAddOptions
): Promise<PricedbAddResult> {
    const response = await priceSource.getPricelist();
    const items = response.items ?? [];
    const seen = new Set<string>();
    const skus: string[] = [];
    let skippedListed = 0;
    let skippedUnpriced = 0;
    let skippedJunk = 0;

    for (const entry of items) {
        if (!entry.sku || seen.has(entry.sku)) {
            continue;
        }

        seen.add(entry.sku);

        if (options.skipListed && listedSkus.has(entry.sku)) {
            skippedListed++;
            continue;
        }

        if (options.pricedOnly && !hasBuyAndSell(entry)) {
            skippedUnpriced++;
            continue;
        }

        if (options.category) {
            if (!matchesCategory(entry.sku, options.category, bot)) {
                continue;
            }
        } else if (options.excludeJunk && isJunkSku(entry.sku, bot)) {
            skippedJunk++;
            continue;
        }

        skus.push(entry.sku);
    }

    return {
        skus: skus.sort(),
        pricerItems: items,
        totalInPricer: items.length,
        skippedListed,
        skippedUnpriced,
        skippedJunk
    };
}
