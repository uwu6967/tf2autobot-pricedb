# options.json Reference

The bot's behaviour is controlled by `options.json`, stored at:

```
files/<steam_account_name>/options.json
```

Copy the example to get started:

```bash
cp .example/options.json files/<your_steam_username>/options.json
```

You can edit this file directly or through the [GUI Panel](GUI-Panel) settings page.

## Top-level sections

| Section | Purpose |
|---|---|
| `steamConnection` | Auto-reconnect settings |
| `globalDisable` | Disable chat messages, greetings, commands |
| `miscSettings` | Core bot behaviour (counter offers, listings, game, ECP, etc.) |
| `sendAlert` | Discord/webhook alert toggles |
| `pricelist` | Pricelist behaviour, PPU, autoprice |
| `trade` | Trade acceptance rules |
| `discord` | Discord integration |
| `banned` | Ban list |
| `autoprice` | Autoprice settings |
| `normalize` | SKU normalization rules |

The full example at [`.example/options.json`](https://github.com/gfghdg2233/tf2autobot-pricedb/blob/master/.example/options.json) is the authoritative reference for every available key.

## globalDisable

Strongly recommended to reduce ban risk from Steam chat:

```json
"globalDisable": {
    "messages": true,
    "greeting": true,
    "commands": false,
    "adminCommands": false
}
```

| Key | Description |
|---|---|
| `messages` | Disable all outgoing Steam chat messages |
| `greeting` | Disable greeting messages |
| `commands` | Disable user commands (`!help`, `!price`, etc.) |
| `adminCommands` | Disable admin-only commands |

Use the GUI panel or Discord for management when chat is disabled.

## miscSettings highlights

### Counter offers

```json
"counterOffer": {
    "enable": true,
    "skipIncludeMessage": false,
    "autoDeclineLazyOffer": false,
    "useSeparateKeyRates": false
}
```

Set `useSeparateKeyRates: true` to value keys the bot gives at the **sell** price and keys it receives at the **buy** price.

### Listings

```json
"createListings": {
    "enable": true
}
```

### Easy Copy Paste (ECP)

```json
"ecp": {
    "useBoldChars": true,
    "useWordSwap": true
}
```

Use `%ecp_item%` in listing notes to insert user-friendly trade commands (e.g. `buy_Burning_Team_Captain`).

### PriceDB Store

```json
"pricedbStore": {
    "enable": true,
    "enableInventoryRefresh": true
}
```

Also requires `PRICEDB_STORE_API_KEY` in `.env`. See [PriceDB Store](PriceDB-Store).

### Command prefixes

```json
"prefixes": {
    "steam": "!",
    "discord": "!"
}
```

## partialPriceUpdate (PPU)

Located under `pricelist`:

```json
"partialPriceUpdate": {
    "enable": true,
    "thresholdInSeconds": 604800,
    "excludeSKU": [],
    "removeMaxRestriction": true,
    "maxProtectedUnits": -1,
    "minProfitScrap": 1,
    "stockGracePeriodSeconds": 3600
}
```

PPU protects against selling below your most recent buy price using FIFO queue logic. When you buy an item, that buy price is queued. If the market dips, sell listings won't go below the oldest queued buy until the threshold expires.

| Key | Description |
|---|---|
| `enable` | Turn PPU on/off |
| `thresholdInSeconds` | Seconds before a queued buy expires (604800 = 7 days) |
| `excludeSKU` | SKUs to skip PPU for |
| `removeMaxRestriction` | Remove max price restriction when PPU active |
| `maxProtectedUnits` | Max units protected (-1 = unlimited) |
| `minProfitScrap` | Minimum profit in scrap when PPU adjusts sell |
| `stockGracePeriodSeconds` | Grace period after stock changes |

## Listing note template variables

Use these in buy/sell listing notes:

| Variable | Replaced with |
|---|---|
| `%price%` | Listing price |
| `%name%` | Item name or item ID |
| `%ecp_item%` | ECP trade command |
| `%max_stock%` | Max stock capacity |
| `%current_stock%` | Current stock count |
| `%pricedb_store%` | Your pricedb.io / crit.tf store URL |
| `%pricedb_item%` | Direct item link on crit.tf |

Example:

```json
"buy": "🔥 %price% 📦 Stock: %current_stock% / %max_stock%. Send %ecp_item%. Store: %pricedb_store%"
```

## steamConnection

```json
"steamConnection": {
    "autoReconnect": {
        "enable": true,
        "maxAttempts": 5,
        "delaySeconds": 30,
        "exponentialBackoff": true
    }
}
```

## sendAlert

Controls which events trigger Discord/webhook alerts. All keys are booleans under `sendAlert` and its sub-objects. See the example file for the full list.

## Discord webhooks

Trade notifications are sent as rich Discord embeds when webhook URLs are configured under `discordWebhook`.

| Setting | Purpose |
|---|---|
| `offerReview.url` | Counter/review trade notifications |
| `tradeSummary.url` | Accepted trade notifications (array) |
| `declinedTrade.url` | Declined trade notifications (array) |

As of **v5.16.7**, if `tradeSummary.url` or `declinedTrade.url` is empty but `offerReview.url` is set, the bot automatically reuses the offer review webhook. This keeps accepted trades formatted like countered trades without duplicating URLs in `options.json`.

For separate channels, set explicit URLs in each section:

```json
"tradeSummary": {
    "enable": true,
    "url": ["https://discord.com/api/webhooks/..."]
},
"offerReview": {
    "enable": true,
    "url": "https://discord.com/api/webhooks/..."
}
```

## Editing safely

- The bot validates `options.json` on load — invalid JSON will prevent startup
- Use the GUI panel settings editor for safer edits with validation
- Back up `files/<username>/options.json` before major changes
- After editing, restart the bot or use the panel to apply changes

## Stats command

If upgrading from an older version, rename `polldata.json` to `polldata.old.json` to avoid skewed `!stats` historical data. The new stats system tracks keys and metal separately for more accurate profit estimates.

## Further reading

- [PriceDB Store](PriceDB-Store)
- [Configuring the Bot](Configuring-the-Bot)
- [Example options.json](https://github.com/gfghdg2233/tf2autobot-pricedb/blob/master/.example/options.json)
