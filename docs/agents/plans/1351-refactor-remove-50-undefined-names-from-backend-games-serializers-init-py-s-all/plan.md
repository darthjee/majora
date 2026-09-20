# Plan: Refactor: silence false-positive E0603 undefined names in backend/games/serializers/__init__.py's __all__

Issue: [1351-refactor-remove-50-undefined-names-from-backend-games-serializers-init-py-s-all.md](../../issues/1351-refactor-remove-50-undefined-names-from-backend-games-serializers-init-py-s-all.md)

## Overview
Silence Codacy/Pylint's `E0603` (`undefined-all-variable`) false positive on `backend/games/serializers/__init__.py`'s `__all__` with a justified inline suppression, preserving the lazy PEP 562 loading introduced in #1216.

See [backend.md](backend.md) for the full plan.
