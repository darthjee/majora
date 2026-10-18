# Add require_session and the reachable-games helper

Two small building blocks used by every later step.

- **`require_session(request)`** in `backend/games/views/common.py`, next to `require_staff`. It returns `Response({'errors': {'detail': ['token_not_allowed']}}, status=403)` when `isinstance(request.auth, ApiToken)`, else `None`. It never rejects a legacy DRF `Token` or a cookie session. Import `ApiToken` lazily or from `accounts.models` without creating a cycle.
- **`reachable_games(user)`** in a new `backend/accounts/api_tokens.py`. It returns a `Game` queryset: every game for `user.is_superuser`, otherwise `Game.objects.filter(players__user=user).distinct()`. Add a sibling `reaches_all_games(user)` (true for superusers), used by `options.json`'s `all_games`.

Tests:

- `require_session` with `request.auth` forced to an `ApiToken` gives 403 `token_not_allowed`. A `Token` or `None` gives `None`.
- `reachable_games`: DM, plain player and PC owner see their game. A non-member does not. A superuser sees every game. A plain staff non-member does not.

## Files to Change

- `backend/games/views/common.py` — add `require_session`.
- `backend/accounts/api_tokens.py` — new: `reachable_games`, `reaches_all_games`.
- `backend/games/tests/views/common_test.py` (or the existing common-helpers test module) — `require_session` tests.
- `backend/accounts/tests/api_tokens/reachable_games_test.py` — new.
