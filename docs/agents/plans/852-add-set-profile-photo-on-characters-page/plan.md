# Plan: Add set profile photo on characters page

Issue: [852_add-set-profile-photo-on-characters-page.md](../../issues/852-add-set-profile-photo-on-characters-page.md)

## Overview

Widen the "set as profile photo" backend permission so it matches the existing photo-upload
permission (superuser, DM, owning player, any player of the game, any Staff account), expose that
as a new `can_set_profile_photo` field on the character detail serializer, and use it on the
frontend to add the same hover "set as profile photo" action button to the character show page's
photo preview grid — reusing the existing `PhotoCard`/`PhotoCardHelper` component already used on
the photos sub-page, and the `handleSetProfilePhoto` wiring already present in `CharacterDetail.jsx`.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

`CharacterDetailSerializer` (`backend/games/serializers/characters/character_detail.py`) gains a
new read-only boolean field:

- **`can_set_profile_photo`** (bool) — whether the requesting user may set one of this
  character's photos as its profile photo. Computed via
  `CharacterPhotoUploadPermission.is_allowed(user, character)` (the same rule already used for
  photo uploads, made public — see backend plan). Returned on the same endpoints that already
  return `can_edit`/`can_edit_money`/`can_exchange_treasure`: `GET /games/<slug>/pcs/<id>.json`
  and `GET /games/<slug>/npcs/<id>.json` (and inherited onto `full.json`).

The frontend replaces every existing use of `character.can_edit` as the gate for "may this user
set a profile photo" with `character.can_set_profile_photo` (see frontend plan for the exact call
sites) — `can_edit` stays unchanged for actual character-edit gating (Edit button, etc.).
