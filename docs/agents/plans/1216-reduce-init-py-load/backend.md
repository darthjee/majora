# Backend Plan: Reduce `games/serializers/__init__.py` load

Main plan: [plan.md](plan.md)

## Overview

Replace the ~100+ eager top-level imports in `backend/games/serializers/__init__.py`
with PEP 562 lazy loading (module-level `__getattr__`), so every currently-supported
`from games.serializers import X` call site (~182 files) keeps working unchanged while
each submodule is only imported on first access of its name. Rewrite the docstring into a
subpackage map, and update `docs/agents/serializers-organization.md`'s "Stability of
public re-exports" section to describe the new lazy mechanism.

## Context

`backend/games/serializers/__init__.py` (296 lines) currently imports every serializer
class from every subpackage at module-import time and re-exports them via a giant
`__all__` (~150+ symbols). An audit (see issue #1216) found:

- 182 files depend on the package-level re-export (`from games.serializers import X`,
  including the relative form used throughout `games/views/**`) — this is the dominant,
  load-bearing pattern, not legacy debt.
- 16 files already import directly from a specific submodule.
- `docs/agents/serializers-organization.md` documents the re-export as the required
  stable public API — the mechanism can change, but the import paths (contract) must not.
- Of the symbols assumed cross-cutting in earlier drafts, only `PhotoUploadSerializer` has
  genuine cross-app fan-in (`uploads/upload_initiator.py` plus two `games/views/` call
  sites); `BaseAccessSerializer` (0 external consumers) and `FileUploadSerializer` (1
  consumer) do not.
- `games/views/__init__.py` and `games/models/__init__.py` are explicitly **out of
  scope** for this plan — see issue #1216's Problem section (views split off to #1217;
  models left untouched due to Django's app-registry constraint).

## Implementation Steps

### Step 1 — Convert `games/serializers/__init__.py` to PEP 562 lazy loading

Replace the current eager top-level imports and static `__all__`-only docstring with:

- A module-level `__getattr__(name)` function: given a name, look it up in a
  `name -> "submodule.path"` mapping (built from the current explicit imports — every
  entry currently in `__all__`), import that submodule via `importlib.import_module`
  (relative to `games.serializers`), `getattr` the class off it, cache the result on the
  module via `globals()[name] = value` (or `setattr(sys.modules[__name__], name, value)`)
  so repeated access is a plain attribute lookup, and return it. Raise
  `AttributeError(f"module 'games.serializers' has no attribute '{name}'")` for unknown
  names, matching normal Python module semantics (this also keeps `hasattr`/`getattr`
  with a default working correctly, and avoids masking real `AttributeError`s from
  within a submodule's own import).
- Keep `__all__` listing every currently-supported symbol name (same set as today) so
  `dir(games.serializers)`, IDEs, and static analysis still see the full public surface —
  only *when* each submodule is imported changes, not *what* is importable.
- A module-level `__dir__()` returning `sorted(__all__)` is optional polish (not required
  for `__getattr__` to work) — include it only if it's cheap to keep in sync with `__all__`.
- Rewrite the docstring into a subpackage map, mirroring `backend/permissions/__init__.py`
  (the existing model to follow): list the subpackages (`characters/` incl. `npcs/`/
  `pcs/`, `games/` incl. its nested sub-resources, `treasures/`, `staff/`), the
  cross-cutting root-level files (`base_access.py`, `base_permissions.py`,
  `photo_upload.py`), a one-line note on how the lazy `__getattr__` loading works, and an
  explicit callout that `PhotoUploadSerializer` is the one serializer with genuine
  cross-app usage (consumed by the `uploads` app).
- Double-check every name currently in `__all__` maps to exactly one submodule path in
  the new lookup table — a missed or misspelled entry would silently 404 on that import
  (raises `AttributeError` where today it resolves), so this mapping must be built by
  systematically walking the current explicit imports, not hand-typed from memory.

### Step 2 — Update `docs/agents/serializers-organization.md`

In the "Stability of public re-exports" section: keep the guarantee text (same import
paths stay stable, do not change when files move between folders inside `serializers/`),
but reword the mechanism description — it currently says the re-export works via eager
top-level imports; update it to describe the PEP 562 lazy `__getattr__` mechanism instead,
so the doc matches the code. Do not touch the rest of the doc (folder convention, worked
examples) — those are unaffected by this change.

## Files to Change

- `backend/games/serializers/__init__.py` — replace eager imports with PEP 562
  `__getattr__`, keep `__all__`, rewrite docstring.
- `docs/agents/serializers-organization.md` — reword "Stability of public re-exports" to
  describe the lazy-loading mechanism.

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — exercises `games/tests/serializers/**`, which imports via `from games.serializers import X` throughout; this is the primary regression check that lazy loading doesn't break any of the 182 existing call sites.
- `backend`: `poetry run ruff check .` (CI job: `checks`) — lint check on the rewritten `__init__.py`.

## Notes

- No call sites need to change — this is a pure mechanism swap behind an unchanged import
  contract. If any test or view currently relies on `games.serializers.__all__` order or
  on the module having fully loaded all submodules as an import-time side effect (e.g.
  triggering a decorator or registry on import), that would be a hidden behavioral
  dependency on eager loading — worth a quick grep for `import games.serializers` (bare
  module import, not `from ... import X`) before landing, since PEP 562 lazy loading
  changes nothing for named imports but a bare module import followed by no attribute
  access would previously have side-effect-loaded everything and now loads nothing.
- `from games.serializers import *` (wildcard) still works correctly with `__getattr__` +
  `__all__` in Python 3.7+, but each name in `__all__` gets resolved via `__getattr__` at
  that point — no special-casing needed.
- Atomic commits per Contributing guidelines: land Step 1 and Step 2 as separate commits.
