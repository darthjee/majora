# Backend Plan: Refactor: silence false-positive E0603 undefined names in backend/games/serializers/__init__.py's __all__

Main plan: [plan.md](plan.md)

## Context
Since #1216, `backend/games/serializers/__init__.py` declares its 117 public names in `__all__` but resolves them lazily via a module-level `__getattr__` backed by `_SUBMODULE_BY_NAME` (PEP 562). Pylint cannot see this, so Codacy reports every `__all__` entry as `E0603` (`undefined-all-variable`). The names resolve correctly at runtime, so the finding is a false positive. Eager imports and a `TYPE_CHECKING` block were considered and rejected (see the issue).

## Implementation Steps

### Step 1 — Add a justified pylint suppression on `__all__`
In `backend/games/serializers/__init__.py`, add `# pylint: disable=undefined-all-variable` so that it covers the whole `__all__` list. `undefined-all-variable` is reported per element line, so a trailing comment on the `__all__ = [` line alone may not cover them all — prefer a block-scoped form:

```python
# pylint: disable=undefined-all-variable
# Every name below is resolved lazily by `__getattr__` (PEP 562, see below) and is
# intentionally not imported at module load time, so Pylint's static check is a false positive.
__all__ = [
    ...
]
# pylint: enable=undefined-all-variable
```

Keep every line within the ruff limit (100 chars). Do not change the `__all__` contents, `_SUBMODULE_BY_NAME`, or `__getattr__`. If Codacy still reports findings after the change (Codacy may not honor inline disables for this check), fall back to disabling the pattern for this file via `.codacy.yml` and record the justification there.

### Step 2 — Verify behavior is unchanged
- Confirm `from games.serializers import *` still resolves every name in `__all__` (an existing or ad-hoc check via `docker-compose run --rm majora_tests`; add a small test in `backend/games/tests/serializers/` only if none covers star-import/`__all__` resolution today).
- Run the ruff check and the backend test suite.

## Files to Change
- `backend/games/serializers/__init__.py` — add the justified pylint disable/enable pair around `__all__`.
- `.codacy.yml` — only if the inline suppression isn't honored by Codacy (fallback).
- `backend/games/tests/serializers/` — optional test asserting every name in `__all__` resolves through `__getattr__`, if not already covered.

## CI Checks
- `backend`: `poetry run ruff check .` (CI job: `checks`)
- `backend`: `docker-compose run --rm majora_tests` (CI jobs: `pytest_all`, `pytest_views_*`)

## Notes
- Local/CI lint is ruff; Pylint only runs in Codacy, so the E0603 count can only be confirmed on Codacy after the PR is pushed.
- The original issue listed 50 names (the first 50 alphabetically); `__all__` has 117 and the suppression covers all of them.
- Pure comment change — no runtime behavior change.
