# Plan: Staff Can Edit Pc Money

Issue: [615-staff-can-edit-pc-money.md](../../issues/615-staff-can-edit-pc-money.md)

## Overview

Add a quick money-edit affordance directly on the PC/NPC show pages, so admin/dm/staff (and,
for PCs only, the owning player) can adjust a character's money without opening the full
character edit page. This requires: a new narrow backend endpoint per character kind
(`PUT .../pcs/<id>/money.json`, `PUT .../npcs/<id>/money.json`) gated by a new permission class
that layers a global Staff bypass on top of the existing `CharacterEditPermission` rule; a new
`can_edit_money` field on the character detail/full serializers so the frontend knows whether to
show the edit link at all; and frontend wiring that extends the existing `CharacterMoney`
element with an optional edit link/modal, reusing the same `MoneyEditModal` already used on the
edit page.

Note: the issue text writes the new endpoint paths without a `.json` suffix
(`PUT /games/:game_slug/pcs/:id/money`). Every existing endpoint in this codebase ends in
`.json` (required for Tent to route the request to Django instead of the SPA/static files — see
`docs/agents/architecture.md`), so the real routes are `PUT /games/<slug>/pcs/<id>/money.json`
and `PUT /games/<slug>/npcs/<id>/money.json`.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### New endpoints

- `PUT /games/<slug>/pcs/<id>/money.json`
- `PUT /games/<slug>/npcs/<id>/money.json`

Request body: `{"money": <non-negative integer>}` (required).

Who can call: admin (superuser), that game's DM (GameMaster), any Staff account
(`user.is_staff`, global), and — for PCs only — the PC's own owning player. A regular player can
never call the NPC route (NPCs have no owner, so only admin/dm/staff pass). Enforced by a new
`CharacterMoneyEditPermission` (`backend/games/permissions.py`): `user.is_staff or
character.can_be_edited_by(user)`.

Responses:
- `200` — same body shape as `GET /games/<slug>/pcs/<id>.json` / `.../npcs/<id>.json`
  (`CharacterDetailSerializer`), with header `X-Skip-Cache: true` (same convention as
  `full.json`).
- `400` — `{"errors": {"money": [...]}}` when `money` is missing, non-integer, or negative.
- `401` — unauthenticated.
- `403` — authenticated but not authorized (e.g. a regular player calling the NPC route, or any
  non-admin/dm/staff/owner on either route).
- `404` — unknown `game_slug`/`character_id`, or `character_id` belongs to the other
  PC/NPC kind.

### New field: `can_edit_money`

Added to `CharacterDetailSerializer` (and inherited by `CharacterFullSerializer`), returned on
`GET/PATCH .../pcs/<id>.json`, `.../npcs/<id>.json`, and `.../full.json`. Boolean, computed the
same way as the new permission's check: `user.is_staff or character.can_be_edited_by(user)`.
The frontend uses this field — not the existing `can_edit` — to decide whether to render the
money "Edit" link, since a pure Staff account may edit money without being a full editor
(`can_edit` stays `false` for it, exactly as today).

### Frontend reload behavior after save

After a successful `PUT .../money.json`, the frontend closes the modal and re-runs the existing
page-load effect (`controller.buildEffect()()`), which already implements exactly the reload
rule the issue asks for: it fetches the plain detail endpoint, then additionally loads
`full.json` only when `character.can_edit` is `true` — no new logic needed for this part.

## Notes

- No `infra`/`proxy` work: Tent routes every `*.json` path to Django generically (no
  per-endpoint allowlist to update), and Navi's cache-warming config
  (`.circleci/navi_config.yaml`) only pre-fetches public, cacheable `GET` endpoints — this is a
  `PUT`, always `X-Skip-Cache: true`, so it must NOT be added there.
- After `backend` finishes, the architect will dispatch `data-access` and `security` review
  (new endpoint + new serializer field + new authorization logic) before opening the PR, per
  standing project instructions, and will update `docs/agents/access-control/character.md`,
  `common-rules.md`, and `docs/agents/product.md` in the same PR.
