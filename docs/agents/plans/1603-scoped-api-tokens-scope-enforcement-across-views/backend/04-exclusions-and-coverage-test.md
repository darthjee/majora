# Exclusions and URL coverage test

**Exclusions.** Scoped tokens must always get `token_not_allowed` on token management, `account/*`,
`users/*`, `staff/*` and Django `admin/`. Implement this as an explicit exclusion check in the
authentication class (step 03), matched by URL namespace or route prefix from `resolver_match`
(e.g. `route.startswith(('account/', 'users/', 'staff/', 'admin/'))`). Excluding them explicitly,
rather than relying on "undeclared", means a later `@token_scopes` on one of them cannot open it.
Views with `@authentication_classes([])` are left alone.

**Coverage test.** Walk `get_resolver().url_patterns` recursively. For every DRF view callback
(it has `cls`/`view_class` with `APIView`), collect the HTTP methods it serves (`http_method_names`
minus `options`/`head`, or the `@api_view` method list). Assert that each view either:
- declares `@token_scopes` with an entry for every served method;
- is excluded (exclusion prefixes, or `authentication_classes == []`); or
- is on `PENDING_TOKEN_SCOPES`, a temporary module-level set of view names, seeded with every
  currently undeclared view.

Also assert that no `PENDING_TOKEN_SCOPES` entry is declared or no longer exists, so that stale
entries fail too. Add a comment pointing to sub-issues #1630–#1639, and say that the last one
deletes the set. Add per-family excluded-route tests (one representative each for account, users,
staff, token management, admin) asserting 403 `token_not_allowed` with a fully-scoped token.

## Files to Change
- `backend/accounts/authentication.py` — the exclusion prefixes/check (shared with the test).
- `backend/accounts/tests/token_scopes_coverage_test.py` — new: the URL walk and `PENDING_TOKEN_SCOPES`.
- `backend/accounts/tests/api_token_exclusions_test.py` — new: excluded families give 403.
