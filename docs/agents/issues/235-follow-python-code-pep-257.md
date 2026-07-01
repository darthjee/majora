# Issue: Follow Python code PEP 257

## Description
Class docstrings in the Python backend (`source/`) should be separated from the `class` line by a blank line, per PEP 257 style, instead of appearing immediately after it.

## Problem
Currently every class docstring in `source/games` (models, views, serializers, migrations, tests, etc.) is written directly on the line after the `class ...:` line, with no blank line in between.

## Solution
- Add a blank line between the `class Foo:` line and its docstring, across all of `source/`.
- Migrate all existing classes to the new style in this pass (not just new code going forward).
- Enable ruff's pydocstyle `D203` rule ("one blank line required before class docstring") in `source/pyproject.toml`'s `[tool.ruff.lint]` `select` list, so this is enforced automatically by `ruff check` going forward.
- Update the backend agent guide's (`.claude/agents/backend.md`) example code blocks (e.g. the `TestGame` example) to match the new convention.

Example:

```python
class TestTreasureAccessView:

    """Tests for the GET /treasures/<id>/access.json endpoint."""
```

## Benefits
- Consistent PEP 257 formatting across the codebase.
- Class docstring spacing is enforced automatically going forward via ruff, preventing regressions.

---

Tags: :shipit:
