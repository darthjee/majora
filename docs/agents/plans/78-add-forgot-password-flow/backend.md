# Backend Plan: Add forgot password flow

Main plan: [plan.md](plan.md)

## Shared contracts

- `POST /users/recover.json` — always `200 {"sent": true}`, regardless of whether `email` matches a user.
- `POST /users/reset-password.json` — `{token, password}` -> `200 {"reset": true}` on success, `400 {"error": "Invalid or expired token"}` for any invalid/expired/used token.
- `Settings.password_reset_token_expiration_minutes()` on `source/games/settings.py`, reading `MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES` (default `30`), same try/except-int pattern as `Settings.pagination_size()`.

## Implementation Steps

### Step 1 — Add `Settings.password_reset_token_expiration_minutes()`
In `source/games/settings.py`, add:
```python
@staticmethod
def password_reset_token_expiration_minutes():
    """Return the password recovery token expiration, in minutes."""
    try:
        return int(os.environ.get('MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES', 30))
    except (ValueError, TypeError):
        return 30
```
Add `MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES=30` to `.env.dev.sample`.

### Step 2 — `PasswordResetToken` model
Add to `source/games/models.py`:
```python
class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)

    def is_valid(self):
        if self.used_at is not None:
            return False
        expiration = timedelta(minutes=Settings.password_reset_token_expiration_minutes())
        return timezone.now() <= self.created_at + expiration
```
Generate the token with `secrets.token_urlsafe(32)` at creation time (in the view, not a model default, so the expiration setting is read fresh on each request). Create and apply the migration.

### Step 3 — Recovery email template
Add `source/games/templates/games/password_reset_email.txt`:
```
Hello,

A password reset was requested for your account. If this was you, use the
link below to set a new password. This link expires in {{ expiration_minutes }} minutes.

{{ recovery_url }}

If you did not request this, you can safely ignore this email.
```

### Step 4 — Views
In `source/games/views/auth.py` (or split into a new `source/games/views/password_reset.py` if `auth.py` grows too large — match whichever keeps each file focused, per `AGENTS.md`'s thin-views convention):

```python
@api_view(['POST'])
@permission_classes([AllowAny])
def recover(request):
    """Send a password recovery email if the given address matches a user."""
    email = request.data.get('email', '')
    user = User.objects.filter(email=email).first()

    if user is not None:
        token = secrets.token_urlsafe(32)
        PasswordResetToken.objects.create(user=user, token=token)
        send_password_reset_email(user, token)

    return Response({'sent': True})


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Set a new password using a valid, unexpired, unused recovery token."""
    token_value = request.data.get('token', '')
    password = request.data.get('password', '')

    reset_token = PasswordResetToken.objects.filter(token=token_value).first()
    if reset_token is None or not reset_token.is_valid():
        return Response({'error': 'Invalid or expired token'}, status=400)

    reset_token.user.set_password(password)
    reset_token.user.save()
    reset_token.used_at = timezone.now()
    reset_token.save()

    return Response({'reset': True})
```

`send_password_reset_email(user, token)` builds the recovery URL from `request`'s host or a `FRONTEND_BASE_URL` setting (add `FRONTEND_BASE_URL` env var, default `http://localhost:3000`, to `settings.py`/`.env.dev.sample`) as `f"{FRONTEND_BASE_URL}/#/recover-password?token={token}"`, renders the template, and sends via `send_mail` (same approach as `send_test_email` from issue #77).

### Step 5 — Routes
In `source/games/urls.py`:
```python
path('users/recover.json', views.recover, name='users-recover'),
path('users/reset-password.json', views.reset_password, name='users-reset-password'),
```

### Step 6 — Tests
Add `source/games/tests/password_reset_test.py` covering:
- `recover` with a matching email: `200 {"sent": true}`, a `PasswordResetToken` row was created, an email was sent.
- `recover` with a non-matching email: `200 {"sent": true}`, no token row created, no email sent — verifying the response is identical to the matching case.
- `reset_password` with a fresh valid token: `200 {"reset": true}`, the user's password is updated, `used_at` is set.
- `reset_password` with an already-used token: `400`.
- `reset_password` with an expired token (use `monkeypatch`/freeze the `created_at` or monkeypatch the expiration setting to `0`): `400`.
- `reset_password` with a garbage/unknown token: `400`.
- `Settings.password_reset_token_expiration_minutes()` tests mirroring `TestSettingsPaginationSize`.

## Files to Change
- `source/games/settings.py` — new `Settings.password_reset_token_expiration_minutes()`.
- `source/majora_project/settings.py` / `.env.dev.sample` — `FRONTEND_BASE_URL`, `MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES`.
- `source/games/models.py` — `PasswordResetToken` model + migration.
- `source/games/templates/games/password_reset_email.txt` — new template.
- `source/games/views/auth.py` (or new `password_reset.py`) — `recover`, `reset_password`, `send_password_reset_email`.
- `source/games/urls.py` — new routes.
- `source/games/tests/password_reset_test.py` — new tests.
- `source/games/tests/settings_test.py` — extend with the new Settings method's tests.

## CI Checks
- `source`: `poetry run pytest` (CI job: `pytest`)
- `source`: `poetry run ruff check .` (CI job: `checks`)

## Notes
- Security-sensitive endpoint: do not let `recover`'s response timing or shape differ based on whether the user exists; do the same database/email work pattern either way (lookup happens regardless, only the conditional branch differs).
- `reset_password` intentionally returns the same generic error for invalid/expired/used tokens to avoid leaking which case applies.
