# Security policy

## This is a read-only research tool — keep it that way

market-terminal is strictly **read-only**: market monitoring, research,
charting, screening, alerts (notify-only), watchlists and learning. It has
**no trade execution, no order routing, no broker integrations, no order
ticket, and no simulation of any of those**. This is a deliberate,
non-negotiable design constraint (see CLAUDE.md), not a missing feature.

Accordingly:

- **Never give this app broker credentials, exchange API keys with trading
  scopes, or any key that can move money or place orders.** The only keys it
  is designed to hold are free, read-only *market-data* keys (Finnhub,
  marketaux, FRED, Alpha Vantage).
- If a data provider offers scoped keys, use the most restrictive read-only
  scope available.
- Pull requests or forks that add execution capability are out of scope for
  this project and will not be accepted upstream.

## Where secrets live

- API keys are stored **only** in the local, git-ignored `.env` file
  (`MKT_KEY_*` variables) and/or the local SQLite database
  (`data/terminal.db`, also git-ignored) when entered via the in-app
  Settings page. Both stay on your machine.
- Keys are sent only to the corresponding provider's official API endpoint,
  never anywhere else. Request budgeting keeps usage inside free-tier
  limits (see `server/budget.ts` and docs/DATA_PROVIDERS.md).
- `.env.example` must only ever contain empty placeholders. Never commit a
  real value to it.
- The server binds to localhost and has no authentication — do not expose
  port 4780 to a network you don't trust.

## Reporting a vulnerability

This is a personal/educational project. If you find a security issue, open
a GitHub issue describing the problem (without posting working secrets or
exploits), or contact the repository owner through their GitHub profile.
