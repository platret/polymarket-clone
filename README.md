# Polymarket Clone — Sports

A Polymarket-style prediction market for real sports games, played with **fake money**.
Looks and feels like the real thing: cents-priced YES/NO shares, prices that move as
volume comes in, live price charts, a portfolio with P&L — plus a built-in **admin
god-mode** where you can force any result and watch the payouts land.

> Not affiliated with Polymarket. For fun and learning only.

![stack](https://img.shields.io/badge/React-18-149eca) ![vite](https://img.shields.io/badge/Vite-6-646cff) ![ts](https://img.shields.io/badge/TypeScript-5-3178c6) ![tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8)

## Features

- **Real games, real teams** — schedules, logos, colors, live scores and final results
  pulled from ESPN's free, no-key API (NFL, NBA, MLB, NHL, EPL, NCAA, UCL, La Liga…).
  Falls back to a bundled sample slate when offline so it always runs.
- **Polymarket-style trading** — outcomes priced in cents (0–100¢ = implied probability).
  Buy YES/NO shares through an **LMSR market maker**, so your trades actually move the
  price. Winning shares redeem for $1.00.
- **Fake money** — start with $10,000. An "Add funds" button tops up any amount.
- **It feels alive** — simulated bot traders nudge prices around fair value, generating
  volume and a wiggling price history. Live games drift toward whoever's winning.
- **Live price charts** + sparklines, portfolio P&L, and a global activity feed.
- **Admin god-mode** (`/admin`) — force-resolve any market (YES/NO) and instantly redeem
  your winning shares, set a price by hand, inject volume, toggle the bots, tune
  liquidity, pick leagues, add funds, and reset everything.
- **Auto-resolution** — when ESPN reports a game final, the market settles to the real
  winner and pays you out automatically.
- Everything persists to `localStorage`, so a refresh keeps your money and bets.

## Run it

```bash
npm install
npm run dev
# open http://localhost:5173
```

Build for production:

```bash
npm run build && npm run preview
```

## How it works

```
src/
  lib/
    espn.ts          # fetch + normalize ESPN scoreboards -> Market[]
    marketEngine.ts  # LMSR maths: price, cost, buy/sell, seeding from odds
    sampleData.ts    # offline fallback slate
    format.ts        # money / cents / time formatting
  store/
    useStore.ts      # zustand store: trading, resolution, bots, admin (persisted)
    selectors.ts     # derived P&L / portfolio read-models
    useSimulation.ts # bot heartbeat + ESPN polling
    useUI.ts         # toasts + modals
  components/        # NavBar, MarketCard, TradePanel, PriceChart, AdminMarketRow, …
  pages/             # Home, Market, Portfolio, Activity, Admin
```

### The market maker (LMSR)

Each binary market is a Logarithmic Market Scoring Rule maker. The YES price is a
softmax over outstanding YES/NO share quantities, always lands in (0, 1), and rises when
YES is bought. Opening prices are seeded from the **real sportsbook moneyline** embedded
in ESPN's feed (de-vigged), so day-one prices are honest. The liquidity parameter `b`
controls depth — higher `b` means smaller price impact per trade.

### Resolution

- **Automatic:** ESPN is polled every 30s; a game going final settles the market to the
  real winner and redeems your winning shares at $1.00.
- **Manual (admin):** force YES or NO from `/admin` and watch your balance jump.

## Data source

ESPN's unofficial scoreboard API: `https://site.api.espn.com/apis/site/v2/sports/{league}/scoreboard`.
Free, no key, CORS-enabled — so the whole app is a static SPA with no backend.

## License

MIT
