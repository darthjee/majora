# Issue: Backend — Add documents PATCH endpoint with permissions

## Problem
`PATCH /games/:game_slug/documents/:id.json` does not exist yet — `game_document_detail.py` only implements `GET` (returns `GameDocumentDetailSerializer` for non-hidden documents). There is no `GameDocumentUpdateSerializer` and no permission tier gating a document edit. The `/#/games/:game_slug/documents/:id/edit` frontend route currently only handles photo upload (see the "photo-upload-only" comment in `documentShowType.js`).

Part of #944 (sub-issue 3 of 3 — see #944 for the layer-split rationale). Sibling sub-issue #1097 covers the equivalent PATCH-permission work for possessions/items/factions (which already have a PATCH handler, just gated by the wrong check); sibling sub-issue #1099 covers the frontend Edit-button visibility, and depends on the permission tier this issue creates.

## Expected Behavior
- `PATCH /games/:game_slug/documents/:id.json` accepts a partial update of `name`, `description`, and `hidden` and returns the updated document.
- admin and dm keep edit access, as always (via `EndpointPermission`'s built-in admin/dm shortcut).
- staff and player also gain edit access.
- all other roles/unauthenticated requests are rejected (401/403), same shape as the other three PATCH endpoints.

## Solution
- Add a `regular.edit: [staff, player]` tier to `backend/permissions/config/game_document/endpoints.yml`, alongside the `create`/`photo_upload`/`file_upload`/`file_photo_upload` tiers already defined there. This uses the `edit` tier name that sibling sub-issue #1097 already settled on for possessions/items/factions (not `create_update`, the name used by the older `game_pc_item` precedent from #864 cited in this issue's original description) — keeping the tier name consistent across all four resources.
- Create `backend/permissions/config/game_document/ui.yml` (none exists yet) with a matching `edit: [staff, player]` entry, mirroring `game_pc_item/ui.yml`'s shape — forward-looking config for the frontend Edit-button work tracked in #1099.
- Add a `GameDocumentUpdateSerializer` (new file under `backend/games/serializers/games/documents/`, exposed via `games/serializers/__init__.py`) exposing `name`, `description`, `hidden` as optional fields — mirroring `GamePossessionUpdateSerializer`'s shape exactly, since `GameDocument` has the same three editable fields.
- Extend `game_document_detail.py`: change `@api_view(['GET'])` to `@api_view(['GET', 'PATCH'])`, and branch to a new `_update_document` helper (mirroring `game_possession_detail.py`'s `_update_possession`) that:
  - checks `EndpointPermission(request.user, game=game).check(request, 'game_document', 'regular', 'edit')` (the `'game_document'` resource key already matches the config folder and the string used elsewhere in this file, e.g. `game_document_photo_upload.py`),
  - looks up the document via `game.documents.all()` (unfiltered by `hidden`, matching `game_possession_detail.py`'s update path — a document being edited need not be excluded just because it's hidden),
  - validates via `GameDocumentUpdateSerializer` with `partial=True`, saves, and returns `GameDocumentDetailFullSerializer` (already exists, includes `hidden`).
- Add tests mirroring the existing `game_possession_detail` PATCH tests (permission matrix across admin/dm/staff/player/other, plus payload validation).

## Benefits
- Staff and players can edit game documents they should have access to, matching the already-correct `create`/`photo_upload` permissions for the same resource.
- Completes the fourth (and last) of the four PATCH endpoints covered by #944, keeping possessions/items/factions/documents consistent.
- Unblocks the frontend Edit-button fix tracked in #1099, which needs a real `game_document` permission tier to key off of.
