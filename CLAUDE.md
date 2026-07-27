# Diamond Dice — Project Context for Claude Code

Mobile baseball dice game (PvP/PvE), built as a hobby/learning project to develop full-stack + React Native skills. Solo developer, prioritizes understanding over speed, free/low-cost tooling only.

## Stack

- **Client**: React Native + Expo (SDK 54), TypeScript, Expo Router (file-based routing, `app/` at project root, no `src/` wrapper)
- **Styling**: NativeWind v4 (Tailwind for RN) + `react-native-reusables` (copy-own component pattern, shadcn-style CLI — generated components live in the repo, not a dependency)
- **State/data**: TanStack Query + Zustand
- **Backend**: Supabase (Postgres, Auth, Realtime, RLS, Edge Functions) — local dev via Supabase CLI + Docker, hosted project for production
- **ETL**: Python, `etl/` directory, pulls MLB player data from the MLB Stats API (`statsapi.mlb.com`, unofficial, no auth) via GitHub Actions

## Repo structure

```
app/           Expo Router screens
lib/           shared client-side code (supabase.ts, utils.ts/cn helper, theme.ts)
supabase/      migrations (source of truth for schema)
etl/           Python data pipeline (see etl/README section or CONTRIBUTING.md)
.github/workflows/   scheduled ETL jobs
```

## Key architectural decisions (with reasoning, not just the what)

- **MLB Stats API only** for player data — pivoted away from an original pybaseball + MLB Stats API hybrid once confirmed the latter alone covers career stats, bio, awards, and (via fielding-games totals) positional eligibility. No FanGraphs/MLBAM ID crosswalk needed.
- **Qualification thresholds** (deliberately Diamond Dice's own convention, not MLB's official standard): `is_qualified_batter` = career PA ≥ 502; `is_qualified_pitcher` = career IP ≥ 162.
- **`eligible_positions`** computed from career fielding-games totals (≥162 games at a position, same convention), not the API's single-snapshot `primaryPosition` field — this generalizes correctly to two-way players (Ohtani) and position-shifted careers without special-casing. `DH` is deliberately never stored in this array — it's business logic (any qualified batter, or a two-way player, can DH), not per-player source data.
- **Era floor: 1901** ("modern era"). Known accepted limitation: no cross-era stat normalization (a .280 AVG in 1920 ≠ .280 AVG today).
- **Career stat pulls use `byDateRange` + `gameType=R`**, never plain `stats=career` — the latter silently includes spring training/postseason games. This was a real, confirmed data-corruption bug caught before shipping.
- **`group=pitching` responses contain hitting-shaped fields** (`avg`, `atBats`, etc.) representing _batting against_, not the pitcher's own hitting — same field names, different meaning by `group` context. Never cross-read fields across groups.
- **`inningsPitched` uses traditional `.1`/`.2` notation** (614.1 = 614⅓ innings), stored as-is (fits the `numeric(5,1)` column shape and matches real box scores) — never treated as true decimal in any computation.
- **MLB team IDs persist across franchise relocations** (e.g., Boston Braves → Atlanta Braves is one continuous team ID) — confirmed live, not assumed.
- **`player_mlb_team_history` built from the `yearByYear` stats endpoint** (one call per player, full career in one shot), not from team-roster snapshots — the roster-snapshot approach was tried and rejected because it couldn't backfill already-seeded players.
- **This API has genuine, not-fully-predictable reliability issues** (connection drops, timeouts, apparent soft throttling under sustained volume) — every ETL script assumes individual requests can fail and is built with retry/backoff + a circuit breaker that aborts the whole run after repeated trip thresholds (next scheduled run resumes cleanly). All writes are idempotent upserts — safe to interrupt or re-run at any point.

## Conventions

- **Python: 2-space indentation** (deliberate deviation from PEP 8/Black defaults — Ruff's formatter can't do this, so Ruff is lint-only in this project, no auto-format-on-save for Python).
- **Single blank line** between functions/blocks (not Black's default 2).
- **No blank lines between imports** within a group.
- Conventional Commits, scoped (`feat(db): ...`, `fix(etl): ...`), imperative mood, name actual tables/files touched.
- Migrations are append-only — never edit an already-applied migration; write a new one.

## Where fuller detail lives (read these directly rather than duplicating here)

- `README.md` — full local dev setup, migration workflow, ETL entry points/schedules, linting commands
- `supabase/migrations/` — schema is the source of truth; read directly rather than trusting any prose description of it
- ETL pipeline: `etl/pipeline.py` (shared logic), `etl/mlb_client.py` (HTTP client + resilience), `etl/config.py` (thresholds/constants)

## Current state (update as this evolves — this section will go stale fastest)

- Player data bootstrap crawl (1901→present) is running on a recurring GitHub Actions schedule, not yet complete for full history.
- Design system: NativeWind v4 + `react-native-reusables` set up, base theme tokens (`THEME`/`NAV_THEME` in `lib/theme.ts`) in progress — palette being finalized.
- Auth/user accounts is the next major epic after the design-system foundation is in place.
