# Pure Hive — share keys & refined between fork bots

Opt-in network for bots running [uwu6967/tf2autobot-pricedb](https://github.com/uwu6967/tf2autobot-pricedb). Linked bots can move **Mann Co. Supply Crate Keys** and **refined metal** between each other (automatic rebalance + manual push).

## Safety

- **Off by default** (`hive.enable=false`).
- Pure only moves after a **mutual link** (invite + accept).
- Unlinked bots never auto-accept hive offers.
- Caps: `maxKeysPerTransfer`, `maxRefinedPerTransfer`, `cooldownSeconds`.

This does **not** replace Autokeys (market banking). Hive is peer-to-peer pure between your linked bots.

## 1. Run the Hive API

Companion API: [uwu6967/tf2autobot-pure-hive](https://github.com/uwu6967/tf2autobot-pure-hive).

```bash
git clone https://github.com/uwu6967/tf2autobot-pure-hive.git ../hive-api
cd ../hive-api
cp template.env .env
# set HIVE_ADMIN_SECRET
npm install
npm start
```

Create a token per bot:

```bash
npm run token -- "bot-label"
# → hive_....
```

## 2. Configure each bot

`.env`:

```bash
HIVE_TOKEN=hive_....
HIVE_API_URL=http://127.0.0.1:3950
```

`options.json` (or `!config`):

```json
"hive": {
  "enable": true,
  "apiUrl": "http://127.0.0.1:3950",
  "autoRebalance": true,
  "useAutokeysBands": true,
  "minKeys": 100,
  "maxKeys": 500,
  "minRefined": 100,
  "maxRefined": 200,
  "maxKeysPerTransfer": 10,
  "maxRefinedPerTransfer": 50,
  "cooldownSeconds": 900
}
```

When `useAutokeysBands` is `true`, heartbeat bands follow your Autokeys min/max keys & refined.

## 3. Link two bots

On bot A (admin):

```text
!hive link <botB_steamid64>
```

On bot B:

```text
!hive accept <botA_steamid64>
```

Bots should be Steam friends (the sender will try to add the partner).

## 4. Commands

| Command | Meaning |
|---------|---------|
| `!hive` / `!hive status` | Status, links, jobs |
| `!hive enable` / `disable` | Toggle |
| `!hive bots` | Opt-in directory |
| `!hive link <steamid64>` | Invite |
| `!hive accept <steamid64>` | Accept invite |
| `!hive unlink <steamid64>` | Unlink |
| `!hive push keys=N&ref=N&to=<steamid64>` | Manual send |

Discord: `/hive` with the same actions (admin-only).

## Auto rebalance

On each heartbeat (~1 min), the Hive API looks at linked pairs. If one bot is above `maxKeys`/`maxRefined` and the other below mins, it creates a transfer job (keys first, then ref), capped and cooldown-limited. The surplus bot sends a Steam offer; the needy bot auto-accepts if the offer is pure-only and matches the job.
