# Store and validate requested scopes

Add the requested scopes to `AuthorizationRequest` and validate them on the unauthenticated
create endpoint.

- **Model:** `scopes = models.JSONField(default=list, blank=True)`. Add a `scopes` parameter
  (default empty) to `AuthorizationRequest.create_with_token` and a small
  `is_scoped()`/`has_scopes` helper returning whether the list is non-empty.
- **Migrations:** the `accounts` migration plus the `versioning` migration for the historical
  model, generated through docker-compose.
- **Validation** (`users/authorization_requests.json`, `create.py`): a small serializer (e.g.
  `AuthorizationRequestScopesSerializer` under `backend/accounts/serializers/authorization_request/`)
  for the optional `scopes` field:
  - missing or `[]` → no scopes (today's behaviour);
  - must be a list of strings (`ListField(child=CharField(max_length=SCOPE_MAX_LENGTH),
    max_length=len(SCOPES), required=False, allow_empty=True)`);
  - unknown value → `invalid_scope`; duplicate → `duplicate_scope` (reuse `error()` and
    `has_duplicates()` from the token create serializer);
  - any failure → `400 {"errors": {"scopes": [...]}}`, wrapped in `skip_cache`.
  - Validation runs before the user lookup, and the response shape for valid input stays the
    same whether the identifier matches a user or not (enumeration safety). Staff-only scopes
    are **not** checked here (the requester is anonymous); that happens at approval.
- Keep the existing `missing_identifier` `422` as is.

Tests (`backend/accounts/tests/authorization_requests/create_test.py`, plus model tests): valid
scopes stored; no `scopes` and `[]` stored as `[]`; unknown, duplicate, too many entries,
non-list and non-string entries give `400` with the right codes and create no row.

## Files to Change

- `backend/accounts/models/authorization_request.py` — `scopes` field, `create_with_token`
  parameter, scoped helper.
- `backend/accounts/migrations/0012_*.py` — new field.
- `backend/versioning/migrations/*` — historical model field.
- `backend/accounts/serializers/authorization_request/` — scopes validation serializer (+ export
  in `__init__.py`).
- `backend/accounts/views/authorization_requests/create.py` — validate and pass the scopes.
- `backend/accounts/tests/authorization_requests/create_test.py`,
  `backend/accounts/tests/authorization_request/` — tests.
