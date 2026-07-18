# Pure Hive

**Pure Hive is not in this blank bot.** It lives on a separate fork so trading-only installs stay simple.

| Repo | Role |
|---|---|
| [tf2autobot-pricedb](https://github.com/uwu6967/tf2autobot-pricedb) | Blank trading bot (**this wiki**) |
| [tf2autobot-pricedb-hive](https://github.com/uwu6967/tf2autobot-pricedb-hive) | Bot **+ Pure Hive** |
| [tf2autobot-pure-hive](https://github.com/uwu6967/tf2autobot-pure-hive) | Hive API |

## What Hive does

Opt-in **keys & refined** sharing between *your* linked bots:

- Mutual link (invite + accept) required  
- Auto-rebalance and/or manual `!hive push`  
- Caps and cooldowns  
- Off by default  

It does **not** replace Autokeys (market banking).

## Quick start (Hive fork)

```bash
# API
git clone https://github.com/uwu6967/tf2autobot-pure-hive.git
cd tf2autobot-pure-hive
cp template.env .env   # set HIVE_ADMIN_SECRET
npm install && npm start
npm run token -- "bot-label"

# Bot
git clone https://github.com/uwu6967/tf2autobot-pricedb-hive.git
cd tf2autobot-pricedb-hive
cp template.env .env   # set HIVE_TOKEN + HIVE_API_URL
npm install && npm run build
```

Then `hive.enable=true` in options and `!hive link` / `!hive accept` between bots.

Full guide: [pricedb-hive wiki / Pure-Hive.md](https://github.com/uwu6967/tf2autobot-pricedb-hive/blob/master/wiki/Pure-Hive.md) (on that repository).

## Related

- [Features Overview](Features)  
- [Updating](Updating)
