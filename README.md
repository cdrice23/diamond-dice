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

[Conventional Commits](https://www.conventionalcommits.org/), `db` scope for schema work:

```
feat(db): create player data tables (levels, players, mlb_teams, award_types)
fix(db): enable RLS on formats table (missed in previous migration)
chore(db): drop hello_world prototype table
```

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
