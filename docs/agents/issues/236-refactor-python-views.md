# Issue: Refactor python views

## Description
Views under `source/games/views/` are organized as one module per resource type (e.g. `characters.py`, `treasures.py`, `auth.py`), but each module still groups multiple view functions together — `characters.py` alone holds 10 view functions across 165 lines. This refactor breaks every view module down to one file per view/route, extracts duplicated logic into shared helpers, and splits any oversized view functions into smaller methods.

## Problem
Across `source/games/views/`, several patterns repeat in slightly different shapes in nearly every module:
- Auth checks (`if not request.user or not request.user.is_authenticated`)
- Permission checks (`error_response = *Permission.check(request, obj)` followed by a conditional return)
- Queryset lookups (`.filter(...).first()`)
- Serializer validation (`if not serializer.is_valid(): return Response(...)`)
- Pagination (`Paginator(request, queryset).paginate()`)
- Error response shapes are inconsistent across views (mix of `{'error': ...}`, `{'errors': ...}`, and `{'errors': {'detail': [...]}}`)

Grouping multiple views per file, combined with this duplication, makes each file harder to navigate and increases the chance that a fix applied to one view's copy of a pattern is missed in another. The matching test files under `source/games/tests/views/` mirror this grouping (e.g. `characters_test.py` is 1337 lines), so the same navigation problem exists on the test side.

## Expected Behavior
- Every view/route lives in its own file, and its corresponding test file is split to match (one test file per view/route).
- Common logic (auth checks, permission checks, queryset lookups, serializer validation, pagination, etc.) is extracted so each view file expresses only its own logic, not a repeated copy of shared logic.
- Oversized view functions are broken into smaller, well-named methods.
- No behavior changes: existing tests continue to pass (after being split/reorganized to match the new file layout), and error response shapes are not altered as part of this issue (that inconsistency may be tracked separately).

## Solution
Apply this across all view modules in `source/games/views/` (not just one app), mirroring the same split in `source/games/tests/views/`:
1. Split each view module into one file per view/route (e.g. `characters.py`'s 10 functions become 10 files, likely under a `characters/` package), and split the matching test module the same way (e.g. `characters_test.py` becomes 10 test files under a `characters/` package).
2. Identify and extract common code (auth checks, permission checks, queryset patterns, serializer validation, pagination) into shared helpers/mixins — the exact shape of this extraction is left to whoever implements the plan, since the right abstraction may only become clear while doing the split.
3. Break down any view functions that are still large after extraction into smaller private methods.
4. Keep `source/games/views/__init__.py` (or equivalent) exporting the same names so URL routing is unaffected.
5. This is a pure refactor: no behavior change. Tests must keep passing (as reorganized files), without changes to what they assert.

## Benefits
- Easier to locate and modify a single view (and its test) without scanning past unrelated views/tests in the same file.
- Less duplicated logic means fixes and changes to shared behavior (auth, permissions, pagination) only need to happen in one place.
- Smaller, focused files and methods are easier to review and test.

---

Tags: :shipit:
