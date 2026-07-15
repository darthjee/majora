# Plan: Allow Npc Edit

Issue: [445-allow-npc-edit.md](../issues/445-allow-npc-edit.md)

## Overview

Let any player of the game reach `/#/games/:game_slug/npcs/:id/edit` (today it redirects away
unless the viewer is dm/admin), and submit a narrower field set through the existing
player-facing `PATCH /games/:game_slug/npcs/:id.json` route instead of the dm/admin-only
`full.json` route. This generalizes the existing single-field `slain` toggle (#416) into a
small player-editable field set (`public_description`, `links`, `allegiance`, `slain`), without
touching `full.json`/`CharacterEditPermission` at all.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

**`PATCH /games/:game_slug/npcs/:id.json`** (gated by the existing `NpcPlayerEditPermission` —
no permission change) accepts a widened body, all keys optional, any other key ignored:

```json
{
  "public_description": "string",
  "allegiance": "'ally' | 'enemy' | 'neutral' — writes Character.public_allegiance",
  "slain": "boolean — writes Character.public_slain (unchanged from today)",
  "links": [
    {
      "id": "int, only present for an already-persisted link",
      "text": "string",
      "url": "string",
      "link_type": "string",
      "delete": "boolean"
    }
  ]
}
```

- Response shape is unchanged from today: `200` with the same `CharacterDetailSerializer` body
  `GET` returns on this route (`X-Skip-Cache: true`); `400` with `{"errors": {...}}` on
  validation failure — the same contract `BaseCharacterEditController#handleResponse` (frontend)
  already expects from `full.json`, so no new response-handling branch is needed on the frontend
  beyond picking which URL/body to send.
- `name`, `role`, `money`, and `private_description` are **not** part of this body — those stay
  `full.json`/`CharacterEditPermission`-only (dm/admin), unchanged.
- The character detail payload already carries a `can_edit` flag (dm/admin, from
  `permissions.json`) and an `is_player` flag (from `access.json`) — the frontend's
  `CharacterController#fetchAndMergeAccess` already merges both onto the loaded character today.
  The frontend uses `is_player` (not a new field) to decide whether to show the narrower form
  and submit path; no new access-endpoint field is needed from the backend for this.
