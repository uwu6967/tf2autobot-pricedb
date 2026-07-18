# GUI Panel

Companion UI: **[uwu6967/tf2autobot-gui-panel](https://github.com/uwu6967/tf2autobot-gui-panel)**

**Tested with:** bot **v1.0.12** + panel **v3.6.2**

## Install

```bash
git clone https://github.com/uwu6967/tf2autobot-gui-panel.git
cd tf2autobot-gui-panel
git checkout v3.6.2   # or latest release
npm install
cp template.env .env
npm run build
npm start
```

Open **http://localhost:3000**. Full walkthrough: panel [TUTORIAL.md](https://github.com/uwu6967/tf2autobot-gui-panel/blob/main/TUTORIAL.md).

## Bot side

```bash
IPC=true
```

Start the **bot before** the panel.

## Panel features (v3.6.x)

| Feature | Notes |
|---|---|
| Pricelist grid / list | Search, filter, bulk add |
| **Partial autoprice** toggles | Sell-only / buy-only (v3.6.2) |
| Unlisted Stock | List backpack items not on the pricelist |
| Listing queue | Failed unlisted items waiting retry |
| Trades / profit / settings | Review and edit bot options |
| Themes | Multiple color palettes |
| Self-update | Panel can pull its own GitHub releases |

## IPC details

See [Panel IPC](Panel-IPC) for error strings, boot-safe behaviour, and asset-id listing.

## Multi-bot

If several bots connect, pick the correct SteamID in the panel. After switching accounts, **restart the panel** (or hard-refresh) so sessions aren’t stuck on an old id.

## Related

- [Getting Started](Getting-Started)  
- [Partial Autoprice](Partial-Autoprice)  
- [Updating](Updating)
