# Diamond Dice — Contributing

## Prerequisites

- Node.js via [nvm](https://github.com/nvm-sh/nvm) — version per `.nvmrc` (Expo SDK 54 requires ≥20.19.4)
  ```bash
  nvm use
  ```
- npm (bundled with Node; current version)
- Docker Desktop (current version)
- Supabase CLI — install via Homebrew, not npm:
  ```bash
  brew install supabase/tap/supabase
  ```
- Expo CLI (no separate install — used via `npx expo ...`)
- **Expo Go app matching SDK 54 specifically** — the App/Play Store's current build can lag behind a project's pinned SDK version; if a "project is incompatible" error occurs, verify the correct build at [expo.dev/go](https://expo.dev/go?sdkVersion=54) (Android supports direct sideload of an SDK-specific build; iOS is limited to whatever the App Store currently has published)
- Access to the hosted Supabase project (or your own project for personal development)
- Git authentication configured (GitHub CLI or SSH)
- Recommended VS Code extensions: ESLint, Prettier, Expo Tools, PostgreSQL (`ms-ossdata.vscode-pgsql`), Python, GitLens, Error Lens, DotENV

## Running the Project

### Setup

```bash
npm install
```

Create `.env` at the project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key-here
```

Use the **Publishable** key (`Project Settings → API Keys`), never the Secret key, in this file.

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

### Development

```bash
# Start Docker Desktop first
supabase start
npx expo start
```

Studio: `http://localhost:54323`

### Shutdown

```bash
supabase stop
```

## Linting

For linting python files:

```bash
cd etl
ruff check .          # lint
ruff check . --fix    # auto-fix safe issues
```

Config: `etl/pyproject.toml`. Formatter disabled (2-space indentation preference, incompatible with Ruff's fixed 4-space formatter)

## Contributing (Migrations)

Migration files in `supabase/migrations/` are the source of truth for the schema. Never edit an already-applied migration — write a new one.

### Create a migration

```bash
supabase migration new <snake_case_description_of_change>
```

### Pre-flight check

Every `create table` should have a matching `alter table ... enable row level security` (except intentionally policy-less internal tables like `system_config`):

```bash
grep -c "^create table" supabase/migrations/<file>.sql
grep -c "enable row level security" supabase/migrations/<file>.sql
```

### Apply and verify locally

```bash
supabase db reset
```

Wipes local data and rebuilds from all migrations. Verify in Studio, including that constraints/policies reject invalid cases, not just that objects exist.

### Check sync state

```bash
supabase migration list
```

### Commit

WIP

### Push

```bash
git push
supabase db push
```

### RLS patterns

| Shape                           | Pattern                                               | Example                                   |
| ------------------------------- | ----------------------------------------------------- | ----------------------------------------- |
| Public-read                     | `using (true)`                                        | `players`, `levels`                       |
| Owner-scoped                    | `using (owner_id = auth.uid())`, or `EXISTS` join     | `teams`, `roster_slots`                   |
| Participant-read, service-write | No `authenticated` write policy — Edge Functions only | `games`, `at_bats`, `plays`, stats tables |
| Zero access                     | RLS enabled, no policies                              | `system_config`                           |

For cross-table participant checks (e.g. `games` ↔ `teams`), use a `SECURITY DEFINER` function to avoid recursive RLS evaluation — see `is_game_participant` / `is_team_in_my_game`.

## Running ETL Pipeline (`etl/`)

Pulls MLB player data from the MLB Stats API (`statsapi.mlb.com`, unofficial, no auth required) into `players`, `mlb_teams`, `award_types`, `player_awards`, `player_mlb_team_history`.

### Setup

```bash
cd etl
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `etl/.env` (gitignored):

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=sb_secret_... # secret key, not publishable -- bypasses RLS
```

### Entry points

| Script                     | Purpose                                                                                               | Trigger                      |
| -------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------- |
| `seed_reference_data.py`   | Seeds `mlb_teams`, `award_types`                                                                      | Manual, one-off              |
| `bootstrap.py`             | Historical crawl (1901–present), discovers + seeds new players, records team history and awards       | GitHub Actions, every 6h     |
| `retry_failed.py`          | Retries players in `etl_failed_players`                                                               | GitHub Actions, daily        |
| `annual_refresh.py`        | Refreshes current-roster players' career stats after a season ends (gated to Nov 1+); re-seeds awards | GitHub Actions, daily        |
| `backfill_team_history.py` | One-off backfill of `player_mlb_team_history` for already-seeded players missing it                   | Manual (`workflow_dispatch`) |

### Progress tracking

Crawl position stored in `system_config`:

- `etl_current_season`, `etl_completed_teams_this_season` — bootstrap crawl checkpoint
- `etl_refresh_target_season`, `etl_refresh_completed_teams` — annual refresh checkpoint

Failed players logged to `etl_failed_players` (player_id, error, attempt_count), cleared automatically on successful retry.

### Resilience

- Per-request retry with backoff (`mlb_client.py`)
- Circuit breaker aborts the whole run after `CIRCUIT_BREAKER_MAX_TRIPS_PER_RUN` consecutive-failure trips — exits cleanly, next scheduled run resumes
- All writes are idempotent upserts (`on_conflict`) — safe to interrupt (Ctrl+C, GitHub Actions timeout/cancellation) or re-run at any point with no data loss

### Running locally

```bash
source etl/venv/bin/activate
cd etl
python bootstrap.py
```

Local runs use whatever `SUPABASE_URL`/`SUPABASE_SECRET_KEY` are set in `etl/.env` — confirm which project (local vs. hosted) before running.

### GitHub Actions

Repository secrets required: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`. All ETL workflows share `concurrency: group: bootstrap-crawl` — they read/write overlapping tables and must never run simultaneously.
