# Extract the shared user identity serializer

`users.json` builds the user identity (`id`, `name` = `username`, `display_name` = `profile.display_name`, or `None` when blank or when there is no profile, `email`) in the private `_UserIdentities._identity` / `_display_name` of `staff_statistics_users.py`. The visit list needs the exact same keys. Move this logic into one shared serializer, e.g. `StatisticsUserIdentitySerializer` (`serializers.Serializer` or a `ModelSerializer` on `User`, with `name` sourced from `username` and a method field for `display_name` that catches `ObjectDoesNotExist` and turns `''` into `None`). Export it from `staff/serializers/__init__.py`.

Refactor `_UserIdentities` to call the serializer instead of its own `_identity` / `_display_name`. Keep its single `in_bulk` query, the empty-page short circuit and the skip of users deleted mid-request. The `users.json` response must stay byte-for-byte identical, and the existing `staff_statistics_users_test.py` must pass unchanged.

Do **not** reuse `StaffUserListSerializer`: it adds `status` and does not null a blank `display_name`.

Add serializer unit tests: all keys, blank display name → `None`, empty display name → `None`, no profile → `None`.

## Files to Change
- `backend/staff/serializers/statistics_user_identity.py` (new): the shared identity serializer.
- `backend/staff/serializers/__init__.py`: export it.
- `backend/staff/views/staff_statistics_users.py`: `_UserIdentities` uses the serializer; drop `_identity` / `_display_name`.
- `backend/staff/tests/serializers/statistics_user_identity_test.py`, or wherever staff serializer tests live (follow the existing layout): new tests.
