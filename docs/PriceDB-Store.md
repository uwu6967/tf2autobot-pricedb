# PriceDB Store

This fork can mirror your backpack.tf **sell** listings to your [pricedb.io](https://pricedb.io) / [crit.tf](https://crit.tf) store.

## Setup

### 1. Get your store API key

Create an account on pricedb.io and obtain your Store API key.

### 2. Set the environment variable

In the bot `.env`:

```bash
PRICEDB_STORE_API_KEY=your_api_key_here
```

### 3. Enable in options.json

Under `miscSettings`:

```json
"pricedbStore": {
    "enable": true,
    "enableInventoryRefresh": true
}
```

| Key | Description |
|---|---|
| `enable` | Turn on store mirroring |
| `enableInventoryRefresh` | Periodically refresh store inventory from the bot |

### 4. Restart the bot

Restart after changing `.env` or `options.json`.

## Listing note variables

Add these to your buy/sell listing notes in `options.json`:

| Variable | Output |
|---|---|
| `%pricedb_store%` | Your store URL (e.g. `https://crit.tf/sf/your-slug`) |
| `%pricedb_item%` | Direct link to the item on crit.tf |

Example sell note:

```json
"sell": "🔥 %price% 📦 %current_stock%/%max_stock%. %ecp_item%. Visit %pricedb_store%"
```

## How mirroring works

- When the bot creates or updates a **sell** listing on backpack.tf, it also creates/updates the listing on your pricedb.io store
- When a sell listing is removed from backpack.tf, it is removed from the store
- **Buy** listings are not mirrored (store only supports sell listings)
- If an item is missing from the store inventory, the bot attempts an inventory refresh automatically

## Troubleshooting

### Listings not appearing on crit.tf

- Confirm `PRICEDB_STORE_API_KEY` is set and valid
- Confirm `pricedbStore.enable` is `true`
- Check bot logs for pricedb store errors
- Ensure the item exists in the bot's TF2 inventory

### Store URL not showing in listings

- Make sure `%pricedb_store%` is in your listing note template
- Run `!refreshlist` or recreate listings after enabling the store

## Further reading

- [options.json Reference](Configure-your-options.json-file)
- [Configuring the Bot](Configuring-the-Bot)
