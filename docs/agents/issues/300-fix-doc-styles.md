# Issue: Fix Doc Styles

## Description
The backend Python codebase has docstring style inconsistencies that are not currently caught by lint:

- **No blank lines allowed before class docstring (D211)** — found in the `games/permissions.py` example below, and pervasively across the codebase.
- **Missing docstring in public nested class (D106)** — found in the `games/serializers/treasure_update.py` example below (nested `Meta` classes).

```python
class GameEditPermission(_EditPermission):

    """Encapsulate the authentication/authorization checks for editing a game."""

```

```python
class TreasureUpdateSerializer(serializers.ModelSerializer):

    """Serializer for partial updates to a treasure."""

    class Meta:
```

## Problem
`source/pyproject.toml` currently selects `D203` ("1 blank line required before class docstring") in `[tool.ruff.lint]`, which is the opposite convention of `D211` and is mutually exclusive with it in ruff/pydocstyle. `D106` ("missing docstring in public nested class") is not selected at all, so nested classes such as DRF `Meta` classes are never flagged for missing docstrings.

Because the rule has never been enforced, the inconsistency is widespread: a scan of `source/games` (excluding migrations) found 176 classes across 139 files with a blank line before their docstring, and 32 nested `Meta` classes (in models and serializers) with no docstring at all.

## Expected Behavior
`source/pyproject.toml` selects `D211` instead of `D203`, and adds `D106`, so ruff enforces "no blank line before class docstring" and "docstring required on public nested classes" going forward. All existing classes and nested `Meta` classes in `source/games` comply, so `ruff check` passes cleanly under the new rule set.

## Solution
1. In `source/pyproject.toml`, update `[tool.ruff.lint]` `select` to replace `D203` with `D211`, and add `D106`.
2. Remove the blank line before the docstring in every affected class (176 occurrences across 139 files, spanning models, serializers, views, permissions, middleware, and tests).
3. Add a docstring to every nested `Meta` class currently missing one (32 occurrences, all in `games/models/*` and `games/serializers/*`), using per-context wording that names the owning model/serializer, e.g. `"""Metadata for the Treasure model."""` or `"""Metadata for the TreasureUpdateSerializer."""`.

## Benefits
- Consistent, enforced docstring style across the backend codebase.
- `ruff check` catches future regressions automatically instead of relying on manual review.

---

Tags: :shipit:
