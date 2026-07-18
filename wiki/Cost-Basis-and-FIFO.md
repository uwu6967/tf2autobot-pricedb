# Cost Basis & FIFO

This fork tracks **what you paid** for stock using FIFO (oldest unit sold first). That powers purchase history, profit, and optional sell reprice.

## Concepts

| Term | Meaning |
|---|---|
| **FIFO lot** | One unit of a SKU with paid keys/metal (+ key rate at buy time) |
| **Stock history** | Lots still in inventory (sold lots are removed) |
| **Floor sell** | Next lot’s paid cost + `partialPriceUpdate.minProfitScrap` |
| **Blank deposit** | Stock that arrived without a recorded buy lot |

FIFO data lives under your bot `files/<account>/` (gitignored). It is **not** on GitHub.

## What you see on `!get`

Steam / Discord `!get` (and `/get`) shows:

1. Normal pricelist entry (prices, autoprice flags, stock, …)
2. Cost-basis summary (avg / FIFO / floor when PPU data exists)
3. **Purchase history (stock)** — e.g. `46 items → 3 keys (56ref)`  
   - Paid price per lot group  
   - Key rate in refined at purchase (`~` if estimated)

Discord may send **multiple embeds** (entry + history).

## Automatic behaviour

### On buy (accepted trade)

- Creates FIFO lots for received items  
- Stores `keyPriceMetal` when known  
- Distributes overpay/underpay into `diffKeys` / `diffMetal`

### On sell (accepted trade)

- Removes the **oldest** lot(s)  
- Profit uses that lot’s **actual paid** cost and its key rate when available  
- May call **sell reprice** from the next remaining lot (see below)

### Sell reprice from next lot

After a sale, for entries that are **not** full live autoprice and **not** `autopriceSell`:

- Sell is set to next lot paid + `minProfitScrap`  
- Skips keys (`5021;6`) and metal currencies  
- If no lots remain, clears partial-priced flags when applicable

Controlled by PPU `minProfitScrap` in `options.json`:

```json
"pricelist": {
  "partialPriceUpdate": {
    "enable": true,
    "minProfitScrap": 1
  }
}
```

## `!setcost` — manual FIFO lots

Use for blank deposits, corrections, or seeding history.

### Examples

```text
!setcost sku=725;6;uncraftable&metal=25
!setcost sku=725;6;uncraftable&metal=25&amount=50&mode=replace
!setcost sku=725;6;uncraftable&metal=25&amount=10&mode=append
!setcost sku=725;6;uncraftable&keys=1&metal=10&amount=5
!setcost sku=725;6;uncraftable&clear=true
```

Also: `item=<name>`, `id=<priceKey/assetid>`.

### Parameters

| Param | Default | Meaning |
|---|---|---|
| `sku` / `item` / `id` | required | Which item |
| `keys` | `0` | Paid keys **per unit** |
| `metal` | `0` | Paid refined **per unit** |
| `amount` / `quantity` | current stock | How many units |
| `mode` | `replace` | `replace` = wipe SKU lots then add; `append` = add on top |
| `clear` | — | Wipe all lots for SKU (ignores price/amount) |
| `reprice` | `true` | Update sell from new FIFO + min profit |

Discord: `/setcost` with the same options.

### Caps

- Max **5000** units per command  
- Cost keys/metal must be ≥ 0  

## Tips

- After `!setcost`, run `!get` to confirm history  
- Prefer `mode=replace` when fixing a whole stack  
- Use `append` only when adding a new batch on top of good history  
- Full `autoprice` entries won’t get FIFO sell reprice (PriceDB owns sell)

## Related

- [Partial Autoprice](Partial-Autoprice)  
- [Discord](Discord)  
- [Features Overview](Features)
