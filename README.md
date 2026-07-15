# market-terminal

A local, Bloomberg-style market terminal for Windows — market monitoring,
research, charting, screening, fundamentals, alerts, watchlists, and a
finance-student learning mode. Runs entirely on your machine as a local
browser app, driven from a keyboard-first command bar.

> **Strictly read-only.** No trade execution, no order routing, no broker
> integrations, no order ticket, no hidden simulation. Research, analytics,
> alerts, watchlists and learning only. Not affiliated with Bloomberg L.P.;
> no Bloomberg data is used.

## Quick start (PowerShell)

```powershell
.\setup.ps1        # one-time: verifies Node >= 24, installs dependencies
.\run.ps1          # dev mode: API (:4780) + Vite UI (:5173), opens browser
.\run.ps1 -Prod    # prod mode: build once, serve everything from :4780
.\stop.ps1         # stop everything (by port)
```

**If PowerShell says "running scripts is disabled on this system"**, use the
`.cmd` wrappers instead — they work regardless of the execution policy:

```powershell
.\setup.cmd
.\run.cmd          # or .\run.cmd -Prod
.\stop.cmd
```

(Alternatively, allow local scripts once with
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` — a per-user setting,
no admin needed — then the `.ps1` commands work directly.)

Requires [Node.js 24+](https://nodejs.org) (this project is built on Node's
built-in `node:sqlite` and native TypeScript execution — **no other runtime
dependencies**). The app is fully usable with **zero API keys**: it ships a
clearly-labeled demo data provider and one keyless live source (Yahoo).

## Command language

The command bar (press `/` or just start typing) reads **`SYMBOL FUNCTION`**,
Bloomberg-style — e.g. `AAPL GP` charts Apple. Plain-English search also
works (`economic calendar` finds ECO; `apple` finds the AAPL symbol).

| Mnemonic | Function | Example |
|---|---|---|
| `MON` | Global markets monitor | `MON` |
| `Q` | Security quote | `AAPL Q` |
| `GP` | Price chart | `AAPL GP` |
| `N` | News (market-wide or per-symbol) | `TSLA N` |
| `ECO` | Economic calendar | `ECO` |
| `FA` | Company fundamentals | `AAPL FA` |
| `FS` | Financial statements | `AAPL FS` |
| `SCR` | Equity screener | `SCR` |
| `RV` | Peer compare / relative value | `AAPL RV` |
| `FX` | FX dashboard | `FX` |
| `RATES` | Rates / yield-curve dashboard | `RATES` |
| `CMDTY` | Commodities & crypto dashboard | `CMDTY` |
| `W` | Watchlists | `W` |
| `ALRT` | Alerts center (notify-only) | `AAPL ALRT` |
| `NOTE` | Research notes | `NVDA NOTE` |
| `GLOS` | Finance glossary | `BETA GLOS` |
| `LEARN` | Guided tour + mnemonic trainer | `LEARN` |
| `HELP` | Full cheat sheet | `HELP` |
| `SET` | Settings, providers, API keys | `SET` |

`HELP` lists everything, including aliases, and is generated from the same
registry the parser uses — it can't drift out of date.

## Keyboard shortcuts

`/` or `Ctrl+K` focus command bar · `↑↓` select · `Enter` run · `Tab`
complete · `Esc` close · `Alt+1…9` jump to tab · `Alt+PageUp/PageDown` cycle
tabs · `Alt+W` close tab.

## Data & honesty

Every data panel shows source and freshness badges:

- **DEMO DATA** — synthetic, deterministic practice data (works offline).
- **DELAYED** — a live source with material lag (e.g. Yahoo, ≤15 min).
- **CACHED / STALE** — served from cache; STALE means a refresh failed.

Live sources never *silently* fall back to demo data: a failed live request
surfaces as an error (or a flagged stale cache entry), and you choose the
provider per data type in `SET`. Optional free API keys (Finnhub, Alpha
Vantage) unlock live fundamentals/statements. See
[`docs/DATA_PROVIDERS.md`](docs/DATA_PROVIDERS.md) for every source and its
limitations. No source is, or claims to be, official Bloomberg data.

## Persistence

Watchlists, notes, alerts, settings/API keys, recent commands, workspace
layout (your open tabs) and learning progress persist locally in
`data/terminal.db` (SQLite, git-ignored). Nothing leaves your machine except
requests to the data providers you configure.

## Screenshots

The terminal is dark-first and dense; run `.\run.ps1` to see it live. To
capture views for docs, open the app and use your OS screenshot tool
(`Win+Shift+S`); suggested shots: the markets monitor (`MON`), a chart
(`AAPL GP`), the screener (`SCR`), and the learning center (`LEARN`).

## Troubleshooting

- **`running scripts is disabled on this system`** — Windows blocks `.ps1`
  files by default. Use the `.cmd` wrappers (`.\run.cmd`, `.\setup.cmd`,
  `.\stop.cmd`), or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
  once.
- **`Node >= 24 required`** — install Node 24+ from nodejs.org; check with
  `node --version`.
- **Browser opens but says "API DOWN"** — the API didn't start; check
  `.run\server.log`. Re-run `.\run.ps1`.
- **Port already in use** — `.\stop.ps1` frees ports 4780/5173, then re-run.
- **Live data errors** — the keyless Yahoo source is unofficial and can
  rate-limit; open `SET` and switch the affected data type to `demo`, or add
  an API key.
- **Reset local data** — stop the app and delete `data\terminal.db*`
  (removes watchlists, notes, alerts, settings, layout). It is recreated on
  next launch.

## Stack

React 19 + TypeScript + Vite (client) · Express 5 + TypeScript on Node
type-stripping (server) · SQLite via built-in `node:sqlite` · Biome for
lint/format. Single npm package; see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Project status

All six build phases complete (foundation → app shell → data layer → core
modules → analytics → learning → polish). See
[`docs/ROADMAP.md`](docs/ROADMAP.md) for the phase log and
[`docs/SESSION_LOG.md`](docs/SESSION_LOG.md) for the build history.
