# Panel IPC

How [tf2autobot-gui-panel](https://github.com/uwu6967/tf2autobot-gui-panel) talks to this bot.

## Enable

Bot `.env`:

```bash
IPC=true
```

Start the **bot first**, then the panel. Both must run continuously.

## What IPC carries

Typical handlers:

| Event | Purpose |
|---|---|
| `getInfo` | Bot identity / status |
| `getPricelist` | Full pricelist |
| `getTrades` | Trade history / active |
| `getInventory` | Inventory (Unlisted Stock) |
| `getOptions` / `updateOptions` | `options.json` |
| `addItem` / `updateItem` / `removeItem` | Pricelist edits |
| `sendChat` | Forward admin chat |

## Fork behaviours you should know

### Readable errors

`addItem` / `updateItem` / `removeItem` emit **string** error messages (not opaque Error objects) so the panel can show why a list failed.

### Boot-safe

While the bot is still starting (pricelist not ready):

- Mutations return a clear *“Bot is still starting…”* style message  
- `getPricelist` may return `false` until ready — the panel should retry  

### Partial autoprice

Panel v3.6.2+ sends partial autoprice in a form this bot understands (`autoprice` + partial flags). See [Partial Autoprice](Partial-Autoprice).

### Asset ids

Unique items can be listed with backpack **asset id** as the price key. Autoprice refresh looks up prices by the entry’s **SKU**.

## Troubleshooting

| Symptom | Check |
|---|---|
| Panel: “no bot found” | Bot running? `IPC=true`? Restart panel after switching Steam accounts |
| Errors look empty | Bot ≥ v1.0.5 for string IPC errors |
| Pricelist empty at boot | Wait / refresh — boot-safe IPC |
| Unlisted Stock broken | Bot with `getInventory` IPC (this fork includes it) |

## Related

- [GUI Panel](GUI-Panel)  
- [Getting Started](Getting-Started)
