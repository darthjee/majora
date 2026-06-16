# Split Django Views

## Context

All endpoints in `source/games/views.py` are defined in a single file, making the codebase harder to maintain and navigate as the number of views grows.

## What needs to be done

- **Backend:** Split `source/games/views.py` into multiple files under `source/games/views/`, with one file per endpoint (or logical grouping). Ensure the package is properly initialized so all views remain importable.

## Acceptance criteria

- [ ] `source/games/views.py` is replaced by a `source/games/views/` package
- [ ] Each endpoint (or closely related group) lives in its own file inside that package
- [ ] All existing imports and URL routing continue to work without changes
- [ ] Tests pass after the refactor
