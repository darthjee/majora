# Issue: Fix authorization regression introduced by #218

## Problem
After commit `5c57cc73` (issue #217 fix, PR #218), all write endpoints (POST, PATCH, DELETE) return 401 for authenticated users who have been logged in for a while. Logout (`DELETE /users/logout.json`) also fails with 401, meaning users cannot log out of their session. All users are affected.

**Example**: `PATCH /games/dragon_heist.json` with `Authorization: Token <key>` → 401 with `Cache-Control: public, max-age=3600`.

The commit changed the global default authentication class from `TokenAuthentication` to `CookieTokenAuthentication`. The `CookieTokenAuthentication.authenticate()` method calls `super().authenticate(request)` first (header-based token auth) and falls through to session-cookie auth only if that returns `None`. However, `TokenAuthentication.authenticate()` raises `AuthenticationFailed` (not `None`) when a token **format** is valid but the key is not found in the database — and `CookieTokenAuthentication` does not catch that exception. As a result, if a user's `Authorization` header carries a stale or deleted token (e.g., after logout on another tab or device), the exception propagates immediately and the valid session cookie is never tried.

Additionally, the `CacheControlMiddleware` (from PR #214) adds `Cache-Control: public, max-age=3600` to any 401 response — because `request.user.is_authenticated` is `False` when auth fails. This makes 401s technically cacheable by any downstream proxy or CDN, even though the requests themselves are reaching the backend.

## Expected Behavior
- Any request that carries a valid `Authorization: Token` header **or** a valid session cookie with `auth_token` must be authenticated successfully.
- If the `Authorization` header contains a stale/deleted token, authentication should fall through to the session cookie rather than immediately returning 401.
- 401 responses must not be cacheable by proxies or CDNs; they must carry `Cache-Control: no-store`.

## Solution
**Fix 1 — `CookieTokenAuthentication` in `source/games/authentication.py`**: catch `AuthenticationFailed` raised by `super().authenticate()` and fall through to session auth instead of letting the exception propagate.

```python
from rest_framework.exceptions import AuthenticationFailed

def authenticate(self, request):
    try:
        result = super().authenticate(request)
    except AuthenticationFailed:
        result = None  # stale header token — fall through to session

    if result is not None:
        return result

    token_key = request.session.get('auth_token')
    if not token_key:
        return None

    try:
        token_obj = Token.objects.select_related('user').get(key=token_key)
    except Token.DoesNotExist:
        return None

    return (token_obj.user, token_obj)
```

**Fix 2 — `CacheControlMiddleware` in `source/games/middleware.py`**: skip adding a cacheable `Cache-Control` header when the response status is not 2xx. 401 and other error responses should carry `Cache-Control: no-store`.

```python
if request.user.is_authenticated:
    max_age = Settings.cache_control_authenticated_max_age()
    response["Cache-Control"] = f"private, max-age={max_age}"
elif 200 <= response.status_code < 300:
    max_age = Settings.cache_control_anonymous_max_age()
    response["Cache-Control"] = f"public, max-age={max_age}"
else:
    response["Cache-Control"] = "no-store"
```

## Benefits
- Write endpoints (POST, PATCH, DELETE) work for users with stale Authorization header tokens but valid session cookies.
- Logout is unblocked for all affected users.
- 401 responses can never be cached by any downstream proxy or CDN.
