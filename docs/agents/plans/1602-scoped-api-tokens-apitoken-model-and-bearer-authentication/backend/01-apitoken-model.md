# ApiToken model and migration

Add `backend/accounts/models/api_token.py`, following the style of `cache_token.py`, and export it
from `accounts/models/__init__.py`.

Fields:

- `owner`: `ForeignKey(User, on_delete=CASCADE, related_name='api_tokens')`.
- `name`: `CharField` (user label).
- `hashed_secret`: `CharField(max_length=64)`, SHA-256 hex digest of the secret part only.
- `prefix`: `CharField(max_length=8, unique=True, db_index=True)`.
- `scopes`: `JSONField(default=list)`. No catalogue validation here (#1603 / token API).
- `games`: `ManyToManyField('games.Game', blank=True, related_name='api_tokens')`; empty means
  every game the owner can reach.
- `expires_at`: `DateTimeField(null=True, blank=True)`.
- `last_used_at`: `DateTimeField(null=True, blank=True)`.
- `created_at`: `DateTimeField(auto_now_add=True)`.

No `revoked_at`. Add `__str__` (owner + prefix, never the hash) and an `is_expired` helper.
Generate the migration with `makemigrations` via docker-compose. Do not register it in the admin.

Add model tests in `backend/accounts/tests/models/api_token_test.py` (defaults, M2M optional,
`is_expired` with past/future/null expiry, prefix uniqueness).

## Files to Change

- `backend/accounts/models/api_token.py` — new model.
- `backend/accounts/models/__init__.py` — export `ApiToken`.
- `backend/accounts/migrations/0010_apitoken.py` — new migration.
- `backend/accounts/tests/models/api_token_test.py` — model tests.
