# Plan: Remove old photos urls

Issue: [262-remove-old-photos-urls.md](../../issues/262-remove-old-photos-urls.md)

## Overview

Retire the legacy `Game.photo` and `Character.avatar_url` URL fields now that both entities
have a proper in-app photo upload mechanism (`cover_photo_path` from issue #254,
`profile_photo_path` from issue #255). The backend drops the fields from the models,
migrations, and serializers; the frontend stops sending/reading them and removes the
corresponding form inputs, falling back solely to the uploaded-photo fields (with the
existing `CardPhoto`/`CardAvatar` placeholder behavior when no photo has been uploaded yet);
the translator agent removes the now-unused labels.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

After the backend change lands, the following API responses no longer include `photo` /
`avatar_url` at all (not even as `null`):

- `GET /games.json`, `GET /games/<slug>.json` — `GameListSerializer` / `GameDetailSerializer`
  drop `photo`. `cover_photo_path` remains the sole photo field (already present, unchanged
  shape: string relative path or `null`).
- `PATCH /games/<slug>.json` (`GameUpdateSerializer`) and `POST /games.json`
  (`GameCreateSerializer`) no longer accept a `photo` field in the request body; sending one
  is simply ignored (not a validation error), since it stops being declared on the serializer.
- `GET /games/<slug>/pcs.json`, `GET /games/<slug>/npcs.json`,
  `GET /games/<slug>/pcs/<id>.json`, `GET /games/<slug>/npcs/<id>.json`, and the `/full.json`
  variants — `CharacterListSerializer` / `CharacterDetailSerializer` / `CharacterFullSerializer`
  drop `avatar_url`. `profile_photo_path` remains the sole photo field (unchanged shape).
- `PATCH /games/<slug>/pcs/<id>.json`, `PATCH /games/<slug>/npcs/<id>.json`
  (`CharacterUpdateSerializer`) no longer accept `avatar_url` in the request body.

The frontend must stop reading `game.photo` / `character.avatar_url` from any API response and
stop sending them in create/update payloads, relying only on `cover_photo_path` /
`profile_photo_path` (already the preferred source in the current fallback expressions
`game.cover_photo_path || game.photo` and `character.profile_photo_path || character.avatar_url`
— this plan removes the `|| game.photo` / `|| character.avatar_url` half of each).

Backend work (model fields, migration, serializers) must land before/independently of frontend
work in the same PR — since both live in one repo and one PR, order them backend-first so the
frontend diff is reviewed against the final contract, but there is no separate deploy boundary
to coordinate here.
