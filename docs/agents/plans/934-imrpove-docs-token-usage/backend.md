# Backend Plan: Improve docs token usage

Main plan: [plan.md](plan.md)

## Shared contracts

None — independent of the frontend track.

## Implementation Steps

### Step 1 — Split `backend/games/tests/factories.py` into a package

Convert `backend/games/tests/factories.py` (323 lines, 20 factory classes)
into a `backend/games/tests/factories/` package, mirroring the existing
`backend/games/models/` convention (resource subfolders + an `__init__.py`
that re-exports everything). Suggested grouping:

- `factories/user.py` — `UserFactory`, `SuperUserFactory`,
  `_ensure_approved_profile`, `UserProfileFactory`
- `factories/game.py` — `GameFactory`, `PlayerFactory`
- `factories/character.py` — `CharacterFactory`
- `factories/treasure.py` — `TreasureFactory`, `GameTreasureFactory`
- `factories/item.py` — `GameItemFactory`, `CharacterItemFactory`
- `factories/document.py` — `GameDocumentFactory`, `CharacterDocumentFactory`
- `factories/poll.py` — `PollFactory`, `PollOptionFactory`, `PollVoteFactory`
- `factories/conversation.py` — `ConversationFactory`,
  `ConversationParticipantFactory`, `MessageFactory`,
  `MessageVisualisationFactory`

`factories/__init__.py` must import and re-export every factory class (same
pattern as `games/models/__init__.py`), so all ~225 existing
`from games.tests.factories import ...` call sites across the test suite keep
working unchanged — do not touch those call sites.

### Step 2 — Verify nothing broke

Run the full backend test suite and lint after the split (see CI Checks
below) — a pure mechanical split should produce zero behavior change.

## Files to Change

- `backend/games/tests/factories.py` — delete, replaced by the package below
- `backend/games/tests/factories/__init__.py` — new, re-exports all factory
  classes
- `backend/games/tests/factories/user.py`, `game.py`, `character.py`,
  `treasure.py`, `item.py`, `document.py`, `poll.py`, `conversation.py` — new,
  per-resource factory classes

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI jobs:
  `pytest_views_characters`, `pytest_views_rest`, `pytest_all`)
- `backend`: `docker-compose run --rm majora_be poetry run ruff check .` (CI
  job: `checks`)

## Notes

- Purely mechanical split — no factory behavior should change. Watch for any
  factory that relies on another being defined earlier in the same module
  (import order across the new files).
