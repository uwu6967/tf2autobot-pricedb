# TF2Autobot — PriceDB Fork Wiki

Welcome to the documentation for [tf2autobot-pricedb](https://github.com/gfghdg2233/tf2autobot-pricedb).

This is a fork of [TF2Autobot](https://github.com/TF2Autobot/tf2autobot) adapted for [pricedb.io](https://pricedb.io) pricing, with a companion [GUI Panel](https://github.com/gfghdg2233/tf2autobot-gui-panel) for day-to-day management.

## What you need

| Component | Repository | Purpose |
|---|---|---|
| **Bot** | [tf2autobot-pricedb](https://github.com/gfghdg2233/tf2autobot-pricedb) | Steam login, trades, backpack.tf listings |
| **GUI Panel** | [tf2autobot-gui-panel](https://github.com/gfghdg2233/tf2autobot-gui-panel) | Browser UI for pricelist, settings, trades, profit |

The bot and panel run as **two separate processes**. The panel talks to the bot over IPC — it does not log into Steam itself.

## Quick links

| Guide | Description |
|---|---|
| [Getting Started](Getting-Started) | First-time setup overview |
| [Installing the Bot](Installing-the-Bot) | Clone, build, and run |
| [GUI Panel](GUI-Panel) | Set up the web panel |
| [Configuring the Bot](Configuring-the-Bot) | Environment variables (`.env`) |
| [options.json Reference](Configure-your-options.json-file) | Bot behaviour and trading rules |
| [PriceDB Store](PriceDB-Store) | Mirror sell listings to crit.tf |
| [Common Errors](Common-Errors) | Troubleshooting |
| [FAQ](FAQ) | Frequently asked questions |
| [Credits](Credits) | Upstream projects and attribution |

## Fork highlights

- **pricedb.io** as the default pricer (replaces the old prices.tf workflow)
- **PriceDB Store** mirroring for sell listings
- **[Journal.tf](https://journal.tf)** portfolio tracking
- **Easy Copy Paste (ECP)** trade commands in listing notes
- **Improved PPU** — FIFO queue logic for multi-unit stock protection
- **Separate key buy/sell rates** for accurate trade valuation

## Requirements

- Node.js **22+**
- Steam account with Mobile Authenticator
- backpack.tf API key and access token
- pricedb.io account (default pricing)

## Support

Open an issue on the [bot repository](https://github.com/gfghdg2233/tf2autobot-pricedb/issues) for fork-specific problems.

For the GUI panel, use the [panel repository](https://github.com/gfghdg2233/tf2autobot-gui-panel/issues).
