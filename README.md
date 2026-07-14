# market-terminal

A local, Bloomberg-style market terminal for Windows — market monitoring,
research, charting, screening, alerts, watchlists, and a finance-student
learning mode. Runs entirely on your machine as a local browser app.

**Strictly read-only.** No trade execution, no order routing, no broker
integrations. Research, analytics, alerts, and watchlists only. Not
affiliated with Bloomberg L.P.; no Bloomberg data is used.

## Quick start (PowerShell)

```powershell
.\setup.ps1     # one-time: verifies Node >= 24, installs dependencies
.\run.ps1       # starts API (:4780) + UI (:5173) and opens your browser
.\stop.ps1      # stops everything
```

Requires [Node.js 24+](https://nodejs.org). No other runtime dependencies —
SQLite ships inside Node itself.

## Status

Early scaffold (Phase 0 of 6 complete). See `docs/ROADMAP.md` for the plan
and `docs/DATA_PROVIDERS.md` for data sources and their limitations.

## Stack

React 19 + TypeScript + Vite (client) · Express 5 + TypeScript on Node
type-stripping (server) · SQLite via built-in `node:sqlite` · Biome.
