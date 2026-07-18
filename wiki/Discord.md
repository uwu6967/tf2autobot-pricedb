# Discord

Optional Discord bot for alerts and admin commands.

## Setup

1. Create a Discord application + bot at [Discord Developer Portal](https://discord.com/developers/applications)  
2. Invite the bot to your server with slash-command permissions  
3. In bot `.env`:

```bash
DISCORD_BOT_TOKEN=your_token_here
```

4. Put your Discord user id next to your Steam id in `ADMINS` when you want Discord admin routing:

```bash
ADMINS=[{ "steam": "7656119…", "discord": "123456789012345678" }]
```

Restart the bot after changing the token.

## What you get

| Feature | Notes |
|---|---|
| Trade / review webhooks | Via `options.json` Discord webhook settings |
| **Version update** notices | When a newer GitHub release exists |
| **Autokeys** controls | View / tweak from Discord |
| **Unhalt** | Useful at startup without Steam chat |
| Slash commands | `/add`, `/update`, `/remove`, `/get`, `/setcost`, `/autokeys`, `/hive` (Hive fork only), … |
| Multi-embed replies | e.g. `/get` entry + purchase history |

Admin-only slash commands refuse non-admins.

## Useful slash commands

| Command | Purpose |
|---|---|
| `/get` | Pricelist entry + FIFO history |
| `/setcost` | Manual FIFO lots ([guide](Cost-Basis-and-FIFO)) |
| `/add` `/update` `/remove` | Pricelist edits |
| `/autokeys` | Autokeys status / options |
| `/refreshlist` | Refresh backpack.tf listings |
| `/updaterepo` | Update from git (PM2 setups) |

Exact command list matches Steam admin commands where wired.

## Steam chat vs Discord

Valve has banned bots for chat spam. Prefer:

```json
"globalDisable": {
  "messages": true,
  "greeting": true,
  "commands": false,
  "adminCommands": false
}
```

Use Discord / the GUI panel for day-to-day admin work.

## Related

- [Cost Basis & FIFO](Cost-Basis-and-FIFO)  
- [Updating](Updating)  
- [Configuring the Bot](Configuring-the-Bot)
