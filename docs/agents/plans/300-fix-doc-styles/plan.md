# Plan: Fix Doc Styles

Issue: [300-fix-doc-styles.md](../../issues/300-fix-doc-styles.md)

## Overview
Switch the backend's ruff docstring convention from `D203` to `D211` (no blank line before a class docstring), add `D106` (missing docstring in public nested class) to the selected rule set, and fix every existing violation in `source/games` so `ruff check .` passes cleanly under the new rules.

## Context
`source/pyproject.toml`'s `[tool.ruff.lint]` currently selects `D203`, which requires a blank line before a class docstring — the opposite of, and mutually exclusive with, `D211`. Because `D203` (not `D211`) has always been selected, the actual codebase convention (no blank line) has never been enforced, so 191 classes across the codebase have a stray blank line before their docstring. Separately, `D106` has never been selected, so 32 nested `Meta` classes (in `games/models/*` and `games/serializers/*`) have no docstring at all. Both were confirmed by running `ruff check .` against the proposed rule set:

```
191	D211	[*] No blank lines allowed before class docstring
 32	D106	[ ]  Missing docstring in public nested class
Found 223 errors.
```

191 of the 223 are auto-fixable by ruff (`--fix`); the 32 `D106` violations require a manual per-class docstring.

## Implementation Steps

### Step 1 — Update the ruff rule selection
In `source/pyproject.toml`, change:
```toml
[tool.ruff.lint]
select = ["E", "F", "W", "I", "D203"]
```
to:
```toml
[tool.ruff.lint]
select = ["E", "F", "W", "I", "D211", "D106"]
```

### Step 2 — Auto-fix the D211 violations
Run `poetry run ruff check . --fix` (via `docker-compose run --rm majora_tests`, never on the host directly) to remove the blank line before the docstring in all 191 affected classes, spanning `games/models`, `games/serializers`, `games/views`, `games/permissions`, `games/middleware`, and `games/tests`. Diff the result to confirm only blank-line removals before docstrings occurred (no other formatting changes).

### Step 3 — Add docstrings to nested `Meta` classes
`ruff --fix` cannot auto-generate `D106` docstrings, so add one manually to each of the 32 flagged nested classes (all `class Meta:` inside `games/models/*` and `games/serializers/*` — see exact file list below). Word each docstring specifically for its owning model/serializer, e.g.:
```python
class Meta:

    """Metadata for the Treasure model."""
```
(mind `D211` from Step 1 — no blank line before the docstring — when adding these).

### Step 4 — Verify
Run `poetry run ruff check .` (via `docker-compose run --rm majora_tests`) and confirm zero errors. Run the full backend test suite (`docker-compose run --rm majora_tests` pytest command) to confirm no behavioral changes were introduced — these are docstring/whitespace-only edits.

## Files to Change
- `source/pyproject.toml` — swap `D203` for `D211`, add `D106` to `[tool.ruff.lint]` `select`.
- 191 classes across `source/games` (models, serializers, views, permissions, middleware, tests) — remove the blank line before the class docstring. Auto-fixed by `ruff check . --fix`; no manual file list needed.
- The following 32 nested `Meta` classes — add a docstring by hand:
  - `games/models/character.py`
  - `games/models/game.py`
  - `games/models/game_master.py`
  - `games/models/game_session.py`
  - `games/models/player.py`
  - `games/models/treasure.py`
  - `games/serializers/character_detail.py`
  - `games/serializers/character_full.py`
  - `games/serializers/character_link.py`
  - `games/serializers/character_list.py`
  - `games/serializers/character_photo.py`
  - `games/serializers/character_update.py`
  - `games/serializers/game_create.py`
  - `games/serializers/game_detail.py`
  - `games/serializers/game_list.py`
  - `games/serializers/game_master.py`
  - `games/serializers/game_photo.py`
  - `games/serializers/game_session_create.py`
  - `games/serializers/game_session_detail.py`
  - `games/serializers/game_session_list.py`
  - `games/serializers/game_session_update.py`
  - `games/serializers/game_update.py`
  - `games/serializers/link.py`
  - `games/serializers/my_account_detail.py`
  - `games/serializers/my_account_update.py`
  - `games/serializers/staff_user_detail.py`
  - `games/serializers/staff_user_list.py`
  - `games/serializers/staff_user_update.py`
  - `games/serializers/treasure_create.py`
  - `games/serializers/treasure_detail.py`
  - `games/serializers/treasure_list.py`
  - `games/serializers/treasure_update.py`

## CI Checks
- `source`: `poetry run ruff check .` (CI job: `checks`, step "Check python Lint")
- `source`: pytest suite (CI job: `checks`/backend test job) — sanity check that whitespace/docstring-only edits didn't break anything

## Notes
- Purely a lint/style change — no behavioral, API, or schema changes, so no `data-access` or `security` review is needed.
- Single agent involved (`backend`); no agent split.
- Double-check `ruff check . --fix` didn't also reformat unrelated lines (e.g. import sorting) beyond the intended D211 blank-line removals — scope the diff review to confirm.
