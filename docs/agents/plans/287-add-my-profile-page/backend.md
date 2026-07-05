# Backend Plan: Add my profile page

Main plan: [plan.md](plan.md)

## Shared contracts

- Produce `GET`/`PATCH /users/account.json`, view name `users-account`, always operating on
  `request.user` — no user id is ever accepted.
  - `GET` → `200` with `{"name": <username>, "email": <email>}`.
  - `PATCH` body `{"name", "email", "password"?, "password_confirmation"?}` → `200` with the
    same shape as `GET` on success; `400` with `{"errors": {...}}` on validation failure (per
    the existing `validated_or_error` convention); `401` when unauthenticated.
  - `name`/`email` required on every `PATCH`; both must stay unique across users (excluding
    self). Password change is optional and, when attempted, requires a matching confirmation;
    leaving both blank keeps the current password.
  - Authentication: no explicit `authentication_classes` override — same as `language.py` and
    `email.py` (`test_email`), so it works with the frontend's `Authorization: Token <token>`
    header. Permission: `IsAuthenticated`.

## Implementation Steps

### Step 1 — Serializers

Create `source/games/serializers/my_account_detail.py`:

```python
"""My-account detail serializer for the games app."""

from django.contrib.auth.models import User
from rest_framework import serializers


class MyAccountDetailSerializer(serializers.ModelSerializer):

    """Serializer for the authenticated user's own account detail."""

    name = serializers.CharField(source='username', max_length=150)

    class Meta:
        model = User
        fields = ['name', 'email']
```

Create `source/games/serializers/my_account_update.py`, modeled on
`staff_user_update.py` but with `name`/`email` required (not partial) and an optional password
change:

```python
"""My-account update serializer for the games app."""

from django.contrib.auth.models import User
from django.contrib.auth.validators import UnicodeUsernameValidator
from rest_framework import serializers


class MyAccountUpdateSerializer(serializers.ModelSerializer):

    """Serializer for the authenticated user's own account update, including optional
    password change."""

    name = serializers.CharField(
        source='username', max_length=150, validators=[UnicodeUsernameValidator()],
    )
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password_confirmation = serializers.CharField(
        write_only=True, required=False, allow_blank=True,
    )

    class Meta:
        model = User
        fields = ['name', 'email', 'password', 'password_confirmation']

    def validate_name(self, value):
        """Reject a name already used by a different user."""
        if User.objects.exclude(pk=self.instance.pk).filter(username=value).exists():
            raise serializers.ValidationError('name already exists')
        return value

    def validate_email(self, value):
        """Reject an email already used by a different user."""
        if User.objects.exclude(pk=self.instance.pk).filter(email=value).exists():
            raise serializers.ValidationError('email already exists')
        return value

    def validate(self, attrs):
        """Reject a password/confirmation pair that doesn't match when either is set."""
        password = attrs.get('password') or ''
        confirmation = attrs.get('password_confirmation') or ''
        if (password or confirmation) and password != confirmation:
            raise serializers.ValidationError(
                {'password_confirmation': ['password and password_confirmation must match']}
            )
        return attrs

    def update(self, instance, validated_data):
        """Persist name/email, and the new password only when one was provided."""
        password = validated_data.pop('password', '') or ''
        validated_data.pop('password_confirmation', None)
        instance.username = validated_data['username']
        instance.email = validated_data['email']
        if password:
            instance.set_password(password)
        instance.save()
        return instance
```

Register both in `source/games/serializers/__init__.py` (alphabetically, alongside the other
`My*`/`StaffUser*` entries).

### Step 2 — View

Create `source/games/views/auth/account.py`, following the `staff_user_detail.py` GET/PATCH
shape but scoped to `request.user` and with no id lookup:

```python
"""View for retrieving or updating the authenticated user's own account."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...serializers import MyAccountDetailSerializer, MyAccountUpdateSerializer
from ..common import validated_or_error


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def account(request):
    """Return or update the authenticated user's own name/email/password."""
    if request.method == 'PATCH':
        return _update_account(request)

    return Response(MyAccountDetailSerializer(request.user).data)


def _update_account(request):
    """Validate the payload, persist the update, then return the detail Response."""
    serializer = MyAccountUpdateSerializer(request.user, data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    serializer.save()
    return Response(MyAccountDetailSerializer(request.user).data)
```

Note this intentionally passes no `partial=True` — `name`/`email` are required on every PATCH,
per the shared contract.

### Step 3 — Wire up exports and URL

- Add `account` to `source/games/views/auth/__init__.py`'s imports and `__all__`.
- Add `account` to `source/games/views/__init__.py`'s `from .auth import ...` line and
  `__all__`.
- In `source/games/urls.py`, add `path('users/account.json', views.account,
  name='users-account')` next to the other `users/*.json` routes.

### Step 4 — Tests

Create `source/games/tests/auth/account_test.py` (mirroring `status_test.py`/`register_test.py`
for fixtures/style), covering:
- `GET` unauthenticated → `401`.
- `GET` authenticated → `200` with the requester's own `name`/`email` (never another user's).
- `PATCH` authenticated, valid name/email (no password) → `200`, `User.username`/`email`
  updated, password untouched.
- `PATCH` with matching `password`/`password_confirmation` → `200`, password actually changed
  (verify via `user.check_password(...)` after refetching from DB).
- `PATCH` with `password` set but blank/missing `password_confirmation` (and vice versa) →
  `400` with a `password_confirmation` field error.
- `PATCH` with `password` and `password_confirmation` both blank → `200`, password unchanged.
- `PATCH` with `name`/`email` missing entirely → `400` (required fields).
- `PATCH` reusing another existing user's `name` or `email` → `400` with the matching field
  error; reusing the requester's own current `name`/`email` unchanged → succeeds (self-exclusion
  works).
- `PATCH` unauthenticated → `401`.
- Confirm no user id parameter is accepted/consulted anywhere (there is none in the URL or
  payload) — the endpoint only ever reads/writes `request.user`.

Create `source/games/tests/serializers/test_my_account_detail.py` and
`test_my_account_update.py` (mirroring `test_staff_user_detail.py`/`test_staff_user_update.py`),
covering the serializer-level validation rules above directly (uniqueness exclusion, password
match, required name/email).

### Step 5 — Docs

Add a row to the "Authentication endpoints" table in `docs/agents/access-control.md`:

```markdown
| `/users/account.json` | GET/PATCH | Authenticated; always scoped to the requesting user, never a different user id |
```

## Files to Change

- `source/games/serializers/my_account_detail.py` — new serializer
- `source/games/serializers/my_account_update.py` — new serializer
- `source/games/serializers/__init__.py` — export both
- `source/games/views/auth/account.py` — new view
- `source/games/views/auth/__init__.py` — export `account`
- `source/games/views/__init__.py` — export `account`
- `source/games/urls.py` — register `users/account.json`
- `source/games/tests/auth/account_test.py` — new tests
- `source/games/tests/serializers/test_my_account_detail.py` — new tests
- `source/games/tests/serializers/test_my_account_update.py` — new tests
- `docs/agents/access-control.md` — new row for the endpoint

## CI Checks

- `source`: `docker-compose run majora_app poetry run pytest --ignore=games/tests/views/ --cov`
  (CI job: `pytest_all` — covers `games/tests/auth/account_test.py` and
  `games/tests/serializers/test_my_account_*.py`, since `pytest_all` runs everything except
  `games/tests/views/`)
- `source`: `docker-compose run majora_app poetry run ruff check .` (CI job: `checks`)

## Notes

- Do not reuse `StaffUserUpdateSerializer` as-is — that one makes `name`/`email` optional
  (`required=False`) for partial staff-driven updates, which is the opposite of what this issue
  needs (`name`/`email` always required here).
- Keep the view thin — all validation/uniqueness/password logic belongs in
  `MyAccountUpdateSerializer`, per this repo's "keep backend views thin" convention.
- `data-access` and `security` review are expected once this lands (new endpoint + new
  serializer fields + password-change side effect) — flagged in the main [plan.md](plan.md).
