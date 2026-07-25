# Backend Plan: Block new users

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section — this agent produces all of it: the `UserProfile.status` field, the extended `/users/status.json` payload, the extended `/staff/users.json` list, and the new `/staff/users/approve.json` / `/staff/users/deny.json` endpoints.

## Implementation Steps

### Step 1 — Add `status` to `UserProfile`

In `backend/accounts/models/user_profile.py`, add status constants/choices mirroring `AuthorizationRequest`'s `STATUS_*` pattern (`backend/accounts/models/authorization_request.py:28-40`):

```python
STATUS_PENDING = 'pending'
STATUS_APPROVED = 'approved'
STATUS_DENIED = 'denied'
STATUS_CHOICES = [
    (STATUS_PENDING, 'Pending'),
    (STATUS_APPROVED, 'Approved'),
    (STATUS_DENIED, 'Denied'),
]
status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
```

### Step 2 — Migration

`UserProfile`'s migrations live under `backend/games/migrations/` despite the model file living in `accounts/models/` (`db_table = 'games_userprofile'`; see the existing `backend/games/migrations/0062_backfill_userprofile_display_name.py` for the same split). Write:

1. A schema migration adding the `status` field (default `'pending'`).
2. A data migration that, using the historical model (standard `migrations.RunPython`):
   - Sets `status='approved'` on every `UserProfile` row that already exists at migration time, so no current user (including staff/admins) loses access.
   - Also creates a `UserProfile(status='approved')` for any `User` that doesn't have one yet at all (mirrors migration `0062`'s `get_or_create` pattern) — covers accounts created outside the register flow (e.g. `manage.py createsuperuser`) that would otherwise only get a profile lazily created later with the new `pending` default, permanently locking them out. See Notes for the same gap in runtime `get_or_create` call sites.

### Step 3 — Register marks new users `pending`

No code change needed: `_create_registered_user` (`backend/accounts/views/auth/_shared.py:110-119`) calls `UserProfile.objects.create(user=user, display_name=...)` with no explicit `status`, so it already inherits the new field's `pending` default.

### Step 4 — Gate login on `denied`

In `backend/accounts/views/auth/login.py`, after `authenticate()` succeeds and before issuing a token, look up the user's profile status (use `UserProfile.objects.get_or_create(user=user)`, same defensive pattern as `status.py:44`) and return `403 {'error': 'denied'}` if `status == UserProfile.STATUS_DENIED`. Leave `pending` and `approved` users going through the existing flow unchanged — a `pending` user must still receive a token here (see Step 6 for how the permission layer still treats them as logged out).

### Step 5 — Gate password recovery on `denied`

In `backend/accounts/views/password_reset/recover.py`, when `User.objects.filter(email=email).first()` finds a match, check its profile status; if `denied`, return `403` instead of calling `_create_and_send_reset_token`/returning `{'sent': True}`. When no user matches, or the user is `pending`/`approved`, keep today's behavior unchanged.

Note: this endpoint is deliberately enumeration-safe today (same `{'sent': True}` response whether or not the email matches). Returning a distinct 403 only for denied *known* emails narrows that safety a little — flagged in Notes; the issue explicitly asks for it so implement as specified unless the security agent flags it as unacceptable during review.

### Step 6 — Central "not approved = not logged in" gate

Add the actual approval check in exactly two places, so every other view built on top of them needs no change:

1. `backend/accounts/authentication.py`'s `CookieTokenAuthentication.authenticate` — after resolving `(user, token)` via header or session, check the user's profile status and return `None` (i.e. "unauthenticated") instead of the tuple when it isn't `approved`. This makes `require_authenticated`/`require_staff` (`backend/games/views/common.py:13-27`) and every `IsAuthenticated`-permissioned view that uses this authentication class treat `pending`/`denied` users as anonymous automatically.
2. `backend/accounts/views/auth/status.py` — it authenticates independently (raw `TokenAuthentication()` in `_resolve_authentication`, plus `_authenticate_from_session` in `_shared.py:122-136`), not through `CookieTokenAuthentication`. Apply the same status check there too, but instead of just returning "unauthenticated", implement the three-way payload from the shared contract: `approved` → today's full payload, `pending` → `{'logged_in': False, 'status': 'pending'}`, `denied`/no auth → `{'logged_in': False}`.

### Step 7 — Gate the authorization-request login handoff on `denied`

`backend/accounts/views/authorization_requests/create.py` is intentionally enumeration-safe (a request is created with `user=None` for an unknown username, indistinguishable from a real one) — do **not** add a denied-check there, it would leak which usernames are denied vs. unknown.

Instead, gate credential issuance itself in `backend/accounts/views/authorization_requests/poll.py`'s `_resolve_approved`/`_issue_login_credentials` (poll.py:60-78): if `authorization_request.user`'s profile status is `denied`, return the same `403 NOT_FOUND_ERROR` shape already used for consumed/invalid requests (poll.py:37-41) instead of issuing a token — keeps the enumeration-safety invariant while still satisfying "denied users can't get in via authorization requests."

### Step 8 — Token destruction on deny

Wherever the new deny view lives (Step 9), destroy every token for the user: `Token.objects.filter(user=user).delete()`.

### Step 9 — New staff endpoints

The staff user-management views live in the `games` app, not `accounts` (`backend/games/views/staff/staff_users_list.py`, `staff_user_detail.py`), using the shared `require_staff` helper (`backend/games/views/common.py:20-27`). Follow that placement and pattern, not the `IsAuthenticated`-based `AuthorizationRequest` approve/deny views (those are self-service, not staff-only).

1. Add `backend/games/views/staff/staff_user_approve.py` and `staff_user_deny.py` (or a shared module — your call), each:
   - `@api_view(['POST'])`, `authentication_classes([CookieTokenAuthentication])`, `permission_classes([AllowAny])`, calling `require_staff(request)` first — identical shape to `staff_users_list.py:13-22`.
   - Read `user_id` from `request.data`, look up the `User` (404 if missing).
   - `approve`: 422 `{'errors': {...}}` if `profile.status != PENDING`; else set `status = APPROVED`, save, return 200 with the updated user serialized like a `/staff/users.json` row.
   - `deny`: no status precondition; set `status = DENIED`, save, delete the user's tokens (Step 8), return 200 with the updated user serialized the same way.
2. Register both in `backend/games/urls/staff.py`, alongside the existing `staff/users...` patterns:
   ```python
   path('staff/users/approve.json', views.staff_user_approve, name='staff-user-approve'),
   path('staff/users/deny.json', views.staff_user_deny, name='staff-user-deny'),
   ```
   (add before or after the `<int:user_id>.json` detail route — order doesn't matter here since these are literal, non-overlapping path segments.)
3. Export the two new views from `backend/games/views/staff/__init__.py` (or wherever `staff_users_list`/`staff_user_detail` are currently exported from) so `..views` resolves them in `urls/staff.py`.

### Step 10 — Extend the `/staff/users.json` list: status, display_name, filters

1. `backend/games/serializers/staff/staff_user_list.py`: add `status` (source `profile.status`) and `display_name` (source `profile.display_name`) fields to `StaffUserListSerializer`. Since every `User` should now have a profile (Step 2 backfills this), a direct `source='profile.status'`/`source='profile.display_name'` is fine; guard defensively only if you find a realistic path that still leaves a `User` without a profile.
2. `backend/games/views/staff/staff_users_list.py`: add `.select_related('profile')` to the queryset (needed for the new serializer fields and the new filters), and apply the two new query params before pagination, following `game_polls_list.py`'s `status` pattern (`backend/games/views/polls/game_polls_list.py:35-44`) and `_filter_by_character_name`'s `icontains` pattern (`backend/games/views/game/_shared.py:49-54`):
   - `status` query param → `queryset.filter(profile__status=status)` when present.
   - `search` query param → `queryset.filter(Q(username__icontains=search) | Q(profile__display_name__icontains=search) | Q(email__icontains=search))` when present.

## Files to Change

- `backend/accounts/models/user_profile.py` — add `status` field + choices.
- `backend/games/migrations/<new>.py` (x2: schema + data) — add column, backfill existing/profile-less users to `approved`.
- `backend/accounts/views/auth/login.py` — 403 on `denied`.
- `backend/accounts/views/password_reset/recover.py` — 403 on `denied`.
- `backend/accounts/authentication.py` — `CookieTokenAuthentication.authenticate` treats non-`approved` as unauthenticated.
- `backend/accounts/views/auth/status.py` — three-way `logged_in`/`status` payload.
- `backend/accounts/views/authorization_requests/poll.py` — deny credential issuance for `denied` users.
- `backend/games/views/staff/staff_user_approve.py`, `staff_user_deny.py` (new) — the two new endpoints.
- `backend/games/views/staff/__init__.py` — export the new views.
- `backend/games/urls/staff.py` — register the two new routes.
- `backend/games/serializers/staff/staff_user_list.py` — add `status`, `display_name`.
- `backend/games/views/staff/staff_users_list.py` — `select_related('profile')` + `status`/`search` filters.
- Tests alongside every file above, per this repo's existing per-view/per-model test layout (e.g. `backend/accounts/tests/views/auth/login_test.py`, `backend/games/tests/views/staff/...`).

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views_characters`, `pytest_views_rest`, `pytest_all` — this issue's changed files fall under `pytest_views_rest`/`pytest_all` depending on final module paths)

## Notes

- The `recover.py` enumeration-safety trade-off (Step 5) is a deliberate spec choice from the issue, not an oversight — confirm during review that a security pass is comfortable with it rather than "fixing" it away.
- `reset_password.py` (completing a recovery) and `authorization_requests/create.py`/`authorize.py`/`deny.py`/`list.py` were deliberately left unchanged beyond Step 7 — `reset_password` never issues a token itself (login.py's gate already blocks a denied user from using the resulting password), and `authorize`/`deny`/`list` operate on requests already scoped to `request.user` via `IsAuthenticated`, which Step 6's central gate already covers.
- Other pre-existing `UserProfile.objects.get_or_create(...)` call sites (`accounts/serializers/auth/my_account_detail.py:34`, `my_account_update.py:82`, `accounts/views/auth/language.py:15`, `games/serializers/games/sessions/messages/session_message_user.py:27`, `games/serializers/games/players/player_user.py:26`) all fire only for users who can already reach an authenticated endpoint, so by Step 6 they're already known-`approved` — no change needed there, but worth a second look during implementation in case any of them can run for a user who hasn't gone through Step 2's backfill or Step 3's explicit creation.
