# Plan: Add NPC slain

Issue: [315-add-npc-slain.md](../issues/315-add-npc-slain.md)

## Overview

Add a shared `slain` boolean field to the `Character` model (both PCs and NPCs
carry the column, but only NPC surfaces get UI to change it). The backend
exposes `slain` as a read-only field on the existing character list/detail
serializers and adds one new NPC-only action endpoint
(`PATCH /games/<slug>/npcs/<id>/slain.json`) that toggles it, reusing the
existing `CharacterEditPermission` check (superuser, the game's DM, or — in
practice never, since NPCs have no player — the character's own player). The
frontend renders the character's profile photo in grayscale everywhere it
appears (NPC index cards, NPC show page, and anywhere else the profile photo
is used) when `slain` is true, except on the character's own photo gallery
page; it adds a "Slain"/"Revive" overlay button (visible only to editors) next
to the existing "Upload Photo" overlay button on the NPC index cards and the
NPC show page, with the upload button moved to the left and the new button on
the right, both guarded by a confirmation modal. The proxy's cache-cleanup
config is extended so toggling `slain` invalidates the same cached NPC routes
that toggling any other NPC field already invalidates. New user-facing
strings get translation keys.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [proxy](proxy.md)
- [translator](translator.md)

## Shared contracts

### New endpoint (backend produces, frontend consumes)

| Method | URL | Who can call | Body | Response |
|---|---|---|---|---|
| `PATCH` | `/games/<slug>/npcs/<id>/slain.json` | Player of that character, any GameMaster of that game, or superuser (`CharacterEditPermission`, same class already used by the photo-set/photo-upload endpoints) | `{"slain": true|false}` | `200 {"slain": true|false}` reflecting the new stored value |

- Unauthenticated → `401`. Authenticated but not an editor → `403`.
- Unknown `game_slug`/`character_id`, or a `character_id` that isn't an NPC
  of that game → `404` (mirrors `game_npc_photo_set`'s `_find_character`
  lookup).
- Missing/non-boolean `slain` in the body → `400` (mirrors how
  `PhotoUploadSerializer` validates `filename`).
- There is **no** equivalent PC endpoint — matches the existing `hidden`
  field precedent (`hidden` is a real column on the shared `Character` model,
  but only NPC endpoints ever read/write it).

### Field exposed (backend produces, frontend consumes)

`slain` (boolean, read-only) is added to **both** `CharacterListSerializer`
and `CharacterDetailSerializer` — the same classes already shared by the
PC and NPC list/detail endpoints — so:

- `GET /games/<slug>/pcs.json`, `/games/<slug>/npcs.json` → each item gains
  `"slain": false|true`.
- `GET /games/<slug>/pcs/<id>.json`, `/games/<slug>/npcs/<id>.json` → the
  body gains `"slain": false|true`.

For PCs this is always `false` in practice (no endpoint/UI ever sets it),
exactly like the existing `hidden` column. The frontend renders grayscale
based on this field alone — it does not special-case PC vs. NPC in the
rendering logic itself, only in which components render the toggle button.

### Frontend rendering contract

- Grayscale is applied wherever a character's `profile_photo_path` is shown
  via `CardAvatar` inside `PhotoUploadOverlay` (NPC index card, NPC show
  page — and, harmlessly, the PC equivalents, since `slain` is always
  `false` there), driven by a new `grayscale` prop on `PhotoUploadOverlay`.
  It is **not** applied on the character's own photo gallery page
  (`NpcCharacterPhotos`/`PcCharacterPhotos`), which renders separate `Photo`
  records, not the profile photo, and is unaffected by this issue.
- The Slain/Revive overlay button is rendered via a new `secondaryButton`
  slot on `PhotoUploadOverlay`, only passed in by NPC-specific call sites
  (`CharacterCardHelper` for `characterType === 'npc'`, and `CharacterHelper`
  for `!character.is_pc`), gated on the same `can_edit`/`canEdit` value
  already used to gate the upload button. Clicking it opens a new generic
  confirmation modal (`SlainConfirmModal`, modeled after `PhotoUploadModal`)
  before calling the new endpoint via `CharacterClient.setNpcSlain(...)`.

### Cache invalidation contract (proxy consumes the same route names backend produces)

The new `PATCH /games/<slug>/npcs/<character_id>/slain.json` route must be
added to the `custom` cache-cleanup map in
`proxy/dev_configuration/rules/backend.php` and
`proxy/prod_configuration/rules/backend.php`, invalidating the exact same
target list already used for `/games/:game_slug/npcs/:character_id.json`
(added in issue #324):

```
'/games/:game_slug/npcs.json',
'/games/:game_slug/npcs/all.json',
'/games/:game_slug/npcs/:character_id.json',
'/games/:game_slug/npcs/:character_id/full.json',
```

### Translation keys (translator produces, frontend consumes via `Translator.t()`)

New keys for the Slain/Revive button label and the new confirmation modal
(see `translator.md` for exact names) — the existing `photo_upload_modal.title`
key is reused unchanged for the "Upload Photo" button, no new key needed
there.

## Notes

- `product-owner` was consulted before writing this plan: exposing `slain`
  publicly (like `profile_photo_path`) while restricting writes to
  `CharacterEditPermission`, and scoping the toggle UI/endpoint to NPCs only
  (mirroring the existing `hidden` field precedent), are both consistent
  with the documented product model. See `docs/agents/product.md` and
  `docs/agents/access-control.md`.
- `data-access` review must be invoked once `backend` is done (new endpoint,
  new serializer field) — `docs/agents/access-control.md` must be updated in
  the same PR (see `backend.md`).
- `security` review should also be invoked once `backend`/`proxy` are done
  (new endpoint with user input handling).
