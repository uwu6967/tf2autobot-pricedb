# TF2Autobot — PriceDB Fork Wiki

Documentation for **[uwu6967/tf2autobot-pricedb](https://github.com/uwu6967/tf2autobot-pricedb)** — a blank TF2 trading bot using [pricedb.io](https://pricedb.io), built for the [GUI Panel](https://github.com/uwu6967/tf2autobot-gui-panel).

Browse online: **[docs site](https://uwu6967.github.io/tf2autobot-pricedb/Home.html)** · **[GitHub Wiki](https://github.com/uwu6967/tf2autobot-pricedb/wiki)**

**Current bot release:** [v1.0.12](https://github.com/uwu6967/tf2autobot-pricedb/releases/tag/v1.0.12) · **Panel:** [v3.6.2](https://github.com/uwu6967/tf2autobot-gui-panel/releases/tag/v3.6.2)

---

## Repositories

| Component | Repository | Purpose |
|---|---|---|
| **Bot (this)** | [tf2autobot-pricedb](https://github.com/uwu6967/tf2autobot-pricedb) | Steam login, trades, backpack.tf listings |
| **GUI Panel** | [tf2autobot-gui-panel](https://github.com/uwu6967/tf2autobot-gui-panel) | Browser UI — pricelist, trades, settings, profit |
| **Hive bot fork** | [tf2autobot-pricedb-hive](https://github.com/uwu6967/tf2autobot-pricedb-hive) | Same bot **+ Pure Hive** (keys/ref sharing) |
| **Hive API** | [tf2autobot-pure-hive](https://github.com/uwu6967/tf2autobot-pure-hive) | Companion API for the Hive fork |

The bot and panel are **two processes**. The panel talks to the bot over IPC — it never logs into Steam itself.

---

## Quick links

### Setup
| Guide | Description |
|---|---|
| [Getting Started](Getting-Started) | First-time checklist |
| [Installing the Bot](Installing-the-Bot) | Clone, build, run |
| [GUI Panel](GUI-Panel) | Web panel + IPC |
| [Configuring the Bot](Configuring-the-Bot) | `.env` variables |
| [options.json Reference](Configure-your-options.json-file) | Trading rules & behaviour |
| [Updating](Updating) | `!updaterepo`, GitHub releases |

### Features
| Guide | Description |
|---|---|
| [Features Overview](Features) | What this fork adds |
| [Partial Autoprice](Partial-Autoprice) | Sell-only / buy-only live prices |
| [Cost Basis & FIFO](Cost-Basis-and-FIFO) | Purchase history, `!setcost`, sell reprice |
| [Discord](Discord) | Alerts, slash commands, Autokeys |
| [PriceDB Store](PriceDB-Store) | Mirror sell listings to crit.tf |
| [Mannco.store](Mannco-Store) | Optional Mannco deposits & buy orders |
| [Pure Hive](Pure-Hive) | Keys/ref sharing (separate fork) |
| [Panel IPC](Panel-IPC) | How the GUI talks to the bot |

### Help
| Guide | Description |
|---|---|
| [Common Errors](Common-Errors) | Troubleshooting |
| [FAQ](FAQ) | Common questions |
| [Credits](Credits) | Upstream projects |

---

## Fork highlights (v1.0.x)

- **pricedb.io** default pricer + optional **PriceDB Store** mirroring
- **Partial autoprice** — live buy *or* sell while the other side is manual
- **FIFO cost basis** — purchase history on `!get`, lot-accurate profit, sell reprice after sales, manual `!setcost`
- **Discord** — version alerts, Autokeys controls, Unhalt, pricelist slash commands, multi-embed replies
- **Panel IPC** — string errors, boot-safe calls, Unlisted Stock inventory
- **Mannco.store** — optional USD listing / withdraw / buy-order commands
- **Blank installs** — never commit `.env` or `files/`
- **Pure Hive** — optional multi-bot pure sharing on a **separate** fork

---

## Requirements

- Node.js **22+**
- Steam account with Mobile Authenticator (15+ days for unrestricted trading)
- backpack.tf API key + access token
- pricedb.io account

Optional: Discord bot token, PriceDB Store key, Mannco API key, PM2/Docker.

---

## Support

- Bot issues: [tf2autobot-pricedb/issues](https://github.com/uwu6967/tf2autobot-pricedb/issues)
- Panel issues: [tf2autobot-gui-panel/issues](https://github.com/uwu6967/tf2autobot-gui-panel/issues)
- Hive: use the [pricedb-hive](https://github.com/uwu6967/tf2autobot-pricedb-hive) / [pure-hive](https://github.com/uwu6967/tf2autobot-pure-hive) repos
