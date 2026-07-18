# Configuring the Bot

Environment variables are loaded from a `.env` file in the bot root directory.

```bash
cp .env.example .env
```

**Never commit `.env` to git.** It contains your Steam password, API keys, and secrets.

## Required variables

| Variable | Description |
|---|---|
| `STEAM_ACCOUNT_NAME` | Steam login username |
| `STEAM_PASSWORD` | Steam login password |
| `STEAM_SHARED_SECRET` | Shared secret from your authenticator (for 2FA codes) |
| `STEAM_IDENTITY_SECRET` | Identity secret (for trade confirmations) |
| `BPTF_API_KEY` | backpack.tf API key |
| `BPTF_ACCESS_TOKEN` | backpack.tf access token |

Get backpack.tf credentials from [backpack.tf/connections](https://backpack.tf/connections).

## Steam API key

| Variable | Description |
|---|---|
| `STEAM_API_KEY` | Steam Web API key — optional but recommended |

Get one from [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey). If omitted, the bot uses access tokens where supported.

## Admin and friends

| Variable | Default | Description |
|---|---|---|
| `ADMINS` | — | JSON array of admin SteamID64s (and optional Discord IDs) |
| `KEEP` | `[]` | SteamID64s to keep on the friends list |
| `GROUPS` | `["103582791475394761"]` | Steam group IDs to invite users to |
| `ALERTS` | `["trade", "version"]` | Alert types to send |

Example:

```bash
ADMINS=[{ "steam": "76561198000000000", "discord": null }]
KEEP=["76561198000000001"]
```

## Pricer and store

| Variable | Default | Description |
|---|---|---|
| `ENABLE_SOCKET` | `true` | Enable pricedb.io socket pricer |
| `CUSTOM_PRICER_URL` | — | Custom pricer socket URL |
| `CUSTOM_PRICER_API_TOKEN` | — | Token for custom pricer |

Store API key is listed under optional integrations below.

## Optional integrations

| Variable | Default | Description |
|---|---|---|
| `DISCORD_BOT_TOKEN` | — | Discord bot token for alerts and slash commands — [Discord](Discord) |
| `PRICEDB_STORE_API_KEY` | — | pricedb.io / crit.tf store mirroring — [PriceDB Store](PriceDB-Store) |
| `MANNCO_STORE_API_KEY` | — | Mannco.store API (often set in ecosystem) — [Mannco](Mannco-Store) |
| `MPTF_API_KEY` | — | marketplace.tf API key |
| `STEAMSUPPLY_API_KEY` | — | steam.supply inventory API |
| `STEAMAPIS_API_KEY` | — | steamapis.com inventory API |
| `EXPRESSLOAD_API_KEY` | — | expressload.io inventory API |
| `JOURNAL_TF_ENABLE` | `false` | Enable Journal.tf integration |
| `JOURNAL_TF_API_KEY` | — | Journal.tf API key |

> **Hive tokens** (`HIVE_TOKEN`, `HIVE_API_URL`) belong on the [Hive bot fork](Pure-Hive), not this blank bot.

## IPC and GUI panel

| Variable | Default | Description |
|---|---|---|
| `IPC` | `true` | Enable IPC for the GUI panel — **keep this on** |
| `TLS` | `false` | Use TLS for IPC |
| `TLS_HOST` | `localhost` | TLS host |
| `TLS_PORT` | `8000` | TLS port |

## HTTP API

| Variable | Default | Description |
|---|---|---|
| `ENABLE_HTTP_API` | `false` | Enable HTTP API |
| `HTTP_API_PORT` | `3002` | HTTP API port |

## Behaviour flags

| Variable | Default | Description |
|---|---|---|
| `SKIP_BPTF_TRADEOFFERURL` | `true` | Skip setting trade URL on backpack.tf profile |
| `SKIP_UPDATE_PROFILE_SETTINGS` | `true` | Skip updating backpack.tf profile settings |
| `RUN_ON_ANDROID` | `false` | Android compatibility mode |
| `ITEM_STATS_WHITELIST` | `[]` | SteamID64s allowed to use item stats |

## Logging and locale

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `production` | Node environment |
| `DEBUG` | `true` | Enable debug logging |
| `DEBUG_FILE` | `true` | Write debug to file |
| `ENABLE_SAVE_LOG_FILE` | `true` | Save log files |
| `TF2_LANGUAGE` | `english` | TF2 language |
| `TIMEZONE` | `Europe/London` | Timezone for timestamps |
| `CUSTOM_TIME_FORMAT` | `MMMM Do YYYY, HH:mm:ss ZZ` | Moment.js time format |
| `USERAGENT_HEADER_CUSTOM` | — | Custom user-agent string |
| `USERAGENT_HEADER_SHOW_VERSION` | `false` | Append version to user-agent |

## PM2 / ecosystem file

For PM2, copy `template.ecosystem.json` to `ecosystem.config.json` and put all variables under `env`:

```json
{
    "apps": [{
        "name": "tf2autobot",
        "script": "dist/app.js",
        "env": {
            "STEAM_ACCOUNT_NAME": "",
            "STEAM_PASSWORD": "",
            ...
        }
    }]
}
```

`ecosystem.config.json` is gitignored.

## Where files are stored

Runtime data is saved per Steam account:

```
files/<STEAM_ACCOUNT_NAME>/
├── options.json
├── pricelist.json
├── polldata.json
├── refreshToken.txt
├── … FIFO / cost-basis data …
└── ...
```

The `files/` directory is gitignored — **never commit it**.

## Next steps

→ [options.json Reference](Configure-your-options.json-file) · [Features](Features) · [Updating](Updating)
