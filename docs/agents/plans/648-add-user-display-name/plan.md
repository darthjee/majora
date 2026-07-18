# Plan: Add user display name

Issue: [648-add-user-display-name.md](../issues/648-add-user-display-name.md)

## Overview

Adds a `display_name` field to `UserProfile` (unique, required at registration), seeded from
`username` for every existing user via a data migration. The two serializers that currently
leak another user's real `username` to other players — `SessionMessageUserSerializer` (session
chat authors) and `PollVoteUserSerializer` (poll voters, which subclasses it) — switch to
`display_name`. `/#/my_account` (self) and `/#/staff/users` (staff) keep showing/editing the
real `username` unchanged, and separately gain the ability to view/edit `display_name`.
`/#/register` gains a required `display_name` field. Frontend adds the new form fields on
`MyAccount`/`Register` and updates the two rendering spots that display another user's `name`
(session messages, poll voter tooltips) — no visible change needed there since they already
just render `user.name`, which will now resolve to the display name server-side.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

**Endpoints whose response shape changes:**
- `GET /users/account.json` (`MyAccountDetailSerializer`) — gains `display_name: string`
  alongside the existing `name` (real `username`), `first_name`, `last_name`, `email`,
  `avatar_url`.
- `PATCH /users/account.json` (`MyAccountUpdateSerializer`) — accepts `display_name` in the
  request body (required, validated for uniqueness against other users' `UserProfile.display_name`
  values), in addition to the existing `name`, `first_name`, `last_name`, `email`, `password`,
  `password_confirmation`. On a `400` validation error, an invalid/duplicate `display_name`
  returns `errors.display_name` (same shape as the existing `errors.name`/`errors.email`).
- `POST /users/register.json` — request body gains a required `display_name` key (alongside
  the existing `name`, `email`, `password`, `password_confirmation`); a duplicate value returns
  `{"error": "display name already exists"}` (same `{"error": ...}` shape already used for the
  duplicate-`name`/duplicate-`email` cases).
- Session message author (`user` field on `GET /games/:slug/sessions/:id/messages.json` and
  wherever else `SessionMessageUserSerializer` is embedded) and poll voter (`PollVoteUserSerializer`,
  embedded in poll results) — the existing `name` key now resolves to `UserProfile.display_name`
  instead of `User.username`. No key is added or removed; only the underlying value source
  changes, so no frontend code needs to change to consume it.

**Endpoints explicitly unaffected:** `GET/PATCH /staff/users.json`, `GET/PATCH
/staff/users/<id>.json` — keep exposing only `name` (real `username`) and `email`, exactly as
today. `display_name` is not exposed there in this issue.

**Field placement**: `display_name` (`CharField`, unique) lives on `UserProfile`
(`backend/games/models/user_profile.py`), not on `django.contrib.auth.models.User` — the model
already carries other per-account, non-auth attributes (`favorite_language`, `email_hash`).
