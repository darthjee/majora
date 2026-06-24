# Backend Plan: Store the Logged State

Main plan: [plan.md](plan.md)

## Shared contracts

### Session cookie created on login/register

After successful authentication, call `request.session['auth_token'] = token.key` to persist the DRF token in a Django server-side session. Django's `SessionMiddleware` (already active) sets the `sessionid` cookie automatically.

### `GET /users/status.json` — session fallback

When no `Authorization` header is present, check `request.session.get('auth_token')`. If found, look up the corresponding `Token` object and authenticate the user from it. Return the full status payload **plus** `"token": token.key` so the frontend can restore the token into memory.

### Logout clears the session

On logout, flush the session (`request.session.flush()`) in addition to deleting the DRF token.

## Implementation Steps

### Step 1 — Configure session cookie security in settings

Add to `source/majora_project/settings.py`:

```python
SESSION_COOKIE_HTTPONLY = True   # already Django default, make it explicit
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'false').lower() == 'true'
```

### Step 2 — Store token in session on login

In `source/games/views/auth.py`, update the `login` view to store the token key in the session after successful authentication:

```python
token, _ = Token.objects.get_or_create(user=user)
request.session['auth_token'] = token.key
return Response({'token': token.key})
```

### Step 3 — Store token in session on register

Same change in the `_create_registered_user` helper / `register` view: after `Token.objects.get_or_create(user=user)`, call `request.session['auth_token'] = token.key`.

Because `_create_registered_user` does not have access to `request`, store the token in the `register` view after calling `_create_registered_user`:

```python
user, token = _create_registered_user(request.data)
request.session['auth_token'] = token.key
send_welcome_email(user)
return Response({'username': user.username, 'token': token.key}, status=201)
```

### Step 4 — Extend the `status` view with session fallback

Replace the manual `TokenAuthentication` block in the `status` view with logic that checks both the Authorization header and the session:

```python
@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def status(request):
    auth = TokenAuthentication()
    try:
        result = auth.authenticate(request)
    except Exception:
        result = None

    session_auth = False
    if result is None:
        session_token_key = request.session.get('auth_token')
        if session_token_key:
            try:
                token_obj = Token.objects.select_related('user').get(key=session_token_key)
                result = (token_obj.user, token_obj)
                session_auth = True
            except Token.DoesNotExist:
                request.session.flush()

    if result is None:
        return Response({'logged_in': False})

    user, token_obj = result
    profile, _ = UserProfile.objects.get_or_create(user=user)
    payload = {
        'logged_in': True,
        'username': user.username,
        'user_id': user.id,
        'settings': {'favorite_language': profile.favorite_language},
    }
    if session_auth:
        payload['token'] = token_obj.key
    return Response(payload)
```

### Step 5 — Clear session on logout

Update the `logout` view to also flush the session:

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    request.session.flush()
    return Response(status=204)
```

### Step 6 — Write backend tests

Add to `source/games/tests/auth_test.py`:

- `TestLoginView`: assert that a successful login sets a session cookie containing the token key (`client.session['auth_token'] == data['token']`).
- `TestRegisterView`: same assertion for the register endpoint.
- `TestStatusView`:
  - New: assert that calling `/users/status.json` with a valid session cookie (no Authorization header) returns `logged_in: true` and includes `token` in the response.
  - New: assert that an expired/deleted session token returns `logged_in: false`.
- `TestLogoutView`:
  - New: assert that logout flushes the session (session is empty after the call).

## Files to Change

- `source/majora_project/settings.py` — add session cookie security settings
- `source/games/views/auth.py` — login, register, status, logout views
- `source/games/tests/auth_test.py` — new test cases for session behavior

## CI Checks

- `source/`: `docker-compose run --rm majora_tests pytest` (CI job: `pytest`)

## Notes

- `Session.flush()` both clears the session data and regenerates the session key, preventing session fixation attacks.
- `SESSION_COOKIE_HTTPONLY = True` is Django's default but is made explicit here for clarity.
- If the session token key exists in the session but the corresponding `Token` object no longer exists (e.g. after a manual revoke), the session is flushed to avoid a stale state.
- No migration is needed: Django's session table (`django_session`) is already managed by `django.contrib.sessions`.
