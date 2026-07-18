# FAQ

## General

### What is this project?

A fork of [TF2Autobot](https://github.com/TF2Autobot/tf2autobot) that uses [pricedb.io](https://pricedb.io) for pricing and is designed to run with the [GUI Panel](https://github.com/uwu6967/tf2autobot-gui-panel).

### Do I need the GUI panel?

Yes — for the intended setup. The panel is how you manage your pricelist, review trades, edit settings, and track profit. The bot runs headless and handles Steam in the background.

### Can I run the bot without the panel?

Technically yes (disable `IPC` and use Steam commands / Discord), but the panel is the recommended workflow for this fork.

### Is this the same as the original TF2Autobot?

Same core trading engine, but with pricedb.io integration, store mirroring, Journal.tf, ECP, improved PPU, and other changes. See [Credits](Credits).

## Setup

### What Node.js version do I need?

**22+** for the bot. The panel supports 18+ but 22 is recommended.

### Where do I put my Steam password?

In the bot's `.env` file only. Never commit it. The panel does not need your Steam password.

### Where is options.json?

```
files/<your_steam_username>/options.json
```

Created on first run or by copying `.example/options.json`.

### How do I find my SteamID64?

Use [steamid.io](https://steamid.io/) or the panel's admin login.

## Trading

### How does pricing work?

The bot connects to pricedb.io via socket for live prices. Your `pricelist.json` defines which items you buy/sell and at what margins.

### What is PPU (Partial Price Update)?

When you buy an item, PPU queues that buy price. If the market dips, your sell listing won't drop below the queued buy price until the threshold expires. This prevents selling at a loss during temporary dips.

### What is ECP (Easy Copy Paste)?

A feature that replaces item names in listing notes with easy-to-copy trade commands like `buy_Burning_Team_Captain`. Enable with `miscSettings.ecp` and use `%ecp_item%` in listing notes.

### Should I disable Steam chat?

**Yes.** Valve has been banning bots that send chat messages. Set `globalDisable.messages` and `globalDisable.greeting` to `true`. Use the panel and Discord instead.

## PriceDB Store

### What is the pricedb.io store?

A personal storefront on crit.tf where buyers can see your sell listings. This fork can auto-mirror backpack.tf sell listings to your store.

### Do buy listings get mirrored?

No — only sell listings.

## Panel

### Can I access the panel remotely?

Yes. Deploy both bot and panel on a VPS. See the [panel TUTORIAL.md](https://github.com/uwu6967/tf2autobot-gui-panel/blob/main/TUTORIAL.md) for VPS/SSL setup.

### Does the panel need my Steam secrets?

No. Only the bot needs Steam credentials. The panel optionally uses Steam OpenID for admin authentication.

## Updating

### How do I update the bot?

```bash
git pull
npm install
npm run build
```

Restart the bot. Check release notes for `options.json` changes.

### Will updating wipe my pricelist?

No. Your data lives in `files/<username>/` which is separate from the source code.

## Safety

### Is it safe to run a trading bot?

Trading bots carry risk — account bans, bad trades, API outages. Use at your own discretion. Keep secrets out of git, use strong admin restrictions on the panel, and run behind HTTPS on public servers.

### What files should never be committed?

- `.env`
- `ecosystem.config.json`
- `files/` directory
- `logs/`

All are gitignored by default.
