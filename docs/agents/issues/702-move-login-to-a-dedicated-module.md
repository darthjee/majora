# Issue: Move login to a dedicated module

## Description
Login-related backend code currently lives inside the `games` app (under `views/auth/`, `views/password_reset/`, `serializers/auth/`, `urls/auth.py`, plus the `PasswordResetToken` model and `CookieTokenAuthentication` backend), even though none of it is related to games, characters, or treasures. This issue moves that code into its own dedicated `accounts` app.

## Problem
The `games` app currently owns two unrelated concerns: gameplay entities (games, characters, treasures, etc.) and account/authentication (login, logout, register, recover/reset password, my account, language). This makes `games` larger than it needs to be and blurs its responsibility boundary.

## Solution
This is a pure code relocation — no behavior, URL paths, or API contracts change.

**Backend** — extract all login/account/authentication code from `games` into a new dedicated `accounts` Django app, following the same `apps.py` / `models/` / `views/` / `serializers/` / `urls/` / `tests/` structure already used by `games`, `versioning`, `statistics`, and `conversations`. This includes:
- Views: `views/auth/*` (login, logout, register, status, account, email, language) and `views/password_reset/*` (recover, reset_password)
- Serializers: `serializers/auth/*` (my_account_detail, my_account_update)
- Model: `PasswordResetToken`
- Auth backend: `CookieTokenAuthentication`
- URLs: `urls/auth.py`
- Tests: `tests/auth/`, `tests/password_reset/`
- Register the new `accounts` app in `INSTALLED_APPS`

**Frontend** — consolidate all login/account UI into `components/resources/account/`:
- `MyAccount`, `RecoverPassword`, and `Register` pages already live there
- Move `LoginModal.jsx`, `LoginModalController.js`, and `LoginModalHelper.jsx` from `components/common/modals/` into `components/resources/account/`, alongside the other account pages

## Benefits
- Clear separation of concerns between gameplay code and account/authentication code
- Easier to navigate and test account-related logic independently of `games`
- Matches the existing per-app modular structure already used elsewhere in the backend
- Login UI lives alongside the rest of the account-related frontend code instead of being split across two unrelated folders
