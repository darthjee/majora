# Fix code documentation in source

## Context

Class docstrings in the Python backend (`source/`) should be separated from the `class` line by a blank line, per PEP 257 style, instead of appearing immediately after it. This was previously attempted in issue #235 (PR #237) but the change was reverted (PR #238), so it needs to be redone.

## What needs to be done

- Add a blank line between the `class Foo:` line and its docstring, across all of `source/`.
- Migrate all existing classes to the new style in this pass (not just new code going forward).
- Enable ruff's pydocstyle `D203` rule ("one blank line required before class docstring") in `source/pyproject.toml`'s `[tool.ruff.lint]` `select` list, so this is enforced automatically by `ruff check` going forward.
- Update the backend agent guide's (`.claude/agents/backend.md`) example code blocks (e.g. the `TestGame` example) to match the new convention.

Example:

```python
class TestTreasureAccessView:

    """Tests for the GET /treasures/<id>/access.json endpoint."""
```

## Acceptance criteria

- [ ] Every class docstring in `source/` (models, views, serializers, migrations, tests, etc.) is separated from the `class ...:` line by a blank line.
- [ ] Ruff's `D203` rule is enabled in `source/pyproject.toml` and `ruff check` passes.
- [ ] `.claude/agents/backend.md` example code blocks are updated to match the new convention.

Tags: :shipit:
