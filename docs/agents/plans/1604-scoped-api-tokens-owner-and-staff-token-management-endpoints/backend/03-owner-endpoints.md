# Add the owner endpoints

New views under `backend/accounts/views/api_tokens/`, exported from `accounts.views`, and a new `backend/accounts/urls/api_tokens.py` added to `accounts/urls/__init__.py`.

| Method | URL | View / name |
|---|---|---|
| GET, POST | `account/api_tokens.json` | `api_tokens` / `account-api-tokens` |
| GET | `account/api_tokens/options.json` | `api_token_options` / `account-api-token-options` |
| PATCH, DELETE | `account/api_tokens/<int:token_id>.json` | `api_token` / `account-api-token` |

Register `options.json` before the `<int:token_id>` route.

Each view stacks `@restricted` (outermost), `@api_view([...])`, `@parser_classes([JSONParser])` and `@permission_classes([AllowAny])`, then calls `require_session(request)` and then `require_authenticated(request)`. Follow the AllowAny comment used by the recovery-token views.

- **GET list:** `ApiToken.objects.filter(owner=request.user).prefetch_related('games').order_by('-created_at')`, returned as a plain array, with no pagination.
- **POST create:** validate with `validated_or_error`, then call `ApiToken.objects.create_token(owner=request.user, ...)` with the resolved `Game` objects. Return 201 with the item data plus `"token": plain_token`. Let an `IntegrityError` after 3 attempts surface as a 500. Never log the body.
- **GET options:** `{"scopes": sorted(SCOPES), "games": [{slug, name}] sorted by name, "all_games": reaches_all_games(user)}`.
- **PATCH rename:** `get_object_or_404(ApiToken, pk=token_id, owner=request.user)`, validate with the rename serializer, save `name`, and return 200 with the item.
- **DELETE revoke:** the same scoped lookup, `delete()`, then 204.

Tests (per the spec's testing strategy):
- On all 5 method + URL pairs: a scoped token with every scope gets 403 `token_not_allowed`, anonymous, pending and denied users get 401, and a cookie session and a legacy `Token` both succeed.
- Bearer plus session is refused.
- A form-encoded body gives 415.
- Create returns the secret once, and a later list never shows the secret or hash. `owner`, `prefix`, `id` or `last_used_at` give `not_editable`.
- Superuser and plain-staff reachability.
- A prefix collision is retried, and exhaustion gives 500 (mocked).
- PATCH with other fields gives `not_editable` and leaves the row unchanged.
- DELETE gives 204, and a second DELETE gives 404.
- Another user's token id gives 404 on PATCH and DELETE.
- An expired token can be renamed and revoked.
- List is newest first.
- Edge cases: `games: []` covers a game joined later, and an owner who leaves a listed game keeps the token.
- Every response carries `X-Skip-Cache: true`.

## Files to Change
- `backend/accounts/views/api_tokens/__init__.py`, `list_create.py`, `detail.py`, `options.py` — new.
- `backend/accounts/views/__init__.py` — export the views.
- `backend/accounts/urls/api_tokens.py` — new.
- `backend/accounts/urls/__init__.py` — concatenate `api_tokens.urlpatterns`.
- `backend/accounts/tests/api_tokens/` — view tests.
