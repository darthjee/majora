# Backend Plan: Add staff user routes

Main plan: [plan.md](plan.md)

## Shared contracts

- `source/games/views/auth/status.py`'s `_build_payload` must add `'is_staff': user.is_staff`
  to the returned dict, alongside the existing `is_superuser` key.
- Produce exactly the four endpoints and payload shapes documented in `plan.md`'s "Shared
  contracts" section — the frontend agent builds its clients directly against those.
- `name` in all request/response payloads maps to Django's `User.username` (there is no
  separate name field).

## Implementation Steps

### Step 1 — Expose `is_staff` in the status payload

Edit `source/games/views/auth/status.py`: add `'is_staff': user.is_staff` to `_build_payload`.
Update/add a case in `source/games/tests/views/auth/status_test.py` (or wherever the existing
status tests live) asserting the new field for both `is_staff=True` and `is_staff=False` users.

### Step 2 — Add a shared "staff or superuser" gate helper

In `source/games/views/common.py`, add a helper alongside `require_authenticated`, e.g.:

```python
def require_staff(request):
    """Return a 401/403 Response if `request.user` may not access staff endpoints, else None."""
    error_response = require_authenticated(request)
    if error_response:
        return error_response
    if not (request.user.is_staff or request.user.is_superuser):
        return Response({'errors': {'detail': ['not allowed']}}, status=403)
    return None
```

This mirrors the existing `require_authenticated`/`_forbidden_response` conventions used by
`treasures_list.py` and `permissions.py`. Do not reuse `_EditPermission`/`detail_or_update` as-is
— those depend on `obj.can_be_edited_by(user)`, which doesn't apply to plain Django `User`
rows; the staff gate is a flat role check, not per-object ownership.

### Step 3 — Add a token reuse-or-create helper

In `source/games/views/password_reset/_shared.py`, add a new function that reuses an existing
valid token or creates one, **without** sending email, and expose the URL builder for reuse:

```python
def get_or_create_recovery_token(user):
    """Return a valid existing token's value for `user`, or create and return a new one."""
    existing = (
        PasswordResetToken.objects.filter(user=user).order_by('-created_at').first()
    )
    if existing is not None and existing.is_valid():
        return existing.token

    token = secrets.token_urlsafe(32)
    PasswordResetToken.objects.create(user=user, token=token)
    return token
```

Rename `_build_recovery_url` to a public `build_recovery_url` (or add a thin public wrapper) so
the new staff view can build the same URL shape without duplicating
`f'{settings.FRONTEND_BASE_URL}/#/recover-password?token={token}'`. Update the existing
call site in the same module accordingly.

### Step 4 — Add serializers

Add three new files under `source/games/serializers/`, following `treasure_list.py` /
`treasure_detail.py` / `treasure_update.py`'s exact shape:

- `staff_user_list.py` — `StaffUserListSerializer(serializers.ModelSerializer)`, `Meta.model =
  django.contrib.auth.models.User`, fields exposed as `id`, `name` (`source='username'`),
  `email`.
- `staff_user_detail.py` — `StaffUserDetailSerializer`, same fields as list.
- `staff_user_update.py` — `StaffUserUpdateSerializer`, fields `name` (`source='username'`)
  and `email`, both `required: False` (partial update, matching `TreasureUpdateSerializer`'s
  `extra_kwargs` pattern). Add `validate_name` and `validate_email` methods that reject values
  already used by a **different** `User` row (mirror `_validate_unique_name` /
  `_validate_unique_email` from `source/games/views/auth/_shared.py`, but scoped with
  `.exclude(pk=self.instance.pk)` since this is an update, not a create).

Register all three in `source/games/serializers/__init__.py`'s imports and `__all__`, in
alphabetical position like the existing entries.

### Step 5 — Add views

New package `source/games/views/staff/` (mirrors `views/treasures/` and `views/game_masters/`
structure):

- `__init__.py` — exports `staff_users_list`, `staff_user_detail`, `staff_user_recovery_link`.
- `staff_users_list.py` — `@api_view(['GET'])`, `@authentication_classes([CookieTokenAuthentication])`,
  `@permission_classes([AllowAny])` (auth is enforced inline via `require_staff`, same
  convention as `treasures_list`/`game_masters_list`). Calls `require_staff(request)` first;
  if no error, returns `paginated_list_response(request, User.objects.all().order_by('id'),
  StaffUserListSerializer)`.
- `staff_user_detail.py` — `@api_view(['GET', 'PATCH'])`, same auth/permission decorators.
  Looks up `User` by `user_id` (404 via `get_object_or_404`), calls `require_staff(request)`,
  then either serializes with `StaffUserDetailSerializer` (GET) or validates+saves with
  `StaffUserUpdateSerializer` and re-serializes with `StaffUserDetailSerializer` (PATCH) — reuse
  `validated_or_error` from `views/common.py` for the 400 path, matching `_create_treasure`'s
  structure.
- `staff_user_recovery_link.py` — `@api_view(['POST'])`, same auth/permission decorators.
  Looks up `User` by `user_id` (404), calls `require_staff(request)`, then calls
  `get_or_create_recovery_token(user)` (from Step 3) and returns
  `Response({'url': build_recovery_url(token)})`. Must **not** call `send_password_reset_email`
  or any mail-sending path.

Export the three views from `source/games/views/__init__.py` (add a `from .staff import
staff_user_detail, staff_user_recovery_link, staff_users_list` line and the matching `__all__`
entries), following the existing alphabetical-ish grouping in that file.

### Step 6 — Register URLs

In `source/games/urls.py`, add (grouped near the other top-level, non-game-scoped routes such
as `treasures.json`):

```python
path('staff/users.json', views.staff_users_list, name='staff-users-list'),
path('staff/users/<int:user_id>.json', views.staff_user_detail, name='staff-user-detail'),
path(
    'staff/users/<int:user_id>/recovery-link.json',
    views.staff_user_recovery_link,
    name='staff-user-recovery-link',
),
```

### Step 7 — Tests

Add, mirroring `source/games/tests/views/treasures/*` and
`source/games/tests/serializers/test_treasure_*`:

- `tests/views/staff/staff_users_list_test.py` — 401 anonymous, 403 authenticated
  non-staff/non-superuser, 200 for `is_staff=True`, 200 for `is_superuser=True`, pagination
  headers present, correct fields in payload.
- `tests/views/staff/staff_user_detail_test.py` — same auth matrix for GET and PATCH; PATCH
  success updates `username`/`email`; PATCH 400 on duplicate name/email (create a second user
  first); 404 for unknown id.
- `tests/views/staff/staff_user_recovery_link_test.py` — same auth matrix; asserts a fresh
  token is created when none exists; asserts an existing **valid** token is reused (same
  `token` value returned, no new `PasswordResetToken` row created); asserts a new token is
  created when the existing one is expired/used; asserts `len(mail.outbox) == 0` (or equivalent
  mock assertion that `send_mail`/`send_password_reset_email` was never called) to lock in the
  "no email" requirement.
- `tests/serializers/test_staff_user_list.py`, `test_staff_user_detail.py`,
  `test_staff_user_update.py` — field shape and update validation (uniqueness excludes self).
- Extend the existing status endpoint test to cover the new `is_staff` field.

## Files to Change

- `source/games/views/auth/status.py` — add `is_staff` to the status payload.
- `source/games/views/common.py` — add `require_staff` helper.
- `source/games/views/password_reset/_shared.py` — add `get_or_create_recovery_token`, make
  `build_recovery_url` public.
- `source/games/serializers/staff_user_list.py`, `staff_user_detail.py`, `staff_user_update.py`
  — new serializers.
- `source/games/serializers/__init__.py` — register new serializers.
- `source/games/views/staff/__init__.py`, `staff_users_list.py`, `staff_user_detail.py`,
  `staff_user_recovery_link.py` — new views package.
- `source/games/views/__init__.py` — export new views.
- `source/games/urls.py` — register new URL patterns.
- `source/games/tests/views/staff/*`, `source/games/tests/serializers/test_staff_user_*.py`,
  status endpoint test — new/updated tests.

## CI Checks

- `source/`: `docker-compose run majora_be pytest` (CI job: backend tests/coverage).

## Notes

- Do not add a user-creation endpoint or allow editing `is_staff`/`is_superuser`/password
  through these endpoints — explicitly out of scope per the issue.
- Keep the `is_staff or is_superuser` gate identical across all three new endpoints; do not
  special-case superuser separately from staff anywhere in this feature.
- Coordinate with `frontend.md` on the exact JSON field names (`name`, `email`, `url`) — do not
  rename them without updating the frontend plan/implementation.
