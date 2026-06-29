# Backend Plan: Fix Health Check Loop Cycle

Main plan: [plan.md](plan.md)

## Shared contracts

This agent must produce: `/users/status.json` returns an `is_superuser: boolean` field in the response body whenever `logged_in` is `true`.

## Implementation Steps

### Step 1 — Add `is_superuser` to the status view response

In `source/games/views/auth.py`, in the `status` view, add `'is_superuser': user.is_superuser` to the `payload` dict (alongside `logged_in`, `username`, `user_id`, `settings`).

The payload should become:
```python
payload = {
    'logged_in': True,
    'username': user.username,
    'user_id': user.id,
    'is_superuser': user.is_superuser,
    'settings': {'favorite_language': profile.favorite_language},
}
```

No migration is needed — `is_superuser` is a built-in Django `User` field.

### Step 2 — Update tests

In `source/games/tests/auth_test.py`, extend the existing `status` view tests to assert that:

- When authenticated as a non-superuser, the response includes `"is_superuser": false`.
- When authenticated as a superuser (`user.is_superuser = True`), the response includes `"is_superuser": true`.
- When not authenticated (`logged_in: false`), the field is absent.

## Files to Change

- `source/games/views/auth.py` — add `is_superuser` field to status view payload
- `source/games/tests/auth_test.py` — add/extend assertions for `is_superuser`

## CI Checks

- `source/`: `docker-compose run --rm majora_tests poetry run pytest` (CI job: `backend-tests`)

## Notes

- No migration required; `User.is_superuser` is a standard Django field.
- Only add the field when `logged_in` is `True` (the `logged_in: False` branch already returns early with no user context).
