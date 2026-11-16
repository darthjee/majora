# Add the with_profile parameter

Add `with_profile` to `UserFactory` as a factory-boy `class Params` entry with default `True`, so factory-boy strips it before the model kwargs reach `_create`. In `_create`, read it (via `kwargs.pop` is not needed with `Params`; read it from the resolved declarations, or, if simpler, implement it as a plain kwarg popped in `_create`) and call `_ensure_approved_profile(user)` only when it is true. `SuperUserFactory._create` must honor the same flag. Keep the default behavior byte-for-byte the same.

Update the `UserFactory` docstring: explain the opt-out and the rule that a user who authenticates must keep the profile, because `is_approved()` would create a `pending` one and the request would be anonymous. Update the `UserProfileFactory` docstring, which says every user already has a profile.

Add `backend/games/tests/factories/user_test.py` (Django `TestCase`, `setUpTestData` where fixtures are shared) covering:

- default `UserFactory()` creates exactly one `approved` profile;
- `UserFactory(with_profile=False)` creates the user and no profile row;
- `SuperUserFactory(with_profile=False)` creates a superuser and no profile row;
- `UserProfileFactory(user=UserFactory(with_profile=False), status=...)` creates the profile with that status;
- `with_profile` never reaches `create_user` (no unexpected-kwarg error, no attribute on the user).

Confirm `games/tests/factories/` is under the pytest `testpaths` and that the new file is collected.

## Files to Change
- `backend/games/tests/factories/user.py` — `with_profile` parameter, both `_create` methods, docstrings.
- `backend/games/tests/factories/user_test.py` — new factory tests.
