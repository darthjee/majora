# Plan: Backend — Add documents PATCH endpoint with permissions

Issue: [1098-backend---add-documents-patch-endpoint-with-permissions.md](../issues/1098-backend---add-documents-patch-endpoint-with-permissions.md)

## Overview

Add `PATCH /games/:game_slug/documents/:id.json` to the existing GET-only `game_document_detail` view, gated by a new `regular.edit` permission tier (`staff`, `player`, plus the admin/dm shortcut `EndpointPermission` already gives for free). This is backend-only work: it mirrors the existing `game_possession_detail.py` PATCH implementation field-for-field, since `GameDocument` and `GamePossession` share the same editable shape (`name`, `description`, `hidden`).

## Context

Part of #944 (sub-issue 3 of 3). Sibling sub-issue #1097 does the equivalent PATCH-permission work for possessions/items/factions (which already had a PATCH handler, just gated by the wrong check) and already settled on the tier name `regular.edit` — this plan reuses that name for consistency. Sibling sub-issue #1099 (frontend Edit-button visibility) depends on the permission tier this plan creates.

The proxy cache-cleanup rule for this route is **already in place**: `proxy/extension/lib/configuration/cache_cleanup/documents.php` already lists `/games/:game_slug/documents/:document_id.json` as a trigger route (added ahead of time alongside the other document mutation routes) — no proxy changes are needed here.

## Implementation Steps

### Step 1 — Add the `regular.edit` permission tier

Add to `backend/permissions/config/game_document/endpoints.yml`, alongside the existing `create`/`photo_upload`/`file_upload`/`file_photo_upload` tiers under `regular`:

```yaml
regular:
  ...
  edit:
    - staff
    - player
```

### Step 2 — Create `game_document/ui.yml`

No `ui.yml` exists yet for `game_document`. Create `backend/permissions/config/game_document/ui.yml`, mirroring `game_pc_item/ui.yml`'s shape:

```yaml
edit:
  - staff
  - player
```

This is forward-looking config for #1099's `ensureDocumentPermissions` frontend work; nothing in this plan's own code calls `UIPermission` for it yet.

### Step 3 — Add `GameDocumentUpdateSerializer`

Create `backend/games/serializers/games/documents/game_document_update.py`, mirroring `GamePossessionUpdateSerializer` exactly:

```python
"""GameDocument update serializer for the games app."""

from rest_framework import serializers

from games.models import GameDocument


class GameDocumentUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the limited set of fields that may be edited on a game document."""

    class Meta:
        """Metadata for the GameDocumentUpdateSerializer."""

        model = GameDocument
        fields = ['name', 'description', 'hidden']
        extra_kwargs = {field: {'required': False} for field in fields}
```

Export it from `backend/games/serializers/__init__.py` (alongside the existing `GameDocumentDetailSerializer`/`GameDocumentDetailFullSerializer` exports).

### Step 4 — Add PATCH handling to `game_document_detail.py`

Extend the view mirroring `game_possession_detail.py`'s `_update_possession` pattern:

- Change `@api_view(['GET'])` to `@api_view(['GET', 'PATCH'])`.
- Branch on `request.method == 'PATCH'` to a new `_update_document(request, game, document_id)` helper.
- In the helper:
  - Check `EndpointPermission(request.user, game=game).check(request, 'game_document', 'regular', 'edit')` and return the error response if any (the `'game_document'` resource key matches the config folder and the string already used in `game_document_photo_upload.py`/`_document_create.py`).
  - Look up the document via `game.documents.all()` (unfiltered by `hidden` — matches `game_possession_detail.py`'s update path; a document being edited need not be excluded just because it's hidden).
  - Validate via `GameDocumentUpdateSerializer(document, data=request.data, partial=True)`, returning the error response via the existing `validated_or_error` helper from `..common` if invalid.
  - Save and return `Response(GameDocumentDetailFullSerializer(document).data)` (already exists, includes `hidden`).
- Keep the GET branch's existing behavior (public, `hidden=False` filter) untouched; `permission_classes` stays `[AllowAny]` since PATCH authorization is enforced inline, same as `game_possession_detail.py`.

### Step 5 — Tests

Extend `backend/games/tests/views/games/game_document_detail_test.py` with a PATCH test class mirroring `game_possession_detail_test.py`'s PATCH coverage:
- Permission matrix: admin/dm succeed, staff/player succeed, other/unauthenticated roles get 403/401.
- Payload validation: partial update of `name`/`description`/`hidden`, response shape (`GameDocumentDetailFullSerializer` fields, including `hidden`).
- Editing a hidden document succeeds (lookup is unfiltered by `hidden`).
- 404 for an unknown document id.

## Files to Change

- `backend/permissions/config/game_document/endpoints.yml` — add `regular.edit: [staff, player]`.
- `backend/permissions/config/game_document/ui.yml` — new file, `edit: [staff, player]`.
- `backend/games/serializers/games/documents/game_document_update.py` — new file, `GameDocumentUpdateSerializer`.
- `backend/games/serializers/__init__.py` — export `GameDocumentUpdateSerializer`.
- `backend/games/views/games/game_document_detail.py` — add PATCH method and `_update_document` helper.
- `backend/games/tests/views/games/game_document_detail_test.py` — add PATCH test coverage.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`) — covers `games/tests/views/games/game_document_detail_test.py`.

## Notes

- No proxy/navi/frontend changes are in scope for this plan — the proxy cache-cleanup rule already covers this route, and the frontend Edit-button wiring (#1099) is a separate sub-issue that depends on this one.
- The `game_pc_item` precedent (#864) uses the tier name `create_update`; this plan intentionally uses `edit` instead, to stay consistent with sibling sub-issue #1097's already-decided naming for possessions/items/factions.
