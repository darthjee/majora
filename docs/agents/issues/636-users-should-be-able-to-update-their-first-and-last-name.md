# Issue: Users should be able to update their first and last name

## Description
On `/#/my_account`, users can currently edit their username, email, and password, but have no way to set a first name or last name. The Django `User` model already supports `first_name` and `last_name` natively, so no schema migration is needed — this is a serializer and frontend form change.

## Problem
- There is no way for a user to record their first and last name on the My Account page.
- The existing field labeled **Name** on that page is misleading: it is actually bound to the username (source=`username`), which is the login identifier, not a person's name. Once real first/last name fields are added, this mislabeling becomes actively confusing. Elsewhere in the app (the login modal) the same concept is already labeled **Username**, so the My Account page is inconsistent with it too.

## Expected Behavior
- On `/#/my_account`, users can view and edit **First name** and **Last name**, alongside the existing username, email, and password fields. Both are optional (blank allowed), matching Django's default for these fields.
- The field currently labeled **Name** (bound to username) is relabeled to **Username**, matching the wording already used by the login modal elsewhere in the app.
- This issue is scoped to the My Account page only — first/last name are not surfaced anywhere else in the app (no display name, profile, or leaderboard usage) for now.

## Solution
- Backend: add optional `first_name` and `last_name` to `MyAccountDetailSerializer` and `MyAccountUpdateSerializer` (`backend/games/serializers/auth/my_account_detail.py` and `my_account_update.py`). No migration required since these are built-in `User` fields.
- Frontend: add First name / Last name form fields to `MyAccountHelper.jsx`, wire state and handlers through `MyAccount.jsx` and `MyAccountController.js`, and update `AuthClient` fetch/update payloads accordingly.
- i18n: in `frontend/assets/i18n/en.yaml` and `pt.yaml`, rename the existing `name_label` value from "Name" to "Username" and add new labels for first/last name.

## Benefits
- Lets users maintain accurate personal identification on their account.
- Removes the ambiguity between the login identifier and a person's actual name, and makes the My Account page consistent with the login modal's existing wording.
