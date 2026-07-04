# Plan: Add Security Verifications

Issue: [273-add-security-verifications.md](../../issues/273-add-security-verifications.md)

## Overview

Lock in the existing mass-assignment protection on the three update serializers
(`CharacterUpdateSerializer`, `GameUpdateSerializer`, `TreasureUpdateSerializer`) with
regression tests proving disallowed fields (e.g. `game`/`player` on Character) are
silently ignored on `save()`, and document the rule in
`docs/agents/security-guidelines.md` so the `security` agent enforces it on future
entities.

## Context

- `source/games/serializers/character_update.py` allowlists
  `['name', 'role', 'public_description', 'private_description', 'hidden', 'money']` —
  `game` and `player` are correctly excluded.
- `source/games/serializers/game_update.py` allowlists `['name', 'description']` —
  `game_slug` is correctly excluded.
- `source/games/serializers/treasure_update.py` allowlists `['name', 'value']`.
- Existing tests (`source/games/tests/serializers/test_character_update.py`,
  `test_game_update.py`) cover valid/invalid field updates but never attempt to pass a
  disallowed relationship field (`game`, `player`) alongside valid data and assert it has
  no effect after `save()`. `test_game_update.py` does cover `game_slug` this way already
  (`test_game_slug_is_not_included`) — that pattern is the template to replicate.
- There is no `source/games/tests/serializers/test_treasure_update.py` file yet; Treasure
  has no serializer test file at all currently.
- `docs/agents/security-guidelines.md` has no section on mass assignment / field-level
  update authorization.

## Implementation Steps

### Step 1 — Backend: Character update regression tests

In `source/games/tests/serializers/test_character_update.py`, add a test creating a
second `Game` and `Player` and asserting that passing `game`/`player` (or their `_id`
forms, whichever the serializer would accept as raw input) alongside a valid field (e.g.
`name`) in a partial update payload does not change `character.game` / `character.player`
after `serializer.save()`. Follow the existing `test_game_slug_is_not_included` pattern
from `test_game_update.py` for structure.

### Step 2 — Backend: Game update regression test

`test_game_update.py` already has `test_game_slug_is_not_included` covering the one
non-allowlisted field `Game` exposes (`game_slug`). Confirm no other writable/relationship
field exists on `Game` that isn't covered; if `photo` or another field exists and is
excluded from the allowlist, add an equivalent regression test for it. Otherwise, no
change needed here beyond verifying coverage — note in the PR description which fields
were checked.

### Step 3 — Backend: Treasure update regression tests

Create `source/games/tests/serializers/test_treasure_update.py` (new file), following the
same structure/patterns as `test_game_update.py`:
- Valid partial updates to `name` and `value`.
- All fields optional / empty payload valid.
- A regression test asserting the Treasure's owning relationship field (e.g. `game` or
  `character`, whichever FK `Treasure` has) cannot be changed via `PATCH` — pass it
  alongside a valid field and assert it is unchanged after `save()`.

Read `source/games/models/treasure.py` first to confirm the exact FK field name(s) to
target before writing the test.

### Step 4 — Architect: Document the rule in security-guidelines.md

Add a new section `## 8. Mass Assignment / Field-Level Update Authorization` to
`docs/agents/security-guidelines.md` stating:
- Update serializers must declare an explicit `Meta.fields` allowlist (never
  `fields = '__all__'`, never implicit exclusion via `Meta.exclude`).
- The allowlist must never include foreign keys representing ownership/relationship
  chains (e.g. `game`, `player`, `character`) or other server-managed fields (e.g.
  slugs, ids, timestamps).
- Every update serializer must have a regression test proving at least one
  disallowed/relationship field has no effect when included in an update payload
  (reference the pattern used in `test_game_update.py`'s
  `test_game_slug_is_not_included` and the new tests added by this plan).

## Files to Change

- `source/games/tests/serializers/test_character_update.py` — add regression test(s) for
  `game`/`player` non-writability.
- `source/games/tests/serializers/test_game_update.py` — verify/extend coverage for any
  non-allowlisted field beyond `game_slug`.
- `source/games/tests/serializers/test_treasure_update.py` — new file with full
  serializer test coverage including a mass-assignment regression test.
- `docs/agents/security-guidelines.md` — new "Mass Assignment / Field-Level Update
  Authorization" section.

## CI Checks

- `source`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`), run via `docker-compose run backend poetry run pytest games/tests/serializers/`

## Notes

- No new endpoints, serializer fields, or permission logic are being added — this is
  test-only backend work plus a documentation addition, so no `data-access` or
  `security` agent review of new surface area is required beyond the standard PR review
  the pipeline already performs.
- Confirm exact FK field name(s) on `Treasure` (likely `game` or `character`) before
  writing Step 3 — do not assume without reading the model.
