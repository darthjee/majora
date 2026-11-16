# Add the with_profile parameter

Add a `with_profile` keyword (default `True`) to `UserFactory`. Factory-boy passes undeclared kwargs straight through to `_create`, so pop it there (`with_profile = kwargs.pop('with_profile', True)`) before calling `create_user`, and call `_ensure_approved_profile(user)` only when it is true. Do not use `class Params`: params are stripped before `_create` and cannot be read there. `SuperUserFactory._create` must pop and honor the same flag. Keep the default behavior byte-for-byte the same.

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
