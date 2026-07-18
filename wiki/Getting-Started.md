# Getting Started

Full first-time setup: **bot + GUI panel**.

## Overview

```
┌─────────────┐     IPC      ┌──────────────┐     Steam     ┌────────┐
│  GUI Panel  │ ◄──────────► │  TF2Autobot  │ ◄───────────► │  TF2   │
│  (browser)  │              │    (bot)     │               │ / BPTF │
└─────────────┘              └──────────────┘               └────────┘
```

1. The **bot** logs into Steam, handles trades, and manages backpack.tf listings.  
2. The **GUI panel** connects over IPC for pricelist, settings, trades, Unlisted Stock.  
3. Optional: Discord for alerts / slash commands ([Discord](Discord)).

## Before you begin

| Credential | Where |
|---|---|
| Steam login + password | Your Steam account |
| `STEAM_SHARED_SECRET` + `STEAM_IDENTITY_SECRET` | Steam Desktop Authenticator (or similar) |
| `BPTF_API_KEY` + `BPTF_ACCESS_TOKEN` | [backpack.tf/connections](https://backpack.tf/connections) |
| pricedb.io account | [pricedb.io](https://pricedb.io) |

Steam Mobile Authenticator must be enabled **15+ days** for unrestricted trading.

## Setup checklist

- [ ] Install Node.js **22+**
- [ ] Clone and build the [bot](Installing-the-Bot) (`v1.0.11` or latest)
- [ ] Create `.env` ([Configuring the Bot](Configuring-the-Bot)) — never commit it
- [ ] Create `files/<steam_username>/options.json` ([options.json](Configure-your-options.json-file))
- [ ] Set `IPC=true` in the bot `.env`
- [ ] Start the bot
- [ ] Clone and start the [GUI Panel](GUI-Panel) (**v3.6.2+**)
- [ ] Open `http://localhost:3000` and manage the bot

## Recommended first-run settings

### IPC

```bash
IPC=true
```

### Disable public Steam chat (strongly recommended)

```json
"globalDisable": {
  "messages": true,
  "greeting": true,
  "commands": false,
  "adminCommands": false
}
```

Prefer Discord + panel for admin work.

### Autokeys (optional)

Configure under `autokeys` in `options.json` if you bank keys automatically.

## What to learn next

1. [Partial Autoprice](Partial-Autoprice) — live buy *or* sell  
2. [Cost Basis & FIFO](Cost-Basis-and-FIFO) — `!get` history, `!setcost`  
3. [Features Overview](Features) — full fork feature map  
4. [Updating](Updating) — stay on latest releases  

## Pure Hive?

Not in this blank bot. See [Pure Hive](Pure-Hive) for the separate fork + API.
