# Add NPC enemy/foe field with filters

## Context

Currently there is no way for a DM to mark an NPC's true disposition toward the party while independently controlling what regular players are told. There is also no visual cue in the frontend to help players quickly recognize an NPC's disposition.

NPCs need two allegiance fields, both defaulting to `neutral`:
- `allegiance`: the true allegiance, visible only to the DM/admin.
- `public_allegiance`: the allegiance shown to regular players.

Allowed values for both fields: `ally`, `enemy`, `neutral`.

## What needs to be done

- Backend: add `allegiance` and `public_allegiance` fields to the `Character` model (NPC), following the existing plain-constants-plus-choices convention used by `Upload.STATUS_*`, each defaulting to `neutral`.
- Backend: restrict editing of both fields to DM/admin via the existing game-edit permission check.
- Backend: extend `CharacterDetailSerializer` (and the list serializer used by the public `npcs.json` endpoint) to expose `public_allegiance` under the `allegiance` key.
- Backend: extend `CharacterFullSerializer` (and the list serializer used by `npcs/all.json`) to expose both `allegiance` and `public_allegiance`.
- Backend: extend `_filter_characters` (`source/games/views/characters/_shared.py`) to support an `allegiance` query param, filtering on `public_allegiance` for public endpoints and on `allegiance` for DM/admin endpoints.
  - Public API (`GET /games/:game_id/npcs.json`, `GET /games/:game_id/npcs/:id.json`) exposes a single `allegiance` field in the payload, sourced from `public_allegiance`.
  - DM/admin API (`GET /games/:game_id/npcs/all.json`, `GET /games/:game_id/npcs/:id/full.json`) exposes both the real `allegiance` and `public_allegiance` fields.
  - The field is queryable via `?allegiance=` on all NPC list endpoints; on the public endpoint the query param filters on `public_allegiance` (the query param name differs from the underlying field it targets), while on the DM/admin endpoint it filters on the real `allegiance` field.
- Frontend: add colored border styling (e.g. Bootstrap `border-success`/`border-danger`/`border-secondary` utility classes) to the NPC index card (`CharacterCardHelper.jsx`) and to the NPC show page picture wrapper, driven by the `allegiance` value returned to the current user.
  - Green border for `ally`.
  - Red border for `enemy`.
  - Gray border for `neutral`.
  - On the NPC index, the border surrounds the NPC card.
  - On the NPC show page, the border surrounds the picture.

## Benefits

- Lets the DM track and reveal NPC disposition independently of what players currently know.
- Gives players an immediate visual cue about an NPC's disposition without reading full descriptions.
- Reuses established codebase conventions for public/private field visibility and DM-only editing permissions.

## Acceptance criteria

- [ ] `Character` model has `allegiance` and `public_allegiance` fields (choices: `ally`, `enemy`, `neutral`; default `neutral`), with a migration.
- [ ] Only DM/admin (game-edit permission) can set or change `allegiance` and `public_allegiance`.
- [ ] `npcs.json` and `npcs/:id.json` expose a single `allegiance` field sourced from `public_allegiance`.
- [ ] `npcs/all.json` and `npcs/:id/full.json` expose both `allegiance` and `public_allegiance`.
- [ ] `?allegiance=` filters `npcs.json`/`npcs/all.json` on the correct underlying field per endpoint.
- [ ] NPC index card and NPC show page picture render a colored border (green/red/gray) reflecting the allegiance visible to the current user.

tags: :shipit:
