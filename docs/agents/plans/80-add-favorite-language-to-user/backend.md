# Backend Plan: Add favorite language to user

Main plan: [plan.md](plan.md)

## Shared contracts

- `status.json` gains `settings: {favorite_language}` when logged in.
- `POST /users/language.json`, `IsAuthenticated`, body `{"language": "<code>"}` -> `200 {"favorite_language": "<code>"}`.

## Implementation Steps

### Step 1 — `UserProfile` model
Add to `source/games/models.py`, following the same style as the existing `PasswordResetToken` model:
```python
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    favorite_language = models.CharField(max_length=10, default='en')
```
Generate and apply the migration.

### Step 2 — Helper to get-or-create the profile
Add a small helper (e.g. `get_or_create_profile(user)` in `source/games/views/auth.py`, or a `UserProfile.objects.get_or_create(user=user)` call inline at each call site — pick whichever keeps the views thin per `AGENTS.md`'s convention; a one-line `get_or_create` call inline is simplest here since it's only needed in two views) so a user without a profile row yet (anyone who registered before this migration, or via `register`) gets a default one transparently.

### Step 3 — Extend `status`
In `source/games/views/auth.py`, update `status` so the logged-in branch includes the profile's language:
```python
@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def status(request):
    """Report whether the requesting token (if any) is logged in."""
    auth = TokenAuthentication()
    try:
        result = auth.authenticate(request)
    except Exception:
        result = None

    if result is None:
        return Response({'logged_in': False})

    user, _ = result
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return Response({
        'logged_in': True,
        'username': user.username,
        'settings': {'favorite_language': profile.favorite_language},
    })
```

### Step 4 — `language` view
```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def language(request):
    """Persist the requesting user's favorite language preference."""
    value = request.data.get('language', '')
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    profile.favorite_language = value
    profile.save()
    return Response({'favorite_language': profile.favorite_language})
```

### Step 5 — Route
In `source/games/urls.py`:
```python
path('users/language.json', views.language, name='users-language'),
```

### Step 6 — Tests
- Extend `TestStatusView` in `source/games/tests/auth_test.py`: a valid-token request now also asserts `data['settings']['favorite_language']` (default `'en'` for a freshly created user/profile).
- Add `TestLanguageView`: authenticated request updates `favorite_language` and returns it; a second `status.json` call afterward reflects the new value; unauthenticated request returns `401`.
- Add a `UserProfile` model/migration smoke test if this repo's convention includes one (check `source/games/tests/` for an existing model-test file to match, e.g. alongside `settings_test.py`).

## Files to Change
- `source/games/models.py` + new migration — `UserProfile` model.
- `source/games/views/auth.py` — extend `status`, add `language` view.
- `source/games/urls.py` — route `users/language.json`.
- `source/games/tests/auth_test.py` — extend `TestStatusView`, add `TestLanguageView`.

## CI Checks
- `source`: `poetry run pytest` (CI job: `pytest`)
- `source`: `poetry run ruff check .` (CI job: `checks`)

## Notes
- No validation of `language` against a fixed set is performed server-side; this is intentionally permissive since the frontend is the only client today and already restricts choices to registered languages.
