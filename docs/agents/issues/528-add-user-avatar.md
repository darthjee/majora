# Issue: Add User Avatar

## Description
Add an `email_hash` field storing a SHA-256 hash of the user's email address, and use it to display a Gravatar-based avatar on the `/#/my_account` page.

## Problem
There is currently no stored, precomputed hash of the user's email that could be used to look up a Gravatar image, and there is no avatar shown anywhere in the account UI.

## Expected Behavior
- Whenever a user's email is set (on creation) or changed (on update), `email_hash` is recalculated as the SHA-256 hex digest of the trimmed, lowercased email (matching Gravatar's hashing convention).
- If the user has no email, `email_hash` is left null/blank rather than hashing an empty string.
- `email_hash` is only recomputed when the email actually changes, not on every save.
- A data migration backfills `email_hash` for all existing users based on their current email.
- The `/users/account.json` endpoint response includes an `avatar_url` field, built from the Gravatar base URL setting plus `email_hash` (null when there is no `email_hash`).
- The `/#/my_account` page shows the user's avatar in the top-left corner, above/beside the page title. The header nav icon for My Account is unchanged.
- When there is no `avatar_url` (no email), the avatar component falls back to the app's existing local placeholder image, the same way `CardAvatar` falls back for character photos.

## Solution
- **Backend model**: add `email_hash` to the existing `UserProfile` model (`backend/games/models/user_profile.py`), which already has a one-to-one relationship to `django.contrib.auth.models.User`. `UserProfile.save()` detects when the associated user's email has changed and recomputes `email_hash = sha256(email.strip().lower())` (or leaves it null if the email is blank), following the precomputed-field pattern already used by `Game.save()` (slug) and `Upload.save()` (token).
- **Backend migration**: a `RunPython` data migration backfills `email_hash` for all existing `UserProfile` rows, following the pattern in `0025_remove_character_character_class_and_more.py`.
- **Backend settings**: add a `GRAVATAR_BASE_URL`-style setting to `backend/games/settings.py`'s `Settings` class, sourced from an env var (e.g. `MAJORA_GRAVATAR_BASE_URL`) with a default of `https://gravatar.com/avatar/`, following the same pattern as `cache_control_anonymous_max_age()`.
- **Backend serializer**: `MyAccountDetailSerializer` (`backend/games/serializers/auth/my_account_detail.py`) gains an `avatar_url` field, computed as `GRAVATAR_BASE_URL + email_hash` when `email_hash` is present, else null.
- **Frontend component**: a new reusable `Avatar` component (e.g. `frontend/assets/js/components/common/Avatar.jsx`) that receives an image URL prop and falls back to a bundled default placeholder image when the URL is absent, following the existing `CardAvatar.jsx` convention (including its spec test location/pattern).
- **Frontend page**: `MyAccountHelper.jsx` renders the new `Avatar` component in the top-left corner of the `/#/my_account` page, fed by the `avatar_url` from the account endpoint response.

## Benefits
- Gives users a visible, recognizable avatar on their account page, sourced from Gravatar with no extra user setup.
- Keeps the hash consistent with the email automatically, with no manual sync step.
- Makes the Gravatar base URL configurable per environment without code changes.
