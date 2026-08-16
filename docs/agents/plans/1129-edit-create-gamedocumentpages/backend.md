# Backend Plan: Edit/Create GameDocumentPages

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" for the full endpoint table, permission split, and `version` field semantics. This agent owns producing all of it: the model/migration changes, the permission config entry, and the eight new views (four actions × regular/restricted).

## Implementation Steps

### Step 1 — `version` column on `GameDocumentPage`
Add `version = models.PositiveIntegerField(default=1)` to `backend/games/models/game/game_document_page.py`. A plain `AddField` migration with `default=1` backfills every existing row automatically — no separate hand-written data migration is needed (Django applies the default to existing rows as part of the schema migration itself).

### Step 2 — `GameDocumentPageHistory` model
New model, e.g. `backend/games/models/game/game_document_page_history.py`:
- `game_document` FK to `GameDocument`, `on_delete=CASCADE` (history dies with the whole document, same lifecycle as live pages).
- `order` (`PositiveIntegerField`), `version` (`PositiveIntegerField`), `content` (`TextField`).
- Deliberately **no FK to the live `GameDocumentPage` row** — that row can be deleted (page count shrinks) and its history must survive independently.
- `Meta.ordering = ['game_document', 'version', 'order']`, mirroring the live model's own ordering shape.
- New migration.

### Step 3 — Permission config
Add a `page_edit` action to the `regular` block of `backend/permissions/config/game_document/endpoints.yml`, alongside the existing `edit`/`create` entries:
```yaml
regular:
  ...
  page_edit:
    - staff
    - player
```
No new entry needed for the restricted side — reuse `check_game_edit` (`backend/games/views/common.py:24`) exactly as `game_document_pages_all.py` already does for the read side.

### Step 4 — Archiving helper
A small shared helper (e.g. `backend/games/views/games/_document_page_saga.py`, following the `_document_create.py`/`_document_exchange.py` naming convention for shared non-view logic under `views/games/`) used by every mutating view below: given a live `GameDocumentPage` row about to be overwritten or removed, write a `GameDocumentPageHistory` row with its current `(order, version, content)` before the change is applied. Keeps the archiving logic in one place rather than duplicated across four view modules.

### Step 5 — Create page view
`game_document_page_create` (regular) / restricted twin, POST, body `{content, order, version}`:
- Regular: `document = get_object_or_404(game.documents.filter(hidden=False), id=document_id)`, permission check `EndpointPermission(...).check(request, 'game_document', 'regular', 'page_edit')`.
- Restricted: `document = get_object_or_404(game.documents.all(), id=document_id)`, permission check `check_game_edit(request, game)`, response carries `X-Skip-Cache: true`.
- No archiving needed (brand new row, nothing to archive) — just `GameDocumentPage.objects.create(game_document=document, **validated_data)`.

### Step 6 — Update page view
`game_document_page_detail` (regular) / restricted twin, PATCH by `page_id`, body `{content, version}`:
- Same permission/queryset split as Step 5.
- Archive the page's current state via the Step 4 helper, then update `content`/`version` on the live row.

### Step 7 — Trim (bulk delete) view
`game_document_pages_trim` (regular) / restricted twin, DELETE, body `{keep: <int>}`:
- Same permission/queryset split as Step 5.
- For every live page with `order > keep`, archive via the Step 4 helper, then delete.

### Step 8 — Batch version-bump view
`game_document_pages_bump_version` (regular) / restricted twin, PATCH, body `{version, exclude_ids: [...]}`:
- Same permission/queryset split as Step 5.
- For every live page not in `exclude_ids`, archive via the Step 4 helper (its current content is unchanged, only its `version` moves), then set the new `version`.

### Step 9 — URLs
Wire all eight new views into `backend/games/urls/games.py`, next to the existing `game-document-pages`/`game-document-pages-all` entries.

### Step 10 — Serializers
- Add `'version'` to `GameDocumentPageListSerializer.Meta.fields` (`backend/games/serializers/games/documents/game_document_page_list.py`) — the only change needed on the already-shipped read side.
- New request-body serializers for create/update/trim/bump payload validation, following the `_GameDocumentCreateSerializer` pattern in `_document_create.py`.

## Files to Change
- `backend/games/models/game/game_document_page.py` — add `version` field
- `backend/games/models/game/game_document_page_history.py` — new model
- `backend/games/models/__init__.py` — export the new model
- `backend/games/migrations/` — two new migrations (add `version`, create history table)
- `backend/permissions/config/game_document/endpoints.yml` — add `page_edit` to `regular`
- `backend/games/views/games/_document_page_saga.py` — new shared archiving helper
- `backend/games/views/games/game_document_page_create.py`, `game_document_page_detail.py`, `game_document_pages_trim.py`, `game_document_pages_bump_version.py` — new views (each covering both regular and restricted branches, following `game_document_detail.py`'s single-file-both-branches shape)
- `backend/games/views/__init__.py` — export the new views
- `backend/games/urls/games.py` — eight new `path()` entries
- `backend/games/serializers/games/documents/game_document_page_list.py` — add `version` to fields
- `backend/games/serializers/games/documents/` — new create/update/trim/bump request serializers
- `backend/games/serializers/__init__.py` — export new serializers
- Matching test files under `backend/games/tests/` for every new/changed file above

## CI Checks
- `backend`: `make backend-test` (or repo's documented pytest invocation) — check `.circleci/config.yml` for the exact backend test job/command.

## Notes
- The lack of save atomicity across the many individual requests is a known, accepted limitation (see issue #1129's "Edge cases" section and follow-up #1139) — nothing in this plan attempts to make the four endpoints transactional as a group.
- Storage grows by roughly the whole document's size on every save (every page gets a history row every time, even unchanged ones) — accepted trade-off per the issue, no pruning built here.
