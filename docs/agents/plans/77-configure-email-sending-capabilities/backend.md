# Backend Plan: Configure email sending capabilities

Main plan: [plan.md](plan.md)

## Shared contracts

- `POST /users/test-email.json`, `IsAuthenticated`. Sends a test email to `request.user.email`.
  - `request.user.email` present: send the email, `200 {"sent": true}`.
  - `request.user.email` empty: `400 {"error": "User has no email address configured"}`, no send attempted.

## Implementation Steps

### Step 1 — Email settings
In `source/majora_project/settings.py`, add configurable email settings (env-var driven, following the existing `os.environ.get(...)` convention used throughout this file):

```python
EMAIL_BACKEND = os.environ.get(
    'DJANGO_EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend'
)
EMAIL_HOST = os.environ.get('DJANGO_EMAIL_HOST', 'localhost')
EMAIL_PORT = int(os.environ.get('DJANGO_EMAIL_PORT', '587'))
EMAIL_HOST_USER = os.environ.get('DJANGO_EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('DJANGO_EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.environ.get('DJANGO_EMAIL_USE_TLS', 'true').lower() == 'true'
DEFAULT_FROM_EMAIL = os.environ.get('DJANGO_DEFAULT_FROM_EMAIL', 'no-reply@majora.local')
```

Add matching entries (with safe dev defaults, e.g. `DJANGO_EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend` so local dev prints emails instead of sending them) to `.env.dev.sample`.

### Step 2 — Email template
`TEMPLATES` already has `APP_DIRS: True`, so a template under `source/games/templates/games/` is auto-discovered. Add `source/games/templates/games/test_email.txt`:

```
Hello {{ username }},

This is a test email from Majora to confirm that email sending is configured correctly.
```

### Step 3 — Email sending helper + view
Add a `send_test_email(user)` helper in `source/games/views/auth.py` (or a small `source/games/mailer.py` if it grows — keep it a thin wrapper per `AGENTS.md`'s "keep views thin" convention) using `django.core.mail.send_mail` and `django.template.loader.render_to_string('games/test_email.txt', {'username': user.username})`.

Add the `test_email` view:

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_email(request):
    """Send a test email to the requesting user's own address."""
    if not request.user.email:
        return Response({'error': 'User has no email address configured'}, status=400)

    send_test_email(request.user)
    return Response({'sent': True})
```

### Step 4 — Route it
In `source/games/urls.py`:
```python
path('users/test-email.json', views.test_email, name='users-test-email'),
```

### Step 5 — Tests
In `source/games/tests/auth_test.py`, add `TestTestEmailView` covering:
- Authenticated user with an email: `200 {"sent": true}`, and the email was added to `django.core.mail.outbox` (Django's test email backend) with the expected recipient/body.
- Authenticated user with no email: `400`, `mail.outbox` stays empty.
- Unauthenticated request: `401`.

Ensure `EMAIL_BACKEND` resolves to `django.core.mail.backends.locmem.EmailBackend` during tests (pytest-django's default test settings normally do this automatically; confirm `source/majora_project/settings.py` doesn't hardcode something that breaks this — if it does, override `EMAIL_BACKEND` in the test settings/fixture instead of in the main settings file).

## Files to Change
- `source/majora_project/settings.py` — email settings.
- `.env.dev.sample` — new email env vars with dev-safe defaults.
- `source/games/templates/games/test_email.txt` — new template.
- `source/games/views/auth.py` — `send_test_email` helper + `test_email` view.
- `source/games/urls.py` — route `users/test-email.json`.
- `source/games/tests/auth_test.py` — add `TestTestEmailView`.

## CI Checks
- `source`: `poetry run pytest` (CI job: `pytest`)
- `source`: `poetry run ruff check .` (CI job: `checks`)

## Notes
- No real SMTP credentials exist in this environment; the console/locmem backends keep this safe to test locally and in CI. Document in a comment near the settings block that production must set `DJANGO_EMAIL_BACKEND` to the SMTP backend with real credentials via environment variables.
