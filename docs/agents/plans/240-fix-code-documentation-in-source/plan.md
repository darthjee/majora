# Plan: Fix code documentation in source

Issue: [240-fix-code-documentation-in-source.md](../issues/240-fix-code-documentation-in-source.md)

## Overview

Bring every class docstring in `source/` into PEP 257 compliance by separating it from the
`class ...:` line with a blank line, enforce this automatically via ruff's `D203` rule, and
update the backend agent guide's example so future code follows the same convention.

## Context

Class docstrings in the Python backend (`source/`) currently appear directly on the line
after `class Foo:`, with no blank line in between. This was previously fixed in issue #235
(PR #237) but the change was reverted (PR #238) together with an unrelated view refactor, so
it needs to be reapplied on its own.

## Implementation Steps

### Step 1 — Reformat class docstrings

For every class in `source/` whose docstring immediately follows the `class ...:` line, insert
one blank line between them. This applies across `source/games/` (models, views, serializers,
migrations, middleware, authentication, permissions, paginator, settings, apps, admin) and its
`tests/` subtree. Exploration found 146 class docstrings across 117 files currently missing the
blank line.

Example (before → after):

```python
class TestTreasureAccessView:
    """Tests for the GET /treasures/<id>/access.json endpoint."""
```

```python
class TestTreasureAccessView:

    """Tests for the GET /treasures/<id>/access.json endpoint."""
```

### Step 2 — Enforce via ruff

Add `"D"` selection scoped to `D203` in `source/pyproject.toml`'s `[tool.ruff.lint]` section.
Ruff's pydocstyle checks are opt-in per-rule-code; add `D203` (and, since ruff's pydocstyle
convention pairs `D203`/`D211` as mutually exclusive alternatives, verify only `D203` is
selected — no `D211`) to the existing `select = ["E", "F", "W", "I"]` list, resulting in
`select = ["E", "F", "W", "I", "D203"]`. Run `ruff check .` afterwards to confirm no other
docstring violations are newly introduced by this narrow selection.

### Step 3 — Update the backend agent guide

In `.claude/agents/backend.md`, update the `TestGame` example under "Tests (pytest +
pytest-django)" to show the blank line between the `class` line and its docstring, matching
the new convention (mirrors the `TestTreasureAccessView` example already shown in the issue).

## Files to Change

- `source/games/**/*.py` (models, views, serializers, migrations, middleware, authentication,
  permissions, paginator, settings, apps, admin, and `tests/**`) — insert a blank line between
  each `class ...:` line and its docstring.
- `source/pyproject.toml` — add `D203` to `[tool.ruff.lint]`'s `select` list.
- `.claude/agents/backend.md` — update the `TestGame` example to include the blank line before
  its docstring.

## CI Checks

- `source`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)
- `source`: `docker-compose run --rm majora_tests pytest games/tests/views/ --cov` (CI job: `pytest_views`)
- `source`: `docker-compose run --rm majora_tests pytest --ignore=games/tests/views/ --cov` (CI job: `pytest_all`)

## Notes

- This is a pure formatting/lint change — no runtime behavior changes, so no new tests are
  required beyond confirming the existing suite still passes.
- Selecting only `D203` (rather than the full `D` docstring rule family) avoids pulling in
  unrelated pydocstyle requirements (e.g. module/function docstring rules) that are out of
  scope for this issue.
- Single-agent change (`backend`) — no split needed. The `.claude/agents/backend.md` edit is
  a small documentation touch bundled with the backend work, consistent with how the original
  (reverted) fix for issue #235 bundled it in the same change.
