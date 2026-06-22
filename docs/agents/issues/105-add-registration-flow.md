# Issue: Add registration flow

## Description
Add a user registration flow to the application, accessible at `/#/users/register`. After a successful registration, a welcome e-mail is sent to the new user, gated behind an environment-variable setting. Registration should also be discoverable from the login screen and the header for logged-out users.

## Problem
- There is currently no page or flow for new users to register an account.
- There is no mechanism to send a welcome e-mail on registration.
- E-mail sending is not currently gated by an environment-based setting, so it could fire even in environments where it shouldn't.
- There is no link to registration from the login modal or the header.
- There is no validation ensuring registration requests only accept the expected fields.

## Expected Behavior
- A new page exists at `/#/users/register` allowing a user to register, with fields: name, e-mail, password, and password confirmation.
- The e-mail must be unique and must match a valid e-mail format.
- Password strength is not validated at this stage.
- The registration endpoint rejects requests that include any field other than name, e-mail, password, and password confirmation.
- On successful registration, the user is automatically logged in (no separate login step required).
- A simple welcome e-mail (no confirmation/verification link) is sent to the user.
- Whether the welcome e-mail (and any e-mail sending in general) is actually sent depends on the `EMAILS_ENABLED` environment variable.
- All e-mail sending is blocked by default and only enabled when `EMAILS_ENABLED` is explicitly set to `true`.
- A "register" link is added to the login modal.
- A "register" link is added to the header, next to the login link, visible only when the user is not logged in.

## Solution
- Add a registration page/route at `/#/users/register` with a form containing name, e-mail, password, and password confirmation.
- Add a backend endpoint to handle registration requests:
  - Validate e-mail format and uniqueness.
  - Reject any extra/unexpected fields beyond name, e-mail, password, and password confirmation.
  - Log the user in automatically upon successful registration.
- Implement a simple welcome e-mail (no confirmation link) sent upon successful registration.
- Introduce the `EMAILS_ENABLED` environment variable to gate all outgoing e-mails; e-mail sending should be a no-op unless this variable is set to `true`.
- Add a "register" link to the login modal.
- Add a "register" link to the header, shown alongside the login link only for logged-out users.

## Benefits
- Allows new users to create accounts without manual intervention.
- Provides a safe, opt-in mechanism for e-mail notifications, preventing unintended e-mail sends in non-production environments.
- Improves discoverability of the registration flow from both the login modal and the header.

---
See issue for details: https://github.com/darthjee/majora/issues/105
