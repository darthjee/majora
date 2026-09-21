# Plan: Refactor: remove exec() from serializers_init_test.py and fix the no-effect statement

Issue: [1415-refactor-remove-exec-from-serializers-init-test-py-and-fix-the-no-effect-statement.md](../../issues/1415-refactor-remove-exec-from-serializers-init-test-py-and-fix-the-no-effect-statement.md)

## Overview
Replace the `exec(...)  # noqa: S102` in the star-import test with a temp-module load through `importlib.util`, and make the `AttributeError` test's bare attribute access an actual call, so Codacy's `W0122` and `W0104` findings clear without suppressions.

See [backend.md](backend.md) for the full plan.
