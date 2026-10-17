# `@token_scopes` decorator

Add `token_scopes(**methods)` next to `@regular`/`@restricted` in `backend/games/decorators.py`.
Usage: `@token_scopes(GET=[], POST=['documents:write'])`. Each value lists the required scopes, all
of them, and an empty list declares a public read.

- Validate at decoration (import) time: method keys must be HTTP methods, and every scope must be in
  the catalogue. Raise `ValueError` otherwise, so a typo fails at startup, not at request time.
- Store the declaration as an attribute (e.g. `view.token_scopes = {'GET': (), ...}`) on the
  function it decorates, and make sure it is still readable from `request.resolver_match.func`
  whatever order it has with `@api_view`, `@restricted`, `@skip_cache` and `@regular`. `functools.wraps`
  copies `__dict__` only from the inner to the outer function, so either require `@token_scopes`
  to be outermost or add a lookup helper that follows `__wrapped__` / `view_class`. Pick one
  convention, document it in the docstring, and test both a plain `@api_view` view and a
  `@restricted` one.
- Provide `get_token_scopes(func)`, which returns the declaration or `None`.

## Files to Change
- `backend/games/decorators.py` — add `token_scopes` and `get_token_scopes`.
- `backend/games/tests/decorators_test.py` (or the existing decorator test module) — declaration storage, validation errors, and lookup through wrappers.
