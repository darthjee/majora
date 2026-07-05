# Issue: Add my profile page

## Description
Currently there is no way for a logged-in user to edit their own account information from the UI. The header conditionally shows Login/Register when logged out, and Logoff (plus a test-email button) when logged in, but there is no entry point for editing the account itself.

## Expected Behavior
- When the user is logged in, the header shows an icon-only button (using a new image asset, with descriptive alt text) that navigates to `/#/my_account`.
- The `/#/my_account` page lets the logged-in user edit their username, email, and password.
  - Username and email are editable and must each remain unique across all users (checked on save, excluding the current user).
  - Password is optional: leaving it blank keeps the current password unchanged; filling it in requires a matching password confirmation field, same as registration. No current-password re-entry is required to change it.
- Only the authenticated user can edit their own account through the endpoint; the endpoint always acts on the requesting user (`request.user`), never a different user id.

## Solution
- Frontend: register a new `/my_account` route (`HashRouteResolver`) and page entry (`AppHelper` `PAGES`), adding a MyAccount page/component/controller/helper following the existing Register.jsx Component/Helper/Controller split.
- Header: add a new icon-only button/link, shown only when `state.loggedIn` is true, alongside the existing Logoff button, using a new small icon asset added to `frontend/assets/images` (referenced the way `CardAvatar` imports `defaultCharacterPhoto`).
- Backend: add an endpoint under `games/views/auth` (e.g. update-account), protected by `IsAuthenticated`, operating only on `request.user`, validating username and email uniqueness excluding the current user, and supporting partial updates (name/email always required, password + confirmation optional together).
