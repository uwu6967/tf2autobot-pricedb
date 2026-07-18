# Partial Autoprice

Mix **live pricedb.io** prices with **manual** prices on the same item.

## Modes

| Mode | Behaviour |
|---|---|
| Full autoprice | Buy and sell follow the pricer |
| **Autoprice sell only** | Sell live; buy manual |
| **Autoprice buy only** | Buy live; sell manual |
| Manual | Both sides fixed |

Internally the bot uses flags such as `autoprice`, `autopriceBuy`, `autopriceSell`, and `isPartialPriced` (exact fields depend on entry version). The **GUI panel v3.6.2+** exposes sell-only / buy-only toggles in the price modal and translates them for IPC.

## Why use it

- Lock a buy price while still tracking market sell  
- Or lock sell (e.g. FIFO floor) while buy follows the market  
- Works with Unlisted Stock / manual list flows in the panel  

## Important behaviours (this fork)

- Setting a **manual buy** turns off live buy (`autopriceBuy`) unless you explicitly keep it on  
- Setting a **manual sell** turns off live sell (`autopriceSell`) unless you keep it on  
- Prevents PriceDB from immediately overwriting the side you just typed  

## Commands / Discord

Pricelist `!add` / `!update` / slash `/add` `/update` accept the usual listing params. Prefer the **panel** for toggles if you use partial modes daily.

## Related

- [Cost Basis & FIFO](Cost-Basis-and-FIFO) — sell reprice respects `autopriceSell`  
- [GUI Panel](GUI-Panel)  
- [Panel IPC](Panel-IPC)
