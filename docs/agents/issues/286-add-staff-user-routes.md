# Add staff user routes

## Context

There is currently no way for staff/admins to view or manage user accounts through the app. Additionally, when a user cannot access the email address tied to the existing self-service password-recovery flow (`/users/recover.json`), there is no way for staff to help them recover access — the recovery URL is only ever sent by email.

## What needs to be done

- Backend:
  - Gate the new endpoints on `request.user.is_superuser or request.user.is_staff`, matching the existing inline-permission-check convention used elsewhere (e.g. `treasures_list.py`).
  - Add list/detail/update views for users (name + email only for updates), reachable only by superuser/staff.
  - Add a new endpoint that reuses the existing `PasswordResetToken` model/expiration logic (see `source/games/models/password_reset_token.py` and `source/games/views/password_reset/_shared.py`) to reuse a valid token or create a new one, returning the recovery URL without sending an email.
- Frontend:
  - New frontend routes, gated to accounts where `is_superuser` or `is_staff` is true (Django's built-in `is_staff` field on `User`, not previously used by this app — no migration required):
    - `/staff/users` — index page listing all users (including superuser/staff accounts) in a table, showing name, email, an edit link, and a recovery-link action per row.
    - `/staff/users/:id` — show page for a single user.
    - `/staff/users/:id/edit` — edit page allowing staff to change a user's name and email only (no password or status-flag editing, no new-user creation page).
  - Register the new hash routes in `HashRouteResolver.js` and `AppHelper.jsx`, following the existing page/controller pattern (e.g. Treasures index/edit).
  - Build the index page as a table (a new table-rendering element, since no generic table component exists yet), plus an edit page reusing the existing edit-form pattern.
  - Add a nav link to `/staff/users`, gated the same way `HeaderController.js` gates other superuser-only UI, extended to include `is_staff`.
  - On the index page, each user row offers a way to generate a recovery link if one doesn't already exist, and to copy the resulting URL to the clipboard:
    - If the user already has a valid (unexpired, unused) recovery token, its URL is reused.
    - Otherwise, a new token is created and its URL returned.
    - Unlike `/users/recover.json`, this new endpoint does **not** send an email — it only returns the recovery URL for staff to copy.

## Acceptance criteria

- [ ] Backend endpoints exist to list users, view a user, and update a user's name/email, all gated to `is_superuser or is_staff`.
- [ ] A backend endpoint exists that returns a password-recovery URL for a given user (reusing a valid unexpired/unused token or creating a new one) without sending an email.
- [ ] Frontend routes `/staff/users`, `/staff/users/:id`, and `/staff/users/:id/edit` exist and are gated to superuser/staff accounts.
- [ ] The users index page renders a table with name, email, an edit link, and a recovery-link action (with copy-to-clipboard) per row.
- [ ] A nav link to `/staff/users` is visible only to superuser/staff accounts.

Tags: :shipit:
