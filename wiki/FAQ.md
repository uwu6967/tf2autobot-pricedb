# FAQ

## General

### Is this the same as TF2Autobot?

It is a **fork** of the PriceDB / TF2Autobot line. Setup feels familiar, but pricing defaults to **pricedb.io**, and this fork adds FIFO cost basis, partial autoprice, Discord UX, panel IPC fixes, Mannco, etc. See [Features](Features).

### Do I need the GUI panel?

Strongly recommended. The panel is how you manage pricelist, Unlisted Stock, and settings day to day. The bot still does all Steam work.

### Where is Pure Hive?

On a **separate** fork: [tf2autobot-pricedb-hive](https://github.com/uwu6967/tf2autobot-pricedb-hive) + [tf2autobot-pure-hive](https://github.com/uwu6967/tf2autobot-pure-hive). This blank bot does **not** include Hive. See [Pure Hive](Pure-Hive).

## Pricing & stock

### What is partial autoprice?

Live price on **one** side (buy or sell) while the other is manual. [Guide](Partial-Autoprice).

### Why did my manual price flip back to live?

On this fork, setting a manual buy/sell turns off that side’s live flag unless you keep it on. If both sides still look “live”, check panel toggles / entry flags.

### What is FIFO / purchase history?

Each bought unit stores paid cost. `!get` shows lots still in stock. [Cost Basis & FIFO](Cost-Basis-and-FIFO).

### I deposited items from my main with no buy trade — cost history is empty

Use `!setcost` (or `/setcost`) to seed lots, e.g.:

```text
!setcost sku=…&metal=25&amount=50&mode=replace
```

### Can sell update itself after I sell one?

Yes — for non-full-autoprice entries, sell can reprice from the **next** FIFO lot + min profit scrap.

## Discord & updates

### Steam chat gets me banned?

Use `globalDisable.messages` / `greeting` and prefer Discord + panel. [Discord](Discord).

### How do I update?

`!updaterepo` on PM2+git, or pull the release tag. [Updating](Updating).

## Panel

### “no bot found”

Bot not running, `IPC` off, or panel session stuck on an old SteamID — restart panel after account switches. [Panel IPC](Panel-IPC).

### Unlisted Stock empty / errors

Need a bot build with inventory IPC (this fork). Unique items may use asset ids.

## Related

- [Common Errors](Common-Errors)  
- [Getting Started](Getting-Started)
