# Backend Plan: Add authorize login

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section for the full endpoint request/response
shapes — this file must implement them exactly (status codes, payload keys, header names),
including the `.json` suffix correction and the enumeration-safe `POST` behavior.

## Implementation Steps

### Step 1 — `AuthorizationRequest` model

New file `backend/accounts/models/authorization_request.py`, registered in
`backend/accounts/models/__init__.py` (mirror the existing `PasswordResetToken` /
`UserProfile` export pattern).

Fields:
- `id` — default PK, never serialized.
- `uuid` — `models.UUIDField(default=uuid.uuid4, editable=False, unique=True)`.
- `token_hash` — `models.CharField(max_length=128)`. Generate the raw token with
  `secrets.token_urlsafe(32)` (same helper `accounts/views/password_reset/_shared.py`
  already uses for `PasswordResetToken`), but store only a hash of it (e.g.
  `hashlib.sha256(raw_token.encode()).hexdigest()`) — this is a deliberate deviation from
  `PasswordResetToken`'s plaintext storage, since this token is a bearer credential that
  directly yields a login (higher stakes than a password-reset link); note this trade-off
  in a short comment. Compare via `hmac.compare_digest` against the hash of the
  presented token, never a plain `==`.
- `ip` — `models.GenericIPAddressField()`. Reuse whatever extraction the codebase already
  has for capturing a request's client IP (check `backend/statistics/middleware.py`
  first) but confirm before reusing as-is: the security review flagged that middleware's
  `X-Forwarded-For`-preferred extraction as spoofable, which is an accepted risk for
  analytics but not for a value a human uses to decide whether to grant a login. If
  there's no trusted-proxy-count validation available, use `REMOTE_ADDR` directly here
  instead (simpler and not spoofable by the client), even if that's less accurate behind
  a proxy — flag the trade-off in a comment rather than silently reusing the analytics
  helper.
- `browser` — `models.CharField(max_length=255, blank=True)`, from the request's
  `User-Agent` header.
- `created_at` — `models.DateTimeField(auto_now_add=True)`.
- `updated_at` — `models.DateTimeField(auto_now=True)`.
- `user` — `models.ForeignKey(User, on_delete=models.CASCADE, null=True,
  related_name='authorization_requests')`. Nullable: an unknown-username request (see
  Step 3) is still created for enumeration-safety but has no matching user, so it must be
  storable without one; never serialized directly (only used server-side).
- `expires_at` — `models.DateTimeField()`, set to `created_at + timedelta(hours=1)` at
  creation (compute directly rather than relying on `auto_now_add` ordering).
- `status` — `models.CharField(max_length=16, choices=..., default='open')` with values
  `open`, `approved`, `denied`, `expired`, `logged`.
- `class Meta: ordering = ['-id']` (required for stable pagination per
  `docs/agents/pagination.md`; newest-first, equivalent to `-created_at` given
  auto-increment PKs).
- `history = HistoricalRecords(app='versioning', user_db_constraint=False)` — same
  pattern as `backend/games/models/link.py`. Add the `versioning` app migration this
  generates under `versioning/migrations/`.

Helper methods on the model (keep endpoint views thin):
- `is_expired()` — lazy check (`timezone.now() > self.expires_at`), used by every
  endpoint below, not just `authorize` (the issue only described expiration-checking in
  the `authorize` PATCH; the review flagged this as needed everywhere the status is
  read/mutated).
- A method/manager helper that performs the atomic `approved → logged` transition
  (`AuthorizationRequest.objects.filter(pk=self.pk, status='approved').update(status='logged')`
  and check the returned row count) so `GET .../uuid.json` can tell whether it won the
  race.

### Step 2 — Views: `accounts/views/authorization_requests/`

New sub-package (mirrors the existing `views/password_reset/` grouping), with a shared
`_shared.py` for the by-uuid lookup + lazy-expiration helper used by all four
uuid-addressed endpoints, plus one file per endpoint:

- `create.py` — `POST /users/authorization_requests.json`, `@permission_classes([AllowAny])`
  with a comment noting it's intentionally pre-login. Looks up the user by username;
  creates the `AuthorizationRequest` either way (with or without `user`); returns the same
  `201` shape regardless (see plan.md contract). Apply rate limiting here (check whether
  DRF throttling classes are already configured anywhere in the project via
  `grep -rn throttle backend/`; if none exist yet, add a minimal
  `AnonRateThrottle`-based scope for just this view rather than a project-wide default).
- `poll.py` — `GET /users/authorization_requests/<uuid:uuid>.json`,
  `@permission_classes([AllowAny])` with a comment. Validates the `X-Authorize-Token`
  header via `hmac.compare_digest` against the hash. Implements the `403` / `200` / `202`
  (atomic transition + login token issuance, reusing the same `Token.objects.get_or_create`
  + `request.session['auth_token']` + `_attach_statistics_session` pattern as
  `accounts/views/auth/login.py`, so a device that logs in this way behaves identically
  to a normal login afterwards) / `422` (lazy expiry) cases.
- `list.py` — `GET /account/authorization_requests.json`, `@permission_classes([IsAuthenticated])`.
  Filters `AuthorizationRequest.objects.filter(user=request.user)`, applies
  `games.paginator.Paginator` (already a cross-app dependency, see
  `docs/agents/architecture.md`'s note that `accounts` depends on `games.settings.Settings`
  — same pattern applies here), serializes via a new list serializer (Step 3).
- `deny.py` — `PATCH /account/authorization_requests/<uuid:uuid>/deny.json`,
  `@permission_classes([IsAuthenticated])`. Ownership check (`403` if
  `authorization_request.user_id != request.user.id`), `422` if not `open`
  (`is_expired()` checked first and persisted as `expired` before the not-open check, so
  the error reported is accurate), else sets `denied`, returns `202`.
- `authorize.py` — `PATCH /account/authorization_requests/<uuid:uuid>/authorize.json`,
  `@permission_classes([IsAuthenticated])`. Same ownership/expiry/`422` handling as
  `deny.py`, plus password re-verification (`request.user.check_password(...)`,
  `401` on mismatch — see plan.md contract), else sets `approved`, returns `202`.

None of these use `@csrf_exempt` — follow the same (unexempted) convention every other
`accounts` view already uses; no special CSRF handling is needed beyond that.

Register all five in `backend/accounts/urls.py`, and export the five view functions from
`backend/accounts/views/__init__.py` (mirror the existing `__all__` list style).

### Step 3 — Serializers

New `backend/accounts/serializers/authorization_request/` (mirror
`serializers/auth/` naming): a single `AuthorizationRequestListSerializer` used by both
`list.py` (list) — exposing `uuid`, `created_at`, `status`, `ip`, `browser` only (never
`id`, `token_hash`, `user`). The `create`/`poll` endpoints build their small response
dicts directly (no serializer needed — the fields returned don't match the model 1:1,
e.g. `token`/`expiration` on create).

### Step 4 — Migration

Run `poetry run python manage.py makemigrations accounts versioning` to generate the new
model's migration (and the paired `HistoricalAuthorizationRequest` migration under
`versioning/migrations/`, consistent with how `Link`/`BasePhoto`'s history tables are
routed there).

### Step 5 — Tests

Mirror the existing `backend/accounts/tests/auth/login_test.py` /
`tests/password_reset/*_test.py` structure. New `backend/accounts/tests/authorization_requests/`
covering, at minimum, one test per status code branch listed in the Shared Contracts
section for each of the 5 endpoints, plus:
- The `approved → logged` transition is exercised concurrently (two near-simultaneous
  polls after approval) and only one receives the `202` + token — the other gets the
  `403 logged` response.
- Lazy expiration is honored by every one of the 4 uuid-addressed endpoints, not just
  `authorize`.
- The unknown-username `POST` returns the exact same status/shape as the real-user case.
- `token_hash` is genuinely hashed (a raw captured token string never matches
  `AuthorizationRequest.objects.get(...).token_hash` via plain equality).
- A regression test that the list/detail responses never include `id`, `token_hash`, or
  `user`/`user_id` (same spirit as the update-serializer regression tests referenced in
  `docs/agents/security-guidelines.md` §8, applied here to a read serializer instead).

## Files to Change

- `backend/accounts/models/authorization_request.py` — new model.
- `backend/accounts/models/__init__.py` — export it.
- `backend/accounts/views/authorization_requests/{_shared,create,poll,list,deny,authorize}.py` — new views.
- `backend/accounts/views/__init__.py` — export the 5 new view functions.
- `backend/accounts/serializers/authorization_request/list.py` — new serializer.
- `backend/accounts/urls.py` — register the 5 new routes.
- `backend/accounts/migrations/000X_authorizationrequest.py` — new migration (generated).
- `backend/versioning/migrations/000X_historicalauthorizationrequest.py` — new migration (generated).
- `backend/accounts/tests/authorization_requests/*_test.py` — new tests.

## CI Checks

- `backend`: `poetry run pytest accounts/ --cov` (CI job: `pytest_all`, which runs
  everything under `--ignore=games/tests/views/`, covering `accounts/`).
- `backend`: `poetry run ruff check .` (CI job: `checks`).

## Notes

- The security review (folded into the issue's Solution section) is the source for most
  of the non-obvious requirements above (hashed token, atomic transition, lazy expiration
  everywhere, enumeration-safe create response, rate limiting, explicit permission
  classes). Re-read `docs/agents/issues/701-add-authorize-login.md` alongside this file.
- Before merging, this touches new endpoints + authentication logic + a new entity, so the
  `security`, `data-access`, and `product-owner` read-only review agents should all be
  consulted per their own trigger criteria (new endpoints / auth logic / new entity) —
  this is the normal review step, not a new requirement introduced by this plan.
- Password re-verification on `authorize.json`'s `401` case isn't explicitly specified in
  the issue (only `403`/`422` are); flagged above as the chosen convention (mirroring
  `login.py`), open to a different code if the product/security reviewers prefer.
- No throttling infrastructure currently exists in this codebase (per exploration) — Step
  2 calls out adding a minimal scoped throttle for the two pre-login endpoints rather than
  a broader change; if a project-wide throttling story already exists elsewhere by the
  time this is implemented, prefer that over a bespoke one.
