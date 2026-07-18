# Updating

How to get new blank-bot releases safely.

## Releases

Published on GitHub: https://github.com/uwu6967/tf2autobot-pricedb/releases

Pair with panel releases: https://github.com/uwu6967/tf2autobot-gui-panel/releases

Discord can notify you when a new bot version is available (if `DISCORD_BOT_TOKEN` is set and version alerts are enabled).

## Recommended: `!updaterepo`

If the bot was cloned with git and runs under **PM2**:

1. As admin in Steam or Discord: `!updaterepo`  
2. The fork keeps a working `dist/` until `npm run build` succeeds  
3. Compile failures fail cleanly instead of wiping the running build  

## Manual update

```bash
cd /path/to/tf2autobot-pricedb
git fetch --tags
git checkout v1.0.11   # or: git pull
npm install
npm run build
pm2 restart <your-bot>
```

Also update the panel when release notes say so:

```bash
cd /path/to/tf2autobot-gui-panel
git fetch --tags
git checkout v3.6.2    # or newer
npm install
npm run build
pm2 restart <your-panel>
```

## After updating

1. Confirm `.env` still has `IPC=true`  
2. Spot-check Discord / Autokeys if you use them  
3. `!get` an item to verify FIFO history still looks right  
4. Remove unused `HIVE_*` vars if you are on this blank bot (Hive is a [separate fork](Pure-Hive))  

## Version line (recent)

| Tag | Highlights |
|---|---|
| **v1.0.12** | Trade summaries: keys used + ≈ key worth |
| v1.0.11 | `!setcost` + full wiki rework |
| v1.0.10 | FIFO purchase history, lot profit, sell reprice |
| v1.0.9 | Hive moved to separate fork |
| v1.0.8 | (superseded) Hive briefly in main |
| v1.0.7 | Cost-basis embeds, boot-safe IPC, partial autoprice polish |
| v1.0.6 | Mega blank-bot on upstream 5.17.0 |
| v1.0.5 | Panel IPC string errors |
| v1.0.4 | Safe `!updaterepo` |
| v1.0.3 | Steam 429 resilience |

## Related

- [Getting Started](Getting-Started)  
- [Features Overview](Features)
