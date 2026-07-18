# Common Errors

## Steam / login

| Error / symptom | What to try |
|---|---|
| Rate limit / HTTP 429 | This fork retries escrow / trade URL / localization instead of crash-looping. Wait and let it recover. |
| Login / 2FA failures | Check `STEAM_SHARED_SECRET` / identity secret; authenticator clock skew |
| Trade URL missing | Bot caches trade URL; ensure Steam inventory is public enough for trading |

## backpack.tf / listings

| Error / symptom | What to try |
|---|---|
| Listings not posting | Valid `BPTF_ACCESS_TOKEN` for **this** bot account; trade URL set on bptf |
| Cap / slot errors | Free listing slots; check archived vs active |
| 429 from bptf | Back off; don’t spam `!refreshlist` |

## Pricelist / FIFO

| Error / symptom | What to try |
|---|---|
| “Item not found in new pricelist” | SKU missing from pricedb dump; unique items use SKU for price lookup |
| Empty purchase history | No FIFO lots — use `!setcost` after blank deposits |
| `!setcost` quantity errors | Amount must be integer 0–5000; pass `amount=` if stock is 0 |
| Sell didn’t reprice after sale | Full `autoprice` or `autopriceSell` skips FIFO reprice |

## Panel / IPC

| Error / symptom | What to try |
|---|---|
| no bot found | Bot up? `IPC=true`? Restart panel after switching bots |
| Empty / weird errors on add | Bot ≥ v1.0.5 for string IPC errors |
| Bot is still starting | Wait for pricelist ready; retry |
| Panel can’t connect | Same machine / firewall; TLS settings if used |

## Updates

| Error / symptom | What to try |
|---|---|
| `!updaterepo` left no dist | Use this fork (≥ v1.0.4) — keeps dist until build OK |
| Wrong version after pull | `git checkout` the release tag; `npm install && npm run build` |

## Mannco

| Error / symptom | What to try |
|---|---|
| Commands ignored | `MANNCO_STORE_API_KEY` + `miscSettings.manncoStore.enable` |
| Instant sell on deposit | Expected if a buy order matches — `confirm=true` is required on purpose |

## Still stuck?

1. Check bot logs (`logs/` or PM2)  
2. Confirm you’re on the [latest release](https://github.com/uwu6967/tf2autobot-pricedb/releases)  
3. Open an issue with logs (redact secrets)

## Related

- [FAQ](FAQ)  
- [Updating](Updating)  
- [Panel IPC](Panel-IPC)
