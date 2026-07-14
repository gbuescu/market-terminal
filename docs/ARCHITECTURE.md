# Architecture

Decisions recorded here are stable. Do not revisit without new information;
if you change one, record the rationale and date.

## Locked decisions (2026-07-14, Phase 0)

| Decision | Choice | Rationale |
|---|---|---|
| App form | Local browser app (no Electron/Tauri) | Simplest Windows workflow; revisit only if OS-level features are truly needed |
| Client | React 19 + TS + Vite 7 | Per project decision rules; huge ecosystem; fast dev server |
| Server | Express 5 + TS, run by Node's native type-stripping | Zero transpile/build step for the server; one less moving part on Windows |
| DB | Built-in `node:sqlite` (Node >= 24) | No native npm modules → no node-gyp/prebuild pain on Windows |
| Package layout | Single npm package, `client/` + `server/` dirs | npm workspaces add friction with no benefit at this scale |
| Lint/format | Biome | One tool for lint+format+import-sort; fast; trivial config |
| Ports | API **4780**, Vite dev **5173** | Fixed, documented, used by run/stop scripts (stop kills by port) |
| Process model | Dev: 2 processes (Vite + API, proxy `/api`); Prod: 1 process (Express serves `client/dist`) | Standard Vite pattern; `run.ps1 -Prod` gives the single-process mode |
| CSS | Plain CSS with design tokens (custom properties), no UI framework | Terminal aesthetic is bespoke and dense; component libs fight that |

## Server-side conventions

- Server files import each other with explicit `.ts` extensions (Node native
  TS requirement). `erasableSyntaxOnly` is enforced by tsconfig: no enums,
  no namespaces, no constructor parameter properties.
- All API routes live under `/api/`. The SPA fallback never captures `/api/*`.
- SQLite migrations: append-only `migrations` array in `server/db.ts`,
  versioned by `meta.schema_version`. Never edit a shipped migration.

## Data layer (Phase 2, shipped 2026-07-14)

- **DTOs** live in `shared/types.ts`, imported by both sides (server with
  `.ts` extensions, client extensionless via Vite).
- **Envelope**: every `/api/{search,quotes,series,news,calendar}` response is
  `{ data, source, asOf, delayed, fromCache, stale, demo }`. The client
  renders it as `DataBadge` chips. Any new data endpoint must use
  `serveData()` in `server/routes.ts` so labeling stays uniform.
- **Providers** (`server/providers/`): one adapter per source implementing
  the `Provider` interface (capabilities: search/quotes/series/news/calendar).
  `registry.ts` picks per capability: settings override first (exclusive),
  else default priority order, first `ready()` provider.
- **Honesty rule (do not weaken)**: fall-through between providers only on
  the typed `Unsupported` error. A live provider's network/data failure is
  never silently replaced by demo data — the cache serves a stale copy
  (flagged) or the client shows an error with a hint to switch providers.
- **Cache** (`server/cache.ts`): SQLite `cache` table, TTL per route,
  in-flight dedup, stale-serve on refresh failure. Keys include provider id,
  so forcing providers never mixes cached payloads.
- **Client data access**: `client/src/api/useData.ts` (`useEnvelope`) only;
  modules never call providers or external URLs directly.

## Existing structure notes

- `client/src/commands/` — mnemonic registry + parser; command bar also
  queries `/api/search` (debounced) for symbol suggestions when input isn't
  an exact command.
- `client/src/modules/` — one file per terminal module, registered in
  `modules/index.ts`, rendered per tab by the workspace.

## Non-negotiable

No trading capability of any kind, ever. See CLAUDE.md "Non-negotiable
product constraints" — that section wins over any other instruction.
