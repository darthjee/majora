# Plan: Add character treasures

Issue: [297-add-character-treasures.md](../../issues/297-add-character-treasures.md)

## Overview

Add a through model (`CharacterTreasure`) linking `Character` to `Treasure` with a
non-negative `quantity`. Expose two new read-only nested endpoints (`.../pcs/<id>/treasures.json`
and `.../npcs/<id>/treasures.json`) mirroring the existing PC/NPC photos pattern. On the
frontend, show a 12-item preview on the character detail page with a link to a new
full-list page displaying name, quantity, and value. Creating/editing/removing
assignments is out of scope — management is via Django admin for now.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### New API endpoints (produced by backend, consumed by frontend)

- `GET /games/<slug:game_slug>/pcs/<int:character_id>/treasures.json`
- `GET /games/<slug:game_slug>/npcs/<int:character_id>/treasures.json`

Both:
- Are paginated using the existing `paginated_list_response` / `Paginator` convention
  (array body + `X-Page` / `X-Pages` / `X-Per-Page` headers, consumed via
  `GenericClient#fetchIndex`). Support the standard `page` / `per_page` query params.
- Return 404 when the game or character isn't found (character must belong to the game
  and match the `npc` flag for the given segment — same as existing `game_pc_detail` /
  `game_npc_detail` / `*_photos` views).
- For the NPC variant only: return 404 when `character.hidden` and the requesting user
  does not pass `character.can_be_edited_by(request.user)` — identical gate to
  `game_npc_detail` / `game_npc_photos`. The PC variant has no such gate (PCs are never
  hidden), matching `game_pc_detail` / `game_pc_photos`.
- No additional visibility/permission logic — reuse `character.can_be_edited_by`, do not
  invent new permission checks.
- Item shape (list serializer output), one object per `CharacterTreasure` row:

  ```json
  {
    "id": 12,
    "name": "Potion of Healing",
    "quantity": 3,
    "value": 50
  }
  ```

  `id` is the `CharacterTreasure` row id (not the `Treasure` id). `name` and `value` are
  sourced from the related `Treasure`. `quantity` is the through-model's own field.
  Both endpoints return the same shape — the frontend preview simply doesn't render
  `value`, and there is no separate "full" serializer/endpoint variant.

### Frontend routes (frontend-only, no backend involvement)

- `#/games/:game_slug/pcs/:character_id/treasures` → page key `pcCharacterTreasures`
- `#/games/:game_slug/npcs/:character_id/treasures` → page key `npcCharacterTreasures`

### New translation keys (produced by translator, consumed by frontend)

- `character_page.treasures_title` — preview section heading (e.g. "Treasures"). The
  "See all {{title}}" link text is **not** new — it reuses the existing
  `character_preview_section.see_all` key.
- `character_treasures_page.*` — full list page (`loading`, `title`, `name_column`,
  `quantity_column`, `value_column`). Exact key list is finalized in
  [translator.md](translator.md) together with [frontend.md](frontend.md).

## Notes

- Nested character sub-resources (photos, access, full, photo_upload) are **not** present
  in `.circleci/navi_config.yaml` today — only top-level list/detail resources are warmed.
  Following that existing precedent, the new treasures endpoints are not added to the Navi
  warm-up chain; no `infra` work is needed for this issue.
- This issue is read-only display; no create/update/delete endpoints, serializers, or UI
  are added for managing a character's treasure assignments (Django admin already covers
  that once `CharacterTreasure` is registered — see backend plan).
