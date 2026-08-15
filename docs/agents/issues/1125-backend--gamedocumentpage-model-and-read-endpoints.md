# Issue: Backend: GameDocumentPage model and read endpoints

## Description
This is sub-issue 1/5 of #1124. Sibling sub-issues:
- Frontend: `DocumentPagesBox` component wired into the GameDocument show page (depends on this one)
- Frontend: reuse of `DocumentPagesBox` on the CharacterDocument show page
- Cache: navi config update for the new paginated `pages` sub-resource
- Edit/Create GameDocumentPages (left vague, to be matured separately)

## Problem
Game documents currently only hold a single flat `description` text field. There is no way to store a large document broken into pages, and no backend support to serve paged document content efficiently.

## Solution
Add a `GameDocumentPage` model and the read-only backend endpoints needed to serve document content page by page.

### Model
- `GameDocumentPage`, mirroring the `GameDocumentFile` pattern (`backend/games/models/game/game_document_file.py`):
  - `game_document` — `ForeignKey(GameDocument, on_delete=CASCADE, related_name='pages')`
  - `content` — `TextField(blank=True, default='')`, markdown text (mirrors `GameDocument.description`)
  - `order` — `PositiveIntegerField()`, no DB-level uniqueness constraint; `Meta.ordering = ['game_document', 'order']`
  - Add migration

### Endpoints
Follow the document-scoped `files`/`files_all` view pattern (`backend/games/views/games/game_document_files.py` / `game_document_files_all.py`), not the top-level `documents`/`documents_all` pattern — routes are nested under the existing plural `games/<slug:game_slug>/...` prefix (not singular `/game/`, matching every existing sibling route):
- `games/<slug:game_slug>/documents/<int:document_id>/pages.json` — `AllowAny`; looks up the parent document via `game.documents.filter(hidden=False)` (404 if hidden or missing), then paginates `document.pages`
- `games/<slug:game_slug>/documents/<int:document_id>/pages/all.json` — gated by `check_game_edit(request, game)` (dm/admin only); looks up the parent document via `game.documents.all()` (no hidden filter), sets `response['X-Skip-Cache'] = 'true'`

Both use the existing `Paginator`/`paginated_list_response` mechanism (`backend/games/paginator.py`, `backend/games/views/common.py`) — a request with `per_page=1` already naturally returns a single page plus the total page count via the standard pagination headers; no new pagination mechanism is needed.

### Serializers
Add a `GameDocumentPageListSerializer` (and `_all` counterpart if field exposure differs) under `backend/games/serializers/games/documents/`, following the existing per-group file convention (e.g. `game_document_list.py`), exposing `id`, `content`, and `order`.

## Benefits
Enables large documents to be authored and served as discrete, ordered pages instead of one flat text block, and lays the backend groundwork for the paged-reading frontend components in the sibling sub-issues.
