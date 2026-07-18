/**
 * Build a cart reject message for inventory fetch failures.
 * Tags Steam HTTP 429 so the queue can use a longer backoff.
 */
export function inventoryLoadFailureMessage(err: unknown): string {
    if (isSteamInventoryRateLimit(err)) {
        return (
            'Failed to load your inventory (Steam rate limit 429). ' +
            'Please wait while I retry. If your profile/inventory is private, set it to public.'
        );
    }

    return (
        'Failed to load your inventory, Steam might be down. ' +
        'Please try again later. If you have your profile/inventory set to private, please set it to public and try again.'
    );
}

export function isSteamInventoryRateLimit(err: unknown): boolean {
    if (err == null) {
        return false;
    }

    if (typeof err === 'object') {
        const anyErr = err as { code?: number | string; message?: string; statusCode?: number };
        if (anyErr.code === 429 || anyErr.statusCode === 429 || String(anyErr.code) === '429') {
            return true;
        }
        if (typeof anyErr.message === 'string' && /429|rate.?limit/i.test(anyErr.message)) {
            return true;
        }
    }

    return /429|rate.?limit/i.test(String(err));
}

export function isInventoryLoadFailure(err: unknown): boolean {
    return String(err).includes('Failed to load your inventory');
}
