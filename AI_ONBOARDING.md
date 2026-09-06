# AI Onboarding — read this before `HANDOFF.md`

Two documents brief an incoming AI assistant on this project:

| File | Answers |
|---|---|
| **`AI_ONBOARDING.md`** (this file) | *Who* you're working with, *how* they work, what the machine looks like, what the words mean, and what not to do. |
| **`HANDOFF.md`** | *What* the software is — architecture, providers, API, database, commands, gotchas. |

Read this one first (5 minutes), then `HANDOFF.md` (the technical map), then
`CLAUDE.md` for the binding project rules. Everything here is orientation, not
instruction — where this file and the code disagree, the code wins.

---

## 1. The project in one paragraph

A local, Bloomberg-inspired **market terminal**: a dense, dark, keyboard-first
browser app for market monitoring, research, charting, screening, fundamentals,
news, watchlists, notify-only alerts, and finance learning. It runs entirely on
the owner's Windows machine (Express API + React client + SQLite), launched
from PowerShell. It is **strictly read-only** — no trading, ever (see §5). It
works with zero API keys and unlocks more with free ones. It was built from
scratch across roughly nine sessions in explicit numbered phases, and it is
feature-complete for v1 plus two post-v1 phases.

---

## 2. Who you're working with

- **A finance student.** Treat finance concepts as familiar; the *code* is what
  benefits from explanation, not what a P/E ratio is. The learning modules
  (`LEARN`, `GLOS`, student mode) exist because the owner uses this tool to
  study markets, so they are real features — don't treat them as filler.
- **Primary user is also the sole operator.** There is no team, no CI, no
  staging. "Production" is their laptop.
- **They care about honesty in the product.** A recurring theme across the
  whole build: never label delayed data as real-time, never fabricate a number
  to fill a gap, never let a failed live request silently become fake data.
  Several modules deliberately ship as "no free source exists for this" rather
  than inventing plausible values. Preserve that instinct — it is the second
  most important rule after "no trading."
- **They value verification over reassurance.** When you say something works,
  they expect you to have observed it working (a real request, a real render),
  not inferred it. If you didn't test it, say so plainly.
- **They give large, ambitious briefs** and expect you to scope honestly,
  deliver the whole scope, and say clearly what you deferred and why.

---

## 3. How to work on this project

The owner set an explicit operating process. Follow it:

1. **Read the docs first** — `CLAUDE.md`, `docs/ARCHITECTURE.md`,
   `docs/ROADMAP.md`, and the newest entry in `docs/SESSION_LOG.md`.
2. **Inspect the actual repo state before coding** (`git log --oneline`,
   `git status`). Don't assume from documentation, including this file.
3. **Don't redesign the architecture between sessions.** Extend it. If a
   structural change is genuinely needed, record the rationale in
   `docs/ARCHITECTURE.md`.
4. **Work in phases**, one at a time, with working checkpoints. Commit each
   coherent unit of work.
5. **Run the checks after changes**: `npm run typecheck`, `npm run lint`,
   `npm run build` — then exercise the real behavior.
6. **Update the docs**: append to `docs/SESSION_LOG.md` (newest first), tick
   items in `docs/ROADMAP.md`.
7. **End a session with three things**: what was completed, what remains in the
   current phase, and the exact PowerShell command to start next time.
8. **When blocked on a small choice, pick the most Windows-friendly practical
   option and say so.** Only stop and ask when the answer would genuinely
   change what you build (e.g. adding a paid provider — always ask first).

**Avoid overengineering.** v1 was deliberately kept simple: no Electron, no
workspaces monorepo, no UI framework, no ORM, no test framework. Match that
level of restraint.

---

## 4. The machine and environment

| Thing | Reality |
|---|---|
| OS | Windows 11 |
| Shell | PowerShell (Windows PowerShell 5.1 semantics) |
| Node | v26 (project requires **>= 24** for built-in `node:sqlite` + native TypeScript execution) |
| Package manager | npm, single package, no workspaces |
| Editor/IDE | JetBrains (a `.idea/` folder exists locally; it's gitignored) |
| Ports | API **4780**, Vite dev **5173** |
| Tools installed during earlier sessions | `gitleaks` (secret scanning), `gh` (GitHub CLI), `git-filter-repo` |

**PowerShell quirks that will bite you:**

- The execution policy is **`Restricted`** — `.ps1` scripts will not run. Use
  the `.cmd` wrappers (`run.cmd`, `setup.cmd`, `stop.cmd`), which invoke the
  matching `.ps1` under `-ExecutionPolicy Bypass`.
- Windows PowerShell 5.1 has **no `&&`, no `||`, no ternary, no `??`**. Use
  `;` and `if ($?) { }`.
- **Multiline `git commit -m` here-strings break.** Write the message to a
  file and use `git commit -F <file>`.
- Keep `.ps1` files **ASCII-only with no backtick line-continuations** — a
  backtick-continued line once made `run.ps1` unparseable.

**Server lifecycle:** if you start the API as a background child of your own
tool shell, it dies when your session ends and the UI then shows
"API unreachable" on every panel. For a server that outlives the session, ask
the user to launch it from their own terminal.

---

## 5. Hard rules (non-negotiable)

1. **Never add trading.** No execution, order routing, broker integration,
   order ticket, position-entry form, or simulated version of any of them.
   This is a product constraint, not a gap. If asked casually, flag it rather
   than complying. Only read-only *market-data* keys belong in this app —
   never broker credentials.
2. **Never fabricate or mislabel data.** Freshness tiers
   (`realtime`/`near-realtime`/`delayed`/`eod`/`official`/`synthetic`) must
   stay honest; `realtime` comes only from the live websocket feed. Demo data
   is always badged. A live provider failing must never silently become demo
   data.
3. **Never commit secrets or personal data.** `.env` holds the real keys and
   is gitignored. `.env.example` holds only empty placeholders. Don't put real
   API keys, personal emails, real names, or absolute paths containing the
   owner's Windows username into tracked files. (A full security audit was
   performed before publishing; keep that state.)
4. **Never imply the app uses Bloomberg data.** It's Bloomberg-*inspired* in
   workflow only. No source is official Bloomberg data.
5. **Don't add a paid provider or paid API without asking first.**

---

## 6. Vocabulary used throughout this codebase

| Term | Meaning here |
|---|---|
| **Mnemonic** | The short command code for a function, Bloomberg-style: `GP` = chart, `FA` = fundamentals. Registered in `client/src/commands/registry.ts`. |
| **Module** | One terminal function = one file in `client/src/modules/`, rendered inside a workspace tab. |
| **Envelope** | The wrapper around every market-data API response carrying `source`, `asOf`, `freshness`, `fromCache`, `stale`, `demo` alongside `data`. |
| **Freshness** | The honesty tier attached to every payload; rendered by `<DataBadge>`. |
| **Provider / adapter** | One data source implementing the `Provider` interface in `server/providers/`. |
| **Capability** | A data type a provider can serve (`quotes`, `news`, `statements`, `insiders`, …). Providers are selected per capability. |
| **`Unsupported`** | A typed error meaning "this provider can't serve this *shape* of request." The **only** condition that allows falling through to the next provider. |
| **Stale-serve** | Returning an expired cache entry (flagged `stale: true`) when a refresh fails, instead of erroring. |
| **Budget** | A self-imposed request cap set *below* a provider's published free-tier limit (`server/budget.ts`). |
| **Demo provider** | Deterministic synthetic data so the app is fully usable offline with zero keys. Always labeled. |
| **Student mode** | A toggle that adds a plain-English explainer strip to every module. |

---

## 7. Where things stand right now

- **Feature-complete** for the original six-phase plan, plus Phase 7 (advanced
  charting) and Phase 8 (data expansion / near-real-time + research modules).
- **Nothing is in progress.** The backlog in `docs/ROADMAP.md` is unstarted
  ideas, not half-finished work.
- **Published** to a private GitHub repo after a full security audit.
- **All four free API keys are configured** locally and every keyed provider
  path has been verified live (Finnhub incl. websocket, marketaux, FRED, Alpha
  Vantage), alongside the keyless ones (Yahoo, SEC EDGAR).
- **Dormant since mid-July 2026** — the code still runs; providers were
  re-verified afterwards.

One cosmetic open item: commits are authored under a GitHub noreply address
belonging to a *different* account than the one now owning the repo (the owner
renamed accounts). Harmless, fixable only by another history rewrite + force
push. The owner has been told; don't change it unilaterally.

---

## 8. Anti-patterns — things that would be regressions

- Calling an external API directly from a React component instead of adding a
  provider adapter behind `/api`.
- Adding a data route that doesn't go through `serveData()` (it would lose
  source/freshness labeling).
- Making a failed live request fall back to demo data.
- Hardcoding a command string in the UI instead of adding a registry entry.
- Editing or reordering a shipped database migration instead of appending one.
- Introducing a native npm module (breaks the zero-build-tooling Windows story).
- Adding a UI framework or restyling away from the dense terminal aesthetic
  (no hero sections, no marketing cards, no oversized padding).
- Using real people's or real firms' names in demo/synthetic data.
- Reordering `quotes` to put Finnhub first — its free tier lacks indices and
  FX, which blanks the monitor and the FX/RATES/CMDTY boards.
- Claiming something works without having run it.

---

## 9. Fastest path to being useful

```powershell
cd <repo>            # wherever the repo is cloned
.\run.cmd -Prod      # starts API + serves the built client on :4780
```

Then open <http://localhost:4780> and try: `MON` (markets monitor) · `AAPL GP`
(chart — press the range buttons, hover for the crosshair) · `AAPL FS` then the
`QTR` toggle (real SEC filings) · `HEAT` (sector heatmap) · `SET` (providers,
keys, live free-tier usage) · `HELP` (every command).

That five-minute tour shows you most of the architecture in action: the command
parser, the tab workspace, the provider layer, freshness badges, and the
honesty rules all at once.
