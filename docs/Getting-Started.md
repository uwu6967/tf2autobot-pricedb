# Getting Started

This guide walks you through a full first-time setup: bot + GUI panel.

## Overview

```
┌─────────────┐     IPC      ┌──────────────┐     Steam     ┌────────┐
│  GUI Panel  │ ◄──────────► │  TF2Autobot  │ ◄───────────► │  TF2   │
│  (browser)  │              │    (bot)     │               │ / BPTF │
└─────────────┘              └──────────────┘               └────────┘
```

1. The **bot** logs into Steam, handles trades, and manages backpack.tf listings.
2. The **GUI panel** connects over IPC so you can manage the pricelist, settings, and trades from your browser.
3. You manage both from your machine or VPS.

## Before you begin

Gather these credentials:

| Credential | Where to get it |
|---|---|
| Steam login + password | Your Steam account |
| `STEAM_SHARED_SECRET` + `STEAM_IDENTITY_SECRET` | [Steam Desktop Authenticator](https://github.com/Jessecar96/SteamDesktopAuthenticator) or similar |
| `BPTF_API_KEY` + `BPTF_ACCESS_TOKEN` | [backpack.tf developer](https://backpack.tf/connections) |
| pricedb.io account | [pricedb.io](https://pricedb.io) |

Your Steam account **must** have the Mobile Authenticator enabled for at least 15 days before unrestricted trading.

## Setup checklist

- [ ] Install Node.js 22+
- [ ] Clone and build the [bot](Installing-the-Bot)
- [ ] Create `.env` with your credentials ([Configuring the Bot](Configuring-the-Bot))
- [ ] Create `files/<steam_username>/options.json` ([options.json Reference](Configure-your-options.json-file))
- [ ] Set `IPC=true` in the bot `.env`
- [ ] Start the bot
- [ ] Clone and start the [GUI Panel](GUI-Panel)
- [ ] Connect to your bot in the panel at `http://localhost:3000`

## Recommended first-run settings

### Enable IPC

In the bot `.env`:

```bash
IPC=true
```

### Disable Steam chat (strongly recommended)

Valve has been banning bots that send chat messages. In `options.json`:

```json
"globalDisable": {
    "messages": true,
    "greeting": true,
    "commands": false,
    "adminCommands": false
}
```

You can manage the bot through the GUI panel and Discord instead.

### Set your Steam ID as admin

In `.env`:

```bash
ADMINS=[{ "steam": "76561198000000000", "discord": null }]
```

Replace with your SteamID64. [Find your SteamID](https://steamid.io/).

## Next steps

- [Installing the Bot](Installing-the-Bot) — detailed install instructions
- [GUI Panel](GUI-Panel) — panel setup and connection
- [options.json Reference](Configure-your-options.json-file) — tune trading behaviour
