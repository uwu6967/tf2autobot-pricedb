# TF2Autobot — PriceDB Fork

A fully automated Team Fortress 2 trading bot that lists items on [backpack.tf](https://backpack.tf) and prices them using [pricedb.io](https://pricedb.io).

This repository is a personal fork built on top of the [pricedb.io edition](https://github.com/TF2-Price-DB/tf2autobot-pricedb), which itself extends the original **[TF2Autobot](https://github.com/TF2Autobot/tf2autobot)** project. If you have run TF2Autobot before, most of the setup and day-to-day workflow will feel familiar.

**This bot is intended to run alongside the [TF2Autobot GUI Panel](https://github.com/uwu6967/tf2autobot-gui-panel).** The panel is the recommended way to manage your pricelist, review trades, edit settings, and monitor profit — the bot handles Steam trading in the background and communicates with the panel over IPC.

## GUI Panel

The companion web panel lives in a separate repository:

**[github.com/uwu6967/tf2autobot-gui-panel](https://github.com/uwu6967/tf2autobot-gui-panel)**

| Component | Role |
|---|---|
| **This repo (bot)** | Logs into Steam, processes trades, manages backpack.tf listings |
| **[GUI Panel](https://github.com/uwu6967/tf2autobot-gui-panel)** | Browser UI for pricelist, trades, settings, profit tracking |

The panel does not log into Steam itself. It talks to your running bot over IPC while the bot handles all Steam and TF2 interactions.

### Running bot + panel together

1. **Start the bot** with IPC enabled in your `.env`:

```bash
IPC=true
```

2. **Start the GUI panel** (in a separate terminal):

```bash
git clone https://github.com/uwu6967/tf2autobot-gui-panel.git
cd tf2autobot-gui-panel
npm install
cp template.env .env
npm run build
npm start
```

3. Open **http://localhost:3000** in your browser and connect to your bot.

See the [panel README](https://github.com/uwu6967/tf2autobot-gui-panel) for full setup, Steam admin login, TLS/VPS deployment, and troubleshooting.

## What this bot does

- Logs into Steam and manages trade offers automatically
- Creates and maintains backpack.tf buy/sell listings from your pricelist
- Accepts, declines, and counters trades based on your rules
- Supports Discord alerts, admin commands, and a wide range of trading features from the upstream project

## What's different in this fork

Compared to upstream TF2Autobot, this lineage adds:

- **[pricedb.io](https://pricedb.io)** as the default pricing source (replacing the old prices.tf workflow)
- **PriceDB Store integration** — sell listings on backpack.tf can be mirrored to your pricedb.io/crit.tf store
- **[Journal.tf](https://journal.tf)** integration for portfolio and profit tracking
- **Easy Copy Paste (ECP)** — user-friendly buy/sell command aliases in listing notes
- **Improved Partial Price Update (PPU)** — FIFO queue logic for multi-unit stock protection
- **Separate key buy/sell rates** for more accurate trade valuation

## Requirements

- **Node.js 22+**
- **[TF2Autobot GUI Panel](https://github.com/uwu6967/tf2autobot-gui-panel)** — required for the intended setup (pricelist management, settings, trade review)
- A Steam account with:
  - Steam Guard Mobile Authenticator
  - A valid trade URL
- A [backpack.tf](https://backpack.tf) API key
- A [pricedb.io](https://pricedb.io) account (for default pricing)

Optional but recommended:

- [PM2](https://pm2.keymetrics.io/) or Docker for running in production
- Discord bot token for alerts and remote commands
- PriceDB Store API key if you want store mirroring

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/uwu6967/tf2autobot-pricedb.git
cd tf2autobot-pricedb
npm install
npm run build
```

### 2. Configure environment variables

Copy the example env file and fill in your credentials locally. **Never commit your real `.env` file** — it is gitignored by default.

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|---|---|
| `STEAM_ACCOUNT_NAME` | Steam login username |
| `STEAM_PASSWORD` | Steam login password |
| `STEAM_SHARED_SECRET` | Shared secret from your Steam authenticator |
| `STEAM_IDENTITY_SECRET` | Identity secret for trade confirmations |
| `BPTF_API_KEY` | backpack.tf API key |
| `BPTF_ACCESS_TOKEN` | backpack.tf access token |

See [`.env.example`](.env.example) for the full list, including optional integrations (Discord, inventory APIs, Journal.tf, custom pricer, etc.).

### 3. Configure `options.json`

Copy the example options file into your bot's `files/<steam_account_name>/` directory and edit it to match your trading strategy:

```bash
mkdir -p files/<your_steam_username>
cp .example/options.json files/<your_steam_username>/options.json
```

The example file at [`.example/options.json`](.example/options.json) is the best reference for available settings.

### 4. Enable IPC

The GUI panel connects to the bot over IPC. Make sure this is set in your `.env`:

```bash
IPC=true
```

### 5. Run the bot

```bash
node dist/app.js
```

For production, PM2 is recommended. See [`template.ecosystem.json`](template.ecosystem.json) for a starting point.

### 6. Start the GUI panel

With the bot running, start the panel from its own repository:

```bash
git clone https://github.com/uwu6967/tf2autobot-gui-panel.git
cd tf2autobot-gui-panel
npm install && cp template.env .env && npm run build && npm start
```

Open **http://localhost:3000**, connect to your bot, and manage everything from the browser. Full panel docs: [tf2autobot-gui-panel](https://github.com/uwu6967/tf2autobot-gui-panel).

## Configuration highlights

### Global chat disable

Valve has been banning bots that send Steam chat messages. It is strongly recommended to disable non-essential messaging:

```json
"globalDisable": {
    "messages": true,
    "greeting": true,
    "commands": false,
    "adminCommands": false
}
```

### PriceDB Store mirroring

To mirror sell listings to pricedb.io/crit.tf:

1. Set `PRICEDB_STORE_API_KEY` in your `.env`
2. Enable the store in `options.json`:

```json
"pricedbStore": {
    "enable": true,
    "enableInventoryRefresh": true
}
```

3. Use template variables in your listing notes:

| Variable | Replaced with |
|---|---|
| `%pricedb_store%` | Your store URL |
| `%pricedb_item%` | Direct link to the item |
| `%ecp_item%` | Easy Copy Paste trade command |
| `%price%` | Listing price |
| `%current_stock%` | Current stock count |
| `%max_stock%` | Max stock limit |

Example listing note:

```json
"buy": "🔥 %price% 📦 Stock: %current_stock% / %max_stock%. Send %ecp_item%. Store: %pricedb_store%"
```

### Separate key rates

Control how keys are valued during trade calculations:

```json
"counterOffer": {
    "enable": true,
    "useSeparateKeyRates": true
}
```

When enabled, keys the bot gives are valued at the **sell** price and keys the bot receives are valued at the **buy** price.

### Partial Price Update (PPU)

Protects against selling below your most recent buy price using FIFO queue logic:

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

### Journal.tf

Set these in your `.env` to enable portfolio tracking:

```bash
JOURNAL_TF_ENABLE=true
JOURNAL_TF_API_KEY=your_api_key_here
```

## Docker

A `Dockerfile` is included. Build and run with your environment variables mounted or passed in at runtime. Do not bake secrets into the image.

## Project structure

```
tf2autobot-pricedb/
├── src/                  # TypeScript source
├── dist/                 # Compiled output (after npm run build)
├── .example/             # Example options.json
├── files/                # Per-account runtime data (gitignored)
├── .env.example          # Environment variable template
├── template.env          # Alternate env template
└── template.ecosystem.json
```

## Documentation

Full guides are available on the **[project wiki](https://github.com/uwu6967/tf2autobot-pricedb/wiki)** and **[docs site](https://uwu6967.github.io/tf2autobot-pricedb/Home.html)**:

- [Wiki home](https://github.com/uwu6967/tf2autobot-pricedb/wiki) · [Docs home](https://uwu6967.github.io/tf2autobot-pricedb/Home.html)
- [Getting Started](https://github.com/uwu6967/tf2autobot-pricedb/wiki/Getting-Started)
- [Installing the Bot](https://github.com/uwu6967/tf2autobot-pricedb/wiki/Installing-the-Bot)
- [GUI Panel](https://github.com/uwu6967/tf2autobot-pricedb/wiki/GUI-Panel)
- [Configuring the Bot](https://github.com/uwu6967/tf2autobot-pricedb/wiki/Configuring-the-Bot)
- [options.json reference](https://github.com/uwu6967/tf2autobot-pricedb/wiki/Configure-your-options.json-file)
- [PriceDB Store](https://github.com/uwu6967/tf2autobot-pricedb/wiki/PriceDB-Store)
- [Common Errors](https://github.com/uwu6967/tf2autobot-pricedb/wiki/Common-Errors)
- [FAQ](https://github.com/uwu6967/tf2autobot-pricedb/wiki/FAQ)

Wiki source files also live in the [`wiki/`](https://github.com/uwu6967/tf2autobot-pricedb/tree/master/wiki) folder in the main repository.

For issues specific to this fork, open an issue on this repository.

## Credits

This project would not exist without the work of many people:

| Project | Author / Maintainer |
|---|---|
| [TF2Autobot](https://github.com/TF2Autobot/tf2autobot) | TF2Autobot community — **direct upstream fork** |
| [tf2-automatic](https://github.com/Nicklason/tf2-automatic) | Nicklason — original automatic trading bot |
| [pricedb.io TF2Autobot fork](https://github.com/TF2-Price-DB/tf2autobot-pricedb) | TF2-Price-DB / Oliver Perring — pricedb.io integration |
| [Easy Copy Paste](https://github.com/TryHardDo/EasyCopyPaste) | TryHardDo — ECP listing commands |
| [TF2Autobot GUI Panel](https://github.com/uwu6967/tf2autobot-gui-panel) | Companion web UI for this bot |

## License

MIT — see [LICENSE](LICENSE) for details.
