# Orderly DEX Template

A white-label perpetual futures DEX frontend built on the [Orderly Network](https://orderly.network) SDK. Fork this repo, edit `.env`, and deploy your own branded trading UI.

## Quick Start

1. Fork this repo
2. Edit `.env` — every variable is self-documented with inline comments
3. Install and run:

```sh
yarn install
yarn dev        # http://localhost:5173
```

## Configuration

**All configuration lives in `.env`.** Open it — every variable has comments explaining what it does, valid values, and defaults. There's no separate config file to hunt for.

For local-only overrides that you don't want to commit, copy `.env.example` to `.env.local` (gitignored) — Vite loads it on top of `.env`.

Key things to set:

| Variable | Purpose |
|----------|---------|
| `VITE_ORDERLY_BROKER_ID` | Your Orderly broker ID (use `"demo"` for sandbox) |
| `VITE_ORDERLY_BROKER_NAME` | Display name shown throughout the UI |
| `VITE_APP_NAME` | Browser tab title and PWA name |
| `VITE_WALLETCONNECT_PROJECT_ID` | Get one at [cloud.walletconnect.com](https://cloud.walletconnect.com) |
| `VITE_DEPLOYMENT_ENV` | `mainnet` (default) or `testnet` — pins the app to one network and skips the mainnet/testnet toggle |

### Theme

Colors are CSS custom properties in `app/styles/theme.css`. Edit directly or use the [Storybook theme editor](https://storybook.orderly.network/?path=/story/package-trading-tradingpage--page) to generate values.

### Logos

Place your logos in `public/`:
- `logo.webp` — primary logo (desktop nav)
- `logo-secondary.webp` — secondary logo (mobile nav)

Then enable them in `.env`:
```
VITE_HAS_PRIMARY_LOGO=true
VITE_HAS_SECONDARY_LOGO=true
```

### Navigation

Control which pages appear with `VITE_ENABLED_MENUS` and add external links with `VITE_CUSTOM_MENUS`. See `.env` for full details.

## Dedoo Copilot

This fork adds a docked **Dedoo Copilot** panel (`app/components/DedooCopilot.tsx`) on every page. It embeds the assistant app at `https://assistant.dedoo.xyz/app` and automatically passes:

- the connected Orderly wallet address,
- the current `/perp/:symbol` market,
- the broker ID from `VITE_ORDERLY_BROKER_ID`.

The assistant is deterministic: ATR/realized-volatility expected move, TP/SL percentage and equivalent prices, position size, fees, funding, liquidation distance and risk flags. Volume is a first-class context layer: RVOL, z-score/percentile, VWAP, volume profile POC/VAH/VAL, breakout/failed breakout, climax/absorption, volume divergence and H4 conflict. AI is optional qualitative commentary only; it never supplies a number, level or trade decision. The panel is position-aware and stays docked so it does not cover the trade ticket.

Configure it in `.env` or `public/config.js`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_COPILOT_ENABLED` | `true` | Hide the launcher with `false` |
| `VITE_COPILOT_NAME` | `Dedoo Copilot` | Product name shown in the UI |
| `VITE_COPILOT_URL` | `https://assistant.dedoo.xyz` | Assistant service base URL |

## Build & Deploy

### GitHub Pages (default)

This repo includes a GitHub Actions workflow that auto-deploys on every push to `main` or `master`.

**One-time setup after forking** (run from your local clone):

```sh
REPO="OWNER/REPO"   # e.g. "myuser/my-dex"

# Enable GitHub Actions
gh api repos/$REPO/actions/permissions -X PUT -f enabled=true -f allowed_actions=all

# Grant workflows write permissions
gh api repos/$REPO/actions/permissions/workflow -X PUT \
  -f default_workflow_permissions=write \
  -F can_approve_pull_request_reviews=true

# Enable GitHub Pages with Actions as deployment source
gh api repos/$REPO/pages -X POST -f build_type=workflow
```

If you don't have `gh` CLI available, see [AGENTS.md](./AGENTS.md) for Composio tool equivalents.

That's it. Push to main and it deploys to:

```
https://<github-username>.github.io/<repo-name>/
```

**Custom domain:** Create a `CNAME` file in the repo root with your domain, then set `VITE_BASE_URL=` (empty) in `.env`.

### Manual / other hosting

```sh
yarn build:spa      # outputs to build/client/
```

For subdirectory deployments, set `VITE_BASE_URL=/repo-name/` in `.env` before building. Serve `build/client/` with any static host, SPA fallback to `index.html`.

## Runtime Config (No Rebuild)

You can override any `.env` value at runtime by creating `public/config.js`:

```js
window.__RUNTIME_CONFIG__ = {
  VITE_ORDERLY_BROKER_ID: "your_broker_id",
  VITE_ORDERLY_BROKER_NAME: "Your Brand",
};
```

## Resources

- [Orderly Network Docs](https://orderly.network/docs/sdks)
- [Orderly JS SDK](https://github.com/OrderlyNetwork/js-sdk)
- [Storybook Theme Editor](https://storybook.orderly.network/?path=/story/package-trading-tradingpage--page)
