# Add the token serializers

Add a new `backend/accounts/serializers/api_token/` package, exported from `accounts.serializers`.

- **`ApiTokenItemSerializer`** (read only), shared by the owner list, the staff list and the rename response. Fields: `id`, `name`, `prefix`, `scopes` (sorted), `games` (`[{slug, name}]`), `expires_at` (null for never), `last_used_at`, `created_at`, `status` (`active` / `expired` from `is_expired()`, like `StaffRecoveryTokenSerializer.status`). Never `hashed_secret`.
- **`ApiTokenCreateSerializer`**, with the request user in its context:
  - `name`: `CharField(max_length=100, trim_whitespace=True)`, giving the DRF `required` / `blank` / `max_length` codes.
  - `scopes`: required, non-empty list (`empty`). Each entry must be in `SCOPES` (`invalid_scope`), with no duplicates (`duplicate_scope`).
  - `games`: optional list of slugs, default `[]`. Duplicates give `duplicate_game`. Any slug not in `reachable_games(user)`, unknown or unreachable, gives the single `game_not_reachable` code.
  - `expires_at`: optional, nullable `DateTimeField`. It must be strictly after `timezone.now()` (`expires_in_past`). Unparseable input gives `invalid`. Missing means null.
  - Any other key in `initial_data` gives `{"<field>": ["not_editable"]}`. Report it together with the other field errors in one 400, raising `ValidationError` with error codes so `_error_codes` keeps the shape.
- **`ApiTokenRenameSerializer`**: `name` with the same rules. Any other key gives `not_editable`, keyed by that field.

Tests cover every code in the spec's 400 table, trimming, several bad fields reported together, the `expires_at` "now" boundary, and missing vs `null` expiry.

## Files to Change

- `backend/accounts/serializers/api_token/__init__.py`, `item.py`, `create.py`, `rename.py` — new.
- `backend/accounts/serializers/__init__.py` — export them.
- `backend/accounts/tests/serializers/api_token/` — new serializer tests.
