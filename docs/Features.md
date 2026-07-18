# Features Overview

What this fork adds on top of classic TF2Autobot / PriceDB.

## Pricing

| Feature | Summary |
|---|---|
| **pricedb.io** | Default live pricer (socket) |
| **Partial autoprice** | Live **buy only** or **sell only**; other side manual — [guide](Partial-Autoprice) |
| **PPU** | Partial Price Update — FIFO stock protection (upstream + improvements) |
| **Price ranges** | Optional `minBuy` / `maxBuy` / `minSell` / `maxSell` clamps |
| **Asset-id keys** | Unique items can use asset id as priceKey; autoprice looks up by SKU |

## Cost basis & profit

| Feature | Summary |
|---|---|
| **FIFO lots** | Each bought unit stores paid cost (+ key rate) |
| **Purchase history** | `!get` / Discord shows stock-only lots |
| **`!setcost`** | Manually set/clear lots (blank deposits, corrections) |
| **Sell reprice** | After a sale, sell can follow next lot + min profit |
| **Lot profit** | Accepted-trade profit uses the exact sold lot’s paid cost |

See [Cost Basis & FIFO](Cost-Basis-and-FIFO).

## Discord & admin UX

| Feature | Summary |
|---|---|
| Version update alerts | Discord notification when a new GitHub release exists |
| Autokeys controls | Discord / Steam |
| Startup Unhalt | Unhalt without Steam chat spam |
| Slash listings | `/add`, `/update`, `/get`, `/setcost`, … |
| Multi-embed replies | e.g. get + purchase history |
| Trade worth in keys | Offer summaries show keys exchanged + ≈ key worth |

See [Discord](Discord).

## Panel

| Feature | Summary |
|---|---|
| IPC bridge | Full pricelist / options / inventory / trades |
| String errors | Readable failures in the UI |
| Boot-safe IPC | Clear messages while the bot is still starting |
| Unlisted Stock | List backpack items not on the pricelist |
| Partial autoprice UI | Panel v3.6.2+ toggles |

See [GUI Panel](GUI-Panel) and [Panel IPC](Panel-IPC).

## Integrations

| Feature | Summary |
|---|---|
| **PriceDB Store** | Mirror backpack.tf sell listings — [guide](PriceDB-Store) |
| **Mannco.store** | Optional USD deposits / buy orders — [guide](Mannco-Store) |
| **Journal.tf** | Portfolio tracking via `.env` |
| **Pure Hive** | Keys/ref between *your* bots — **separate fork** — [guide](Pure-Hive) |

## Ops

| Feature | Summary |
|---|---|
| Blank GitHub installs | No `.env` / `files/` in the repo |
| Safe `!updaterepo` | Keeps `dist/` until build succeeds |
| Steam 429 resilience | Rate limits don’t crash-loop PM2 |
| Node 22+ | Required runtime |

See [Updating](Updating).
