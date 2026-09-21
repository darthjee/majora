# Issue: Refactor: remove exec() from serializers_init_test.py and fix the no-effect statement

## Description
Codacy flags two things in `backend/games/tests/serializers/serializers_init_test.py`:
- Line 19: `exec('from games.serializers import *', namespace)  # noqa: S102` — Pylint `W0122` "Use of exec" (Security, High severity). It is also an open item on Codacy's SRM dashboard (InsecureModulesLibraries, due 2026-11-19).
- Line 26: bare expression `serializers.DoesNotExistSerializer` inside `pytest.raises` — Pylint `W0104` "Statement seems to have no effect" (CodeStyle, Info).

## Problem
The `exec` is there to prove that a star import binds every name in `games.serializers.__all__`. The bare attribute access is there to trigger the lazy `__getattr__`'s `AttributeError`. Both are legitimate test intents but trip scanners.

## Expected Behavior
- [ ] No `exec` in the test and no `# noqa: S102`
- [ ] No statement-with-no-effect in the `AttributeError` test
- [ ] Both tests keep asserting the same behavior; the backend test suite and `ruff` still pass
- [ ] Codacy's `W0122` (and SRM item) and `W0104` findings clear for this file

## Solution
- Star-import test: write a small module (`from games.serializers import *`) to `tmp_path`, load it with `importlib.util.spec_from_file_location` / `module_from_spec` / `exec_module`, and assert every name in `__all__` is present in the loaded module.
- AttributeError test: make the statement have an effect by going through `getattr` with the name held in a variable (e.g. `name = 'DoesNotExistSerializer'` then `getattr(serializers, name)`). Avoid `getattr(serializers, 'DoesNotExistSerializer')` with a literal (Ruff `B009`) and a direct `serializers.__getattr__(...)` call (Pylint `C2801` unnecessary-dunder-call), which would just trade one finding for another.

Backend agent owns the change.

## Benefits
- Clears a High-severity Codacy security finding without a suppression comment
- Test intent stays the same

