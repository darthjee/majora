# Backend Plan: Users should be able to update their first and last name

Main plan: [plan.md](plan.md)

## Shared contracts

See `plan.md`'s "Shared contracts" section for the full `first_name`/`last_name` field contract. Summary: add both fields (string, blank allowed, `max_length=150`) to `MyAccountDetailSerializer` and `MyAccountUpdateSerializer`, using Django's built-in `User.first_name`/`User.last_name` — no migration needed.

## Implementation Steps

### Step 1 — Expose `first_name`/`last_name` in the detail serializer
File: `backend/games/serializers/auth/my_account_detail.py`

Add `'first_name'` and `'last_name'` to `Meta.fields` (after `'name'`, before `'email'`, to mirror the frontend field order):

```python
class Meta:
    """Metadata for the MyAccountDetailSerializer."""

    model = User
    fields = ['name', 'first_name', 'last_name', 'email', 'avatar_url']
```

No explicit field declarations are needed — `first_name`/`last_name` are real `User` model fields, so `ModelSerializer` picks them up automatically with the model's own `max_length=150`, `blank=True` constraints.

### Step 2 — Accept `first_name`/`last_name` in the update serializer
File: `backend/games/serializers/auth/my_account_update.py`

Add explicit optional fields (mirroring the model's own `blank=True`, so omitting either in a request is valid) and include them in `Meta.fields`:

```python
first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
```

```python
class Meta:
    """Metadata for the MyAccountUpdateSerializer."""

    model = User
    fields = ['name', 'first_name', 'last_name', 'email', 'password', 'password_confirmation']
```

In `update()`, persist both fields before `instance.save()`, defaulting to an empty string when omitted (same style as the existing `password` handling):

```python
def update(self, instance, validated_data):
    """Persist name/first_name/last_name/email, and the new password only when one was
    provided."""
    password = validated_data.pop('password', '') or ''
    validated_data.pop('password_confirmation', None)
    instance.username = validated_data['username']
    instance.first_name = validated_data.get('first_name', '')
    instance.last_name = validated_data.get('last_name', '')
    instance.email = validated_data['email']
    if password:
        instance.set_password(password)
    instance.save()
    self._refresh_email_hash(instance)
    return instance
```

### Step 3 — Tests
Files: `backend/games/tests/serializers/auth/my_account_detail_test.py`, `backend/games/tests/serializers/auth/my_account_update_test.py`

Detail serializer:
- `test_serializes_first_and_last_name` — a user with `first_name='Alice'`, `last_name='Smith'` (via `UserFactory`) serializes both fields as-is.
- Update `test_only_exposes_expected_fields` to include `first_name` and `last_name` in the expected key set.
- `test_first_and_last_name_default_to_empty_string` — a user created without `first_name`/`last_name` serializes both as `''` (Django's model default), not `None`.

Update serializer:
- `test_valid_first_and_last_name_update` — `data={'name': 'alice', 'email': ..., 'first_name': 'Alice', 'last_name': 'Smith'}` is valid and `serializer.save()` persists both.
- `test_first_and_last_name_are_optional` — omitting `first_name`/`last_name` from `data` (only `name`/`email` present) is still valid and saves them as `''`.
- `test_blank_first_and_last_name_are_accepted` — explicit `''` values are valid (not rejected like a blank `name` would be).
- `test_rejects_first_name_longer_than_150_characters` / `test_rejects_last_name_longer_than_150_characters` — mirror the existing `test_rejects_name_longer_than_150_characters` pattern.

Check whether `UserFactory` (`backend/games/tests/factories`) already forwards arbitrary kwargs like `first_name`/`last_name` to the underlying `User` model (it likely does, being a thin factory over `User`) — if not, no factory change should be needed since these tests can also just set `cls.user.first_name = '...'; cls.user.save()` before asserting, matching whichever style existing tests in the same file use for one-off field values.

## Files to Change
- `backend/games/serializers/auth/my_account_detail.py` — add `first_name`, `last_name` to `Meta.fields`.
- `backend/games/serializers/auth/my_account_update.py` — add `first_name`, `last_name` fields, include in `Meta.fields`, persist in `update()`.
- `backend/games/tests/serializers/auth/my_account_detail_test.py` — add/adjust tests per Step 3.
- `backend/games/tests/serializers/auth/my_account_update_test.py` — add tests per Step 3.

## CI Checks
- `cd backend && pytest games/tests/serializers/auth/my_account_detail_test.py games/tests/serializers/auth/my_account_update_test.py`

## Notes
- No migration is needed — `first_name`/`last_name` already exist on `django.contrib.auth.models.User`.
- Do not touch `backend/games/views/auth/account.py` — the view is generic and doesn't reference field names directly; only the serializers change.
- Do not rename the `name`/`username` field or its validation (uniqueness, `UnicodeUsernameValidator`, required-ness) — that stays exactly as-is; only its frontend label changes (translator agent).
