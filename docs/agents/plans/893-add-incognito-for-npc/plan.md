# Plan: Add incognito for NPC

Issue: [893-add-incognito-for-npc.md](../../issues/893-add-incognito-for-npc.md)

## Overview

Add a new `incognito` boolean to the shared `Character` model, mirroring how the existing
`hidden` boolean is modeled and exposed today: private-only on the DM/admin NPC endpoints, a
new switch on the NPC create/edit forms, and a DM/admin-only info badge on the NPC list and show
pages. Unlike `hidden` (which excludes/404s a character entirely), an `incognito` NPC stays fully
visible on the public endpoints — the only public-facing effect is that `profile_photo_path` is
returned as `null` while `incognito` is `true`. This is a new mechanic (no existing field
conditionally nulls another field), so the backend plan calls it out explicitly.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

- **Model field**: `Character.incognito` — `BooleanField(default=False)`, shared by PC and NPC
  (no PC form/badge wired up in this issue, matching `hidden`'s shape).
- **Private wire field** (`incognito`, boolean): present only on `CharacterFullSerializer`
  (`GET/PATCH /games/<slug>/npcs/<id>/full.json`) and `CharacterFullListSerializer`
  (`GET /games/<slug>/npcs/all.json`), writable via `CharacterCreateSerializer`
  (`POST /games/<slug>/npcs/full.json`) and `CharacterUpdateSerializer` (the same `full.json`
  PATCH). Never present on `NpcPlayerCreateSerializer`/`NpcPlayerUpdateSerializer` — a regular
  player can never read or write it, mirroring `hidden` exactly.
- **Public side effect** (no `incognito` key exposed): on `CharacterDetailSerializer`/
  `CharacterListSerializer` (`GET /games/<slug>/npcs.json`, `GET /games/<slug>/npcs/<id>.json`),
  `profile_photo_path` becomes `null` when the character's `incognito` is `true` (i.e. the
  private/full endpoints keep returning the real path regardless).
- **Precedence**: if a character is both `hidden` and `incognito`, `hidden`'s existing
  visibility gate (404 on the plain detail route, exclusion from the public list) applies
  first/unconditionally — `incognito` has no observable effect on a hidden character.
- **Frontend consumption**: the frontend never needs a dedicated `?role=`/permission check for
  the incognito badge — it relies on the same DM/admin-only data-shape gate `hidden` already
  uses (the `incognito` field, like `hidden`, is only present in the payload when the NPC list/
  detail was fetched through the `all.json`/`full.json` DM/admin path). See
  `frontend.md` for the exact rules-file hook.

## Notes

- No new permission class is needed anywhere — `incognito` reuses **CharacterEdit** exactly like
  `hidden` (same `full.json` routes, same `CharacterCreateSerializer`/`CharacterUpdateSerializer`).
- `docs/agents/access-control/character.md` (an "Incognito field" section mirroring "Hidden
  field") is updated as part of the backend work, since it's the doc of record for this new
  field's exposure/write rules.
