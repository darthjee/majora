# Issue: Refactor: silence false-positive E0603 undefined names in backend/games/serializers/__init__.py's __all__

## Description
Codacy's Pylint scan (`E0603`, `undefined-all-variable`, ErrorProne, High severity) flags entries in `backend/games/serializers/__init__.py`'s `__all__` as undefined names — e.g. `BaseAccessSerializer`, `GameCreateSerializer`, `CharacterFullSerializer`. The original report lists 50 (lines 30–79, i.e. the first 50 alphabetically); `__all__` actually holds 117 names, all of which resolve the same way, so the Codacy list is most likely truncated rather than the problem being limited to those 50.

## Problem
Since #1216, the package no longer imports its submodules eagerly. Every public symbol is declared in `__all__` and resolved lazily through a PEP 562 module-level `__getattr__` backed by the `_SUBMODULE_BY_NAME` map. Pylint does not understand module `__getattr__`, so it reports every `__all__` entry as undefined even though each one resolves correctly at runtime (`from games.serializers import X` and `from games.serializers import *` both go through `__getattr__`).

The Codacy finding is therefore a false positive against a deliberate design, not a real runtime bug. The original proposal (import each name explicitly) would undo #1216's goal of not loading every serializer submodule at `import games.serializers` time.

## Expected Behavior
- Codacy/Pylint reports zero `E0603` findings for `backend/games/serializers/__init__.py`, covering all 117 `__all__` names, not just the 50 originally listed.
- The lazy-loading behavior from #1216 is preserved.
- `from games.serializers import *` and `from games.serializers import <Name>` keep working exactly as today.

## Solution
Add a targeted `# pylint: disable=undefined-all-variable` on the `__all__` assignment in `backend/games/serializers/__init__.py`, with a comment explaining that the names are resolved lazily via the module-level `__getattr__` / `_SUBMODULE_BY_NAME` (PEP 562), so Pylint's static check is a false positive. Do not add eager imports or a `TYPE_CHECKING` block (both considered and rejected: eager imports revert #1216; `TYPE_CHECKING` adds a third list to keep in sync).

Backend-only change; no behavior change.

## Acceptance criteria
- [ ] Codacy's Pylint `E0603` finding count for `backend/games/serializers/__init__.py` drops to 0 (all 117 names, not just the 50 listed originally)
- [ ] Submodules are still only imported on first access to a symbol (lazy loading from #1216 preserved)
- [ ] `from games.serializers import *` still resolves every name in `__all__`
- [ ] The suppression carries a comment justifying it

## Benefits
Clears a High-severity false-positive finding without regressing the lazy-loading optimization, and documents why the pattern is safe.
