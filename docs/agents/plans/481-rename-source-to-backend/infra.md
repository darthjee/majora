# Infra Plan: Rename source to backend

Main plan: [plan.md](plan.md)

## Shared contracts

- The `backend` agent renames `source/` to `backend/` with identical internal structure
  (still contains `pyproject.toml`, `poetry.lock`). Every reference below is a straight
  path substitution — no other structural assumption to make.

## Implementation Steps

### Step 1 — `docker-compose.yml`

Update the backend volume mount:

```yaml
- ./source:/home/app/app
```
→
```yaml
- ./backend:/home/app/app
```

### Step 2 — Dockerfiles

- `dockerfiles/majora-base/Dockerfile` (line 11) and
  `dockerfiles/production_majora-base/Dockerfile` (line 11):
  `./source/pyproject.toml ./source/poetry.lock*` → `./backend/pyproject.toml
  ./backend/poetry.lock*`
- `dockerfiles/circleci_majora-base/Dockerfile` (line 13): same substitution.
- `dockerfiles/majora/Dockerfile` (line 5): same substitution.
- `dockerfiles/production_majora/Dockerfile` (line 8): `COPY --chown=app:app ./source/
  /home/app/app/` → `COPY --chown=app:app ./backend/ /home/app/app/`

### Step 3 — `.circleci/config.yml`

- Three `working_directory: ~/project/source` entries (backend test/lint jobs) →
  `~/project/backend`.
- Five `command:` lines that shuttle the checkout between `frontend`/`source` for caching
  purposes (e.g. `rm source -rf; cp frontend/* ./ -r; rm frontend -rf` and the reverse) —
  replace every bare `source` token in these commands with `backend`, keeping the same
  swap logic. Read each one in context before editing since the two directions
  (`source`→`.` vs `.`→`source`) look similar but aren't identical.

### Step 4 — `.codacy.yml`

Both `"source/games/tests/**"` glob entries → `"backend/games/tests/**"`.

### Step 5 — `scripts/bump_version.sh`

- Line 8: `PYPROJECT="$ROOT/source/pyproject.toml"` → `PYPROJECT="$ROOT/backend/pyproject.toml"`
- Line 47 comment: `# Update source/pyproject.toml version` → `# Update backend/pyproject.toml version`

### Step 6 — Verify

After all substitutions, run `docker-compose config` (or equivalent) to sanity-check the
compose file parses, and grep `.circleci/config.yml`, `dockerfiles/`, `docker-compose.yml`,
`.codacy.yml`, and `scripts/` for any remaining literal `source/` or bare `source`
path token tied to the old folder (excluding `scripts/deploy.sh`'s unrelated Bash `source`
builtin call).

## Files to Change

- `docker-compose.yml` — volume mount path.
- `dockerfiles/majora-base/Dockerfile`
- `dockerfiles/production_majora-base/Dockerfile`
- `dockerfiles/circleci_majora-base/Dockerfile`
- `dockerfiles/majora/Dockerfile`
- `dockerfiles/production_majora/Dockerfile`
- `.circleci/config.yml` — `working_directory` and cache-shuffle commands.
- `.codacy.yml` — coverage path globs.
- `scripts/bump_version.sh` — pyproject path.

## CI Checks

- This change modifies `.circleci/config.yml` itself — validate by pushing and watching the
  pipeline run (or `circleci config validate` locally if available); there is no separate
  "lint the CI config" job to run beforehand.

## Notes

- Do not touch `scripts/deploy.sh`'s `source "scripts/render.sh"` — that's the Bash builtin,
  unrelated to the folder rename.
- Coordinate with `backend`'s `git mv` landing in the same change set — a half-renamed tree
  breaks the compose volume mount and CI checkout.
