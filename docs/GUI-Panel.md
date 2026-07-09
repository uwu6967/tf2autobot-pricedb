# GUI Panel

The bot is designed to run with the companion web panel:

**[github.com/uwu6967/tf2autobot-gui-panel](https://github.com/uwu6967/tf2autobot-gui-panel)**

The panel provides a browser UI for pricelist management, trade review, settings editing, profit tracking, and more. It connects to your running bot over IPC.

## Architecture

```
You (browser)  →  GUI Panel (port 3000)  →  IPC  →  Bot  →  Steam / backpack.tf
```

The panel **does not** log into Steam or process trades. All Steam interaction happens in the bot process.

## Requirements

| Requirement | Notes |
|---|---|
| Node.js 18+ (22 recommended) | Separate from the bot install |
| Bot running with `IPC=true` | Required in the bot `.env` |
| Steam Web API key | Only if `STEAM_AUTH=true` in panel `.env` |

## Installation

```bash
git clone https://github.com/uwu6967/tf2autobot-gui-panel.git
cd tf2autobot-gui-panel
npm install
cp template.env .env
npm run build
npm start
```

Open **http://localhost:3000** (or the port set in panel `.env`).

On Windows, you can use `start.bat` after building. On Linux, use `./start.sh`.

## Connecting to your bot

1. Start the **bot** first with `IPC=true` in its `.env`
2. Start the **panel**
3. Open the panel in your browser
4. Select or connect to your bot instance

If only one bot is running locally, the panel may auto-select it.

## Panel features

- Pricelist search, filter, grid/list views, bulk add, autoprice
- Live backpack.tf reference prices from pricedb.io
- Completed and active trade browser
- Edit bot `options.json` from the browser (webhooks, misc settings, etc.)
- Profit tracking and reporting
- Mann Co. themed UI with theme selector
- Multi-bot support — pick which connected bot to manage
- Optional Steam OpenID admin login

## Panel environment variables

Copy `template.env` to `.env` in the panel directory:

| Variable | Default | Description |
|---|---|---|
| `API_KEY` | *(empty)* | Steam Web API key (needed for Steam login) |
| `STEAM_AUTH` | `true` | Require Steam login to use the panel |
| `PORT` | `3000` | HTTP port |
| `SSL` | `false` | Enable HTTPS |
| `PORT_HTTPS` | `443` | HTTPS port when `SSL=true` |
| `SESSION_SECRET` | *(empty)* | Random string for express sessions |
| `VPS` | `false` | Set `true` on a public server |
| `ADDRESS` | `localhost` | Public hostname/IP when `VPS=true` |

Bot Steam credentials (`STEAM_PASSWORD`, shared secrets, etc.) belong in the **bot's** `.env`, not the panel's.

## VPS / remote access

For a public server:

1. Set `VPS=true` and `ADDRESS=your.domain.com` in the panel `.env`
2. Enable `SSL=true` with valid certificates, or put the panel behind a reverse proxy (nginx, Caddy)
3. Only list your SteamID as a bot admin in the bot `.env` `ADMINS` field when `STEAM_AUTH=true`

See the [panel TUTORIAL.md](https://github.com/uwu6967/tf2autobot-gui-panel/blob/main/TUTORIAL.md) for a full walkthrough.

## Troubleshooting

### Panel can't connect to bot

- Confirm the bot is running
- Confirm `IPC=true` in the bot `.env`
- Restart the bot after changing `.env`
- Check bot logs for IPC connection messages

### Bot not appearing in panel

- Only one bot per machine registers over IPC by default
- Make sure the bot finished starting (wait for "Bot is ready" or similar in logs)

### Port already in use

Change `PORT` in the panel `.env` to another port (e.g. `3001`).

## Further reading

- [Panel README](https://github.com/uwu6967/tf2autobot-gui-panel)
- [Panel TUTORIAL.md](https://github.com/uwu6967/tf2autobot-gui-panel/blob/main/TUTORIAL.md)
- [Getting Started](Getting-Started)
