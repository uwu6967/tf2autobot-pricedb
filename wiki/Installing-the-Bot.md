# Installing the Bot

## Requirements

- **Node.js 22+** ([download](https://nodejs.org/))
- **npm** (included with Node.js)
- Git

Optional for production:

- [PM2](https://pm2.keymetrics.io/) process manager
- Docker (a `Dockerfile` is included in the repo)

## 1. Clone the repository

```bash
git clone https://github.com/gfghdg2233/tf2autobot-pricedb.git
cd tf2autobot-pricedb
```

## 2. Install dependencies

```bash
npm install
```

## 3. Build

```bash
npm run build
```

This compiles TypeScript from `src/` into `dist/`.

## 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials. See [Configuring the Bot](Configuring-the-Bot) for every variable.

**Never commit your `.env` file.** It is gitignored by default.

## 5. Configure options.json

Create a per-account data directory using your Steam login name:

```bash
mkdir -p files/<your_steam_username>
cp .example/options.json files/<your_steam_username>/options.json
```

Edit `options.json` to match your trading strategy. See [options.json Reference](Configure-your-options.json-file).

## 6. Enable IPC

The GUI panel requires IPC. In `.env`:

```bash
IPC=true
```

## 7. Run

### Development / testing

```bash
node dist/app.js
```

### Production with PM2

Copy and edit the ecosystem template:

```bash
cp template.ecosystem.json ecosystem.config.json
```

Fill in your credentials in `ecosystem.config.json`, then:

```bash
pm2 start ecosystem.config.json
pm2 save
```

> **Note:** `ecosystem.config.json` is gitignored. Never commit it with real credentials.

### Docker

Build the image:

```bash
docker build -t tf2autobot .
```

Run with your `.env` mounted:

```bash
docker run -d \
  --env-file .env \
  -v $(pwd)/files:/app/files \
  --name tf2autobot \
  tf2autobot
```

Do not bake secrets into the Docker image.

## 8. Start the GUI panel

With the bot running, set up the panel:

→ [GUI Panel](GUI-Panel)

## Project layout

```
tf2autobot-pricedb/
├── src/                  # TypeScript source
├── dist/                 # Compiled output (after npm run build)
├── .example/             # Example options.json
├── files/                # Per-account runtime data (gitignored)
│   └── <steam_username>/
│       ├── options.json
│       ├── pricelist.json
│       ├── polldata.json
│       └── ...
├── .env                  # Your secrets (gitignored)
├── .env.example          # Template
└── template.ecosystem.json
```

## Updating

```bash
git pull
npm install
npm run build
```

Restart the bot after updating. Check the release notes — new versions may require `options.json` changes.

## npm scripts

| Command | Description |
|---|---|
| `npm run build` | Compile TypeScript |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |
