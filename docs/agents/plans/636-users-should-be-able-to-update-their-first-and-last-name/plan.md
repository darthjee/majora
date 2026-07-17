# Plan: Users should be able to update their first and last name

Issue: [636-users-should-be-able-to-update-their-first-and-last-name.md](../../issues/636-users-should-be-able-to-update-their-first-and-last-name.md)

## Overview
Add optional `first_name`/`last_name` editing to the My Account page (`/#/my_account`). Django's built-in `User` model already has these fields, so no migration is needed — this is purely a serializer change on the backend, a form change on the frontend, and a couple of i18n key changes. The existing field labeled "Name" (which actually edits the username) is relabeled "Username" to match the wording the login modal already uses for the same concept, and to avoid clashing with the new first/last name fields.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### API payload shape (`GET`/`PATCH /users/account.json`)

The backend agent adds two new optional string fields to both `MyAccountDetailSerializer` and `MyAccountUpdateSerializer`:

- `first_name` — string, blank allowed, `max_length=150` (matches Django's `User.first_name`).
- `last_name` — string, blank allowed, `max_length=150` (matches Django's `User.last_name`).

Both are always present in the detail response (empty string if unset) and both are optional in the update request (omitting either leaves it unset, i.e. empty). The existing `name` field (sourced from `username`) is unchanged in shape/behavior — only its frontend label changes, not the API field name.

The frontend agent's `AuthClient.fetchAccount`/`AuthClient.updateAccount` and `MyAccountController` read/send `first_name`/`last_name` under those exact snake_case keys, matching the existing convention for `avatar_url`/`password_confirmation`.

### i18n keys (`frontend/assets/i18n/{en,pt}.yaml`, `my_account_page` block)

The translator agent:
- Renames the existing `name_label` value from "Name"/"Nome" to "Username"/"Usuario" (matching `login_modal.username_label`'s existing wording in each language) — same key, new value, no frontend code change needed for this one.
- Adds two new keys: `first_name_label` and `last_name_label`.

The frontend agent's `MyAccountHelper.jsx` references `Translator.t('my_account_page.first_name_label')` and `Translator.t('my_account_page.last_name_label')` for the two new fields.

## CI Checks
- `backend`: `cd backend && pytest games/tests/serializers/auth/my_account_detail_test.py games/tests/serializers/auth/my_account_update_test.py`
- `frontend`: `cd frontend && npm test` and `npm run lint`
- `frontend` (i18n sync): `cd frontend && npm run check_i18n`
