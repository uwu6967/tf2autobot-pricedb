# Mannco.store

Optional integration for [Mannco.store](https://mannco.store/) deposits, listings, buy orders, and withdrawals.

## Enable

1. Create an API key in your Mannco account  
2. Set in process env / ecosystem (see `template.ecosystem.json`):

```bash
MANNCO_STORE_API_KEY=your_key_here
```

3. In `options.json`:

```json
"miscSettings": {
  "manncoStore": {
    "enable": true
  }
}
```

Mannco prices use **USD cents** on the pricelist (`buyUsd` / `sellUsd`). Example: `76` = `$0.76`.

- `sellUsd` required to deposit/list  
- `buyUsd` required for buy orders  

Deposits/withdrawals are matched to Steam trades and accepted automatically when recognized.

## Admin commands

All require admin + admin commands enabled. Use `&` between params. Multiple asset ids: comma or semicolon.

| Command | Description |
|---|---|
| `!mcosell sku=<sku>&amount=<n>&confirm=true` | Deposit & list (amount default 1) |
| `!mcosell assetid=<id>[,<id>]&confirm=true` | Deposit specific assets |
| `!mcolistings` | Current Mannco sale listings |
| `!mcoupdate assetid=<id>&price=<cents>&confirm=true` | Change listing price |
| `!mcowithdraw assetid=<id>[,<id>]` | Withdraw to Steam |
| `!mcostatus` | Reconcile deposits / withdrawals |
| `!mcoresend tradeid=<mannco trade id>` | Ask Mannco to resend a trade |
| `!mcobuy sku=<sku>&quantity=<n>` | Create/update buy order |
| `!mcobuyorders [page=<n>]` | List buy orders (page from 0) |
| `!mcobuyremove itemid=<id>` | Remove buy order |
| `!mcobalance` | Show Mannco balance |
| `!mcosales` | Last week sales summary |

`!mcosell` and `!mcoupdate` require `confirm=true` because a matching buy order can sell immediately.

## Related

- [Configuring the Bot](Configuring-the-Bot)  
- [Features Overview](Features)  
- Mannco API docs: https://docs.mannco.store/
