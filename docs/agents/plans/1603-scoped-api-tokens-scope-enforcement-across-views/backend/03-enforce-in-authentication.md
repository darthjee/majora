# Enforce scopes and games in `ApiTokenAuthentication`

Replace the interim `_check_scopes` body:

1. If the resolved view is on the exclusion list (step 04), raise `token_not_allowed`.
2. Read the declaration with `get_token_scopes(request.resolver_match.func)`. If it is missing, or
   has no entry for `request.method`, raise `token_not_allowed`. Decide how to treat
   `HEAD`/`OPTIONS` (follow `GET` for `HEAD`; `OPTIONS` falls back to fail-closed unless declared)
   and record the choice in the docstring.
3. If the required scopes are not all in `effective_scopes(api_token)`, raise `scope_missing`.
4. If the token has games and `resolver_match.kwargs` has a `game_slug` that is not among the
   token's game slugs, raise `game_not_allowed`. Do no other object lookups, and fetch only the
   token's slugs (`values_list`).

Add `ScopeMissing` and `GameNotAllowed` exception classes next to `ApiTokenNotAllowed`, all 403.
To render them as `{"errors": {"detail": ["<code>"]}}`, add a project exception handler
(`REST_FRAMEWORK['EXCEPTION_HANDLER']`) that rewrites only these three token exceptions and
delegates everything else to DRF's default. The 401 `token_invalid` body must stay unchanged
(`tokens.md`). There must be no 404 masking.

The owner-role intersection needs no extra code: authentication returns the owner as
`request.user`, and the view's own permission checks still run.

Tests (in `api_token_authentication_test.py`, using small test-only views registered via
`urlpatterns` overrides or `RequestFactory` with a fake `resolver_match`):
- declared public read with no scopes → allowed;
- missing scope → 403 `scope_missing`; all scopes present → allowed;
- undeclared view and undeclared method → 403 `token_not_allowed`;
- game not on the list → 403 `game_not_allowed`; empty list → any game; a view without `game_slug` → scopes only;
- unknown stored scope grants nothing;
- intersection: a token with `write` whose owner lacks the role still gets the view's own denial;
- error body shape for each code, and `token_invalid` unchanged;
- session and legacy-token requests unaffected (keep the existing tests).

Remove or rewrite `test_valid_token_is_refused_interim`.

## Files to Change
- `backend/accounts/authentication.py` — new exception classes; real `_check_scopes`.
- `backend/common/exception_handler.py` (new) and `backend/majora_project/settings.py` — the error body for token 403s.
- `backend/accounts/tests/api_token_authentication_test.py` — the cases above.
