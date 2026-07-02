# Plan: Add cover photo to games

Issue: [254-add-cover-photo-to-games.md](../issues/254-add-cover-photo-to-games.md)

## Overview

Add a `cover_photo` FK from `Game` to `GamePhoto`, automatically populated the
first time a `GamePhoto` upload finishes processing for that game. Expose the
resolved path as `cover_photo_path` on the Game list/detail API, and have the
frontend prefer it over the legacy `game.photo` URL wherever a game's cover
image is rendered. Along the way, remove the dead `GamePhoto.url` field.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- `GameListSerializer` and `GameDetailSerializer` both gain a read-only field
  `cover_photo_path`:
  - Type: `string | null` (absent value serializes as `null`, matching
    Django REST Framework's default behavior for a nullable
    `SerializerMethodField`/related field).
  - Value: `game.cover_photo.path` (the raw relative storage key, unmodified)
    when `game.cover_photo` is set, else `null`.
  - This field is additive — the existing `photo` field on both serializers
    is untouched and keeps being returned as before.
- Frontend consumption: wherever `game.photo` is currently passed as the
  `url` prop to the shared `CardPhoto` element (`GameCardHelper.jsx` game
  list card, and `GameHelper.jsx` game detail page), it is replaced with
  `game.cover_photo_path || game.photo`. No other usage of `game.photo`
  changes (e.g. the game edit form keeps reading/writing `game.photo`
  as-is).
