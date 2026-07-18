# Common Errors

Solutions for the most frequent setup and runtime problems.

## Installation

### `npm install` fails

- Confirm Node.js 22+ is installed: `node --version`
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- On Windows, run the terminal as Administrator if you get permission errors

### `npm run build` fails

- Make sure `npm install` completed without errors
- Check for TypeScript errors in the output
- Ensure you have enough disk space

## Steam login

### `InvalidPassword` / login failed

- Double-check `STEAM_ACCOUNT_NAME` and `STEAM_PASSWORD` in `.env`
- Make sure there are no extra spaces or quotes around values
- If you recently changed your password, update `.env`

### Steam Guard code wrong

- Verify `STEAM_SHARED_SECRET` is correct
- Regenerate secrets from your authenticator app if needed
- Make sure your system clock is accurate (TOTP codes are time-sensitive)

### `LoggedInElsewhere` / session conflict

- Close Steam on other machines
- Wait a few minutes and restart the bot
- The bot's auto-reconnect will retry

### Trade confirmations failing

- Verify `STEAM_IDENTITY_SECRET` is correct
- Confirm Mobile Authenticator is active on the account

## backpack.tf

### `Invalid API key` / BPTF errors

- Regenerate your key at [backpack.tf/connections](https://backpack.tf/connections)
- Update both `BPTF_API_KEY` and `BPTF_ACCESS_TOKEN` in `.env`
- Restart the bot

### Listings not creating

- Confirm `miscSettings.createListings.enable` is `true` in `options.json`
- Check the bot is not halted (`!unhalt` or disable `startHalted`)
- Verify your backpack.tf account is in good standing
- Check logs for rate limit errors

## GUI Panel

### Panel can't connect to bot

1. Bot must be running
2. `IPC=true` in the bot `.env`
3. Restart the bot after changing `.env`
4. Check bot logs for IPC errors

### Bot not listed in panel

- Wait for the bot to fully start
- Only one local bot registers by default — check you're not running duplicates

### Port 3000 already in use

Change `PORT` in the panel `.env` to another port.

## Pricer

### Prices not updating

- Confirm `ENABLE_SOCKET=true` in `.env`
- Check your internet connection
- pricedb.io socket may be temporarily down — check [pricedb.io](https://pricedb.io)

### Custom pricer not working

- Set both `CUSTOM_PRICER_URL` and `CUSTOM_PRICER_API_TOKEN`
- Confirm the custom pricer server is reachable

## options.json

### Bot won't start — options error

- Validate JSON syntax (trailing commas are invalid)
- Compare against [`.example/options.json`](https://github.com/uwu6967/tf2autobot-pricedb/blob/master/.example/options.json)
- Use the GUI panel editor for safer changes

### Changes not applying

- Restart the bot after editing `options.json` directly
- Or apply changes through the GUI panel

## Trades

### Bot declining all offers

- Check `trade` section in `options.json` for strict rules
- Verify items are in the pricelist with correct buy/sell prices
- Check if the user is on the ban list

### Escrow / trade hold

- The other user needs Steam Guard Mobile Authenticator
- The bot will decline escrow trades by default

## Logs

Log files are saved when `ENABLE_SAVE_LOG_FILE=true` (default). Check the `logs/` directory for detailed error output.

Enable verbose logging:

```bash
DEBUG=true
DEBUG_FILE=true
```

## Still stuck?

1. Search [existing issues](https://github.com/uwu6967/tf2autobot-pricedb/issues)
2. Open a new issue with your error message and relevant log lines (redact secrets)
3. For panel issues, use the [panel issue tracker](https://github.com/uwu6967/tf2autobot-gui-panel/issues)
