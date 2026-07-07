# Plan: Add NPC enemy/foe field with filters

Issue: [360-add-npc-enemy-foe-field-with-filters.md](../issues/360-add-npc-enemy-foe-field-with-filters.md)

## Overview

Add two allegiance fields to the shared `Character` model (`allegiance` — real, DM/admin-only
visible; `public_allegiance` — what regular players see), both defaulting to `neutral`, editable
only by a GameMaster/superuser. Expose them through the existing detail/full and
list/list-all serializer pairs (public endpoints surface a single `allegiance` key sourced from
`public_allegiance`; DM/admin endpoints surface both real fields), support `?allegiance=`
filtering on both NPC list endpoints, and render a colored border (green/red/gray) on the NPC
card and NPC show-page picture reflecting the allegiance value visible to the current user.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- **Public API** (`GET /games/<slug>/npcs.json`, `GET /games/<slug>/npcs/<id>.json`, and, as an
  accepted side effect of reusing the shared `Character` serializers, `GET /games/<slug>/pcs.json`
  / `GET /games/<slug>/pcs/<id>.json` too) returns a single JSON key `allegiance` (string:
  `"ally"` / `"enemy"` / `"neutral"`), sourced from the model's `public_allegiance` field.
- **DM/admin API** (`GET /games/<slug>/npcs/all.json`, `GET /games/<slug>/npcs/<id>/full.json`,
  and, likewise as a shared-serializer side effect, `GET /games/<slug>/pcs/<id>/full.json`)
  returns **both** `allegiance` (sourced from the real `allegiance` model field) and
  `public_allegiance` (sourced from the `public_allegiance` model field) as separate JSON keys.
  This is a deliberate exception to the usual "each field keeps its own JSON key" convention —
  it lets frontend rendering code always read a single `character.allegiance` key regardless of
  which endpoint/role served the data, exactly as specified by the issue's acceptance criteria.
- Both list endpoints (`npcs.json`, `npcs/all.json`) accept an optional `?allegiance=` query
  param (`ally`/`enemy`/`neutral`; any other value is ignored, same tolerant-filter convention as
  `?slain=`). On `npcs.json` it filters on `public_allegiance`; on `npcs/all.json` it filters on
  the real `allegiance` field.
- Only a GameMaster of the character's game, or a superuser, may set/change `allegiance` or
  `public_allegiance` via `PATCH /games/<slug>/npcs/<id>.json` (enforced by the existing
  `CharacterEditPermission`, which — since NPCs have no player owner by product definition —
  already reduces to "GameMaster or superuser" for NPCs; see `docs/agents/product.md`).
- Frontend renders a border color from the single `allegiance` value present on whatever payload
  it received (`border-success` for `ally`, `border-danger` for `enemy`, `border-secondary` for
  `neutral`), applied only when rendering an NPC (`characterType === 'npc'` / `!character.is_pc`).

## Notes (architect-owned follow-up)

- `docs/agents/access-control.md` will be updated by the architect in this PR (not delegated) to
  document the new `allegiance`/`public_allegiance` fields and their read/write/filter rules, and
  to add the previously-undocumented `GET /games/<slug>/npcs/all.json` endpoint to the Character
  section (it was only referenced indirectly from the Treasure section before this issue).
- Consulted the `product-owner` agent before writing this plan (access-rule and new-field
  question). Confirmed: `CharacterEditPermission` is the correct, already-established mechanism
  for the DM-only write restriction (no new permission class needed). Flagged the "same
  `allegiance` JSON key sourced from a different model field per endpoint" design as a deliberate,
  explicit exception (see Shared contracts above) rather than an oversight, since it comes
  directly from the issue's own acceptance criteria.
