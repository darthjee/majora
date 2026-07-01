# Plan: Follow Python code PEP 257

Issue: [235-follow-python-code-pep-257.md](../issues/235-follow-python-code-pep-257.md)

## Overview
Bring every class docstring in the Python backend (`source/`) in line with PEP 257 by inserting a blank line between the `class Foo:` line and its docstring, enable ruff's `D203` pydocstyle rule so the convention is enforced going forward, and update the backend agent guide's example to match.

## Context
Currently every class docstring in `source/games` (models, views, serializers, migrations, tests, etc.) sits directly on the line after `class ...:`, with no blank line separating it. PEP 257 (and ruff's `D203` rule) expects one blank line before a class docstring. The issue asks to:
- Migrate all existing classes in `source/` to the new style (not just new code going forward).
- Enable `D203` in `source/pyproject.toml`'s `[tool.ruff.lint]` `select` list.
- Update `.claude/agents/backend.md`'s example code blocks (e.g. the `TestGame` example) to match.

## Implementation Steps

### Step 1 — Enable the ruff rule
In `source/pyproject.toml`, add `D203` to `[tool.ruff.lint]`'s `select` list (currently `["E", "F", "W", "I"]`). Since `D203` belongs to the `D` (pydocstyle) rule family, ruff requires selecting the specific code `D203` (not the whole `D` family, to avoid pulling in unrelated docstring rules not requested by this issue).

### Step 2 — Reformat all class docstrings in `source/`
Across every `.py` file under `source/` (models, views, serializers, migrations, tests, admin, apps, management commands, etc.), find every `class Foo:` / `class Foo(Bar):` line immediately followed by a docstring line, and insert one blank line between them, e.g.:

```python
class TestTreasureAccessView:

    """Tests for the GET /treasures/<id>/access.json endpoint."""
```

This is a mechanical, repo-wide change (149 class definitions found across `source/` at plan time) — a small script/one-liner (e.g. via `sed`/`python`) run once to insert the blank line is preferable to manual editing, followed by a manual scan of the diff for correctness (e.g. classes with no docstring, or decorators between `class` and docstring, should be left alone).

### Step 3 — Update the backend agent guide
In `.claude/agents/backend.md`, update the `TestGame` example (and any other example code blocks showing a class immediately followed by a docstring) to match the new blank-line convention.

### Step 4 — Verify
Run `ruff check .` inside the backend container to confirm `D203` passes repo-wide and no other lint regressions were introduced, then run the backend test suite to confirm behavior is unaffected (this is a pure formatting change).

## Files to Change
- `source/pyproject.toml` — add `D203` to `[tool.ruff.lint]` `select` list.
- `source/**/*.py` — insert a blank line between every `class ...:` line and its docstring (models, views, serializers, migrations, tests, etc. under `source/games` and any other app modules).
- `.claude/agents/backend.md` — update example code blocks (e.g. `TestGame`) to show the blank line before the docstring.

## CI Checks
- `source`: `poetry run ruff check .` (CI job: lint job at `.circleci/config.yml` — `working_directory: ~/project/source`, `command: poetry run ruff check .`)
- `source`: backend test job (pytest) to confirm no behavioral regression from the mechanical reformat.

## Notes
- This is a purely mechanical/formatting change; care must be taken that the insertion script only touches `class` lines immediately followed by a docstring (not functions/methods, and not classes without a docstring), to avoid unrelated diffs.
- Watch for edge cases: classes with decorators or comments between `class ...:` and the docstring, and classes whose docstring is not on the very next line.
