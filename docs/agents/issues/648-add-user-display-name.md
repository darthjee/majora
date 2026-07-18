# Issue: Add user display name

## Description
`User.username` currently serves two purposes: it is the credential used to log in, and it is also the name shown to other users wherever another user's name is displayed (e.g. session message authors, poll voters). This issue adds a `display_name` field so a user's login credential is never exposed to anyone other than themselves or staff.

This follows the existing "public vs regular attribute" convention documented in `docs/agents/access-control/principles.md` (e.g. `allegiance`/`public_allegiance` on `Character`): a restricted real value alongside a wider-audience public value. `display_name` lives on the existing `UserProfile` model (alongside `favorite_language`, `email_hash`), not on Django's built-in `User` model, and must be unique across users just like `username` is today.

## Problem
Any endpoint that returns another user's `name` (currently sourced from `username`) exposes that user's login credential to other players. Today this happens on session message authors and poll voters. Only the authenticated user themselves (`/#/my_account`) and staff (`/#/staff/users`) have a legitimate need to see the real `username`.

## Expected Behavior
- A new `display_name` field is added to `UserProfile`, seeded via migration as a copy of the existing `username` for every existing user (usernames are already unique, so the seeded values satisfy the new uniqueness constraint).
- Every endpoint that currently returns a user's `name` to a general audience (session message authors, poll voters) switches to returning `display_name` instead.
- The endpoints backing `/#/my_account` (self) and `/#/staff/users` (staff) keep returning the real `username`.
- `/#/my_account` gains an editable field for `display_name`, validated for uniqueness across users.
- `/#/register` gains a **required** field for `display_name` at signup, also validated for uniqueness.

## Solution
- Add `display_name` (unique, `CharField`) to `UserProfile`, with a data migration copying `username` into it for every existing user/profile.
- Update `SessionMessageUserSerializer` and `PollVoteUserSerializer` (the two serializers currently exposing another user's `username` as `name`) to source `name` from the linked `UserProfile.display_name` instead.
- Leave `MyAccountDetailSerializer` and the staff user serializers returning the real `username`; extend `MyAccountUpdateSerializer` to accept and validate (uniqueness) an editable `display_name`.
- Add `display_name` as a required, uniqueness-validated field to the registration flow.

## Benefits
Reduces exposure of the credential used for login, adding a layer of account security without changing how users identify each other in the app.
