# Plan: Players should be able to update PC

Issue: [865-players-should-be-able-to-update-pc.md](../issues/865-players-should-be-able-to-update-pc.md)

## Overview

Today a PC can only be edited (all fields) via `PATCH /games/:game_slug/pcs/:id/full.json`,
gated by `CharacterEditPermission` (superuser, GameMaster, or the PC's own owning player). This
plan adds a second, narrower write path: a brand-new `PATCH /games/:game_slug/pcs/:id.json`
endpoint (the plain "detail" route is `GET`-only today) that accepts only `name`, `role`,
`public_description`, `money`, and `links`, and is open to a wider audience — any player of the
game, and any Staff account, in addition to dm/admin/owner — mirroring the existing
`CharacterMoneyEditPermission`/`CharacterPhotoUploadPermission` "PC-only, any player of the game"
precedent (issues #615/#619/#625). `full.json`'s own permission and field set (including
`private_description`, `hidden`, `allegiance`) stay completely unchanged. The frontend opens the
PC show page's Edit button and the edit page itself to this same wider audience, and hides the
private-only fields (DM notes) from anyone who isn't a full editor (dm/admin/owner) — reusing
fields (`can_edit`, `is_player`, `is_staff`, `can_edit_money`) the frontend already fetches today,
no new access-check plumbing required.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- **New endpoint**: `PATCH /games/:game_slug/pcs/:id.json` (the existing plain PC detail route,
  today `GET`-only). Request body accepts a subset of `PATCH .../full.json`'s fields:
  `name`, `role`, `public_description`, `money`, `links` (same `links` array shape as
  `full.json`: `[{text, url}, ...]`, capped by the same `validate_links_count`). Response body,
  on success, is the same `CharacterDetailSerializer` shape the `GET` variant of this same route
  already returns (identical to today's success shape for `full.json`/`money.json`).
- **Permission**: allowed for the game's superuser/staff, GameMaster, the PC's owning player, or
  *any other player of the game* — i.e. broader than `full.json`'s `CharacterEditPermission`,
  never narrower. Frontend has no new field to fetch to know this — the existing merged
  `character.can_edit` (full editor), `character.is_player`, and `character.is_staff` (already
  fetched via `AccessStore`'s access/permissions calls, see `CharacterAccessResolver.merge`)
  already fully describe who reaches this new endpoint: `can_edit` → full editor (uses
  `full.json`); `!can_edit && (is_player || is_staff)` → regular editor (uses the new endpoint).
  `resolveVariant`/`RequestPermissionResolvers`/`pcConfig.js` already route PATCH calls this way
  today (the `regular` variant was reserved for exactly this) — **no frontend routing changes
  are needed**, only the button/page-access gating and the edit form's field visibility.
- **Field visibility split** (frontend edit form): `name`, `role`, `public_description`, `money`,
  `links` are visible/editable to both editor tiers; `private_description` (DM notes) stays
  visible only to a full editor (dm/admin/owner) — confirmed with the issue author. `hidden` and
  `allegiance`/`slain` are NPC-only concepts and are not rendered on the PC edit page at all
  today, so they need no gating change.
- Nothing in this issue touches NPCs — `game_npc_detail.py`, `NpcPlayerEditPermission`, and the
  NPC edit page's field gating are all unaffected.

## Notes

- No new backend serializer field is required to drive the frontend's button/page-level gating
  (`can_edit`/`is_player`/`is_staff` already exist and are already merged onto the character
  object client-side before either page renders).
- `frontend/assets/js/utils/requests/config/pcConfig.js`'s own docstring literally says the
  `regular` PATCH variant is "reserved for a future issue that adds player-writable PC updates" —
  this is that issue; update the docstring alongside the code that finally exercises it.
