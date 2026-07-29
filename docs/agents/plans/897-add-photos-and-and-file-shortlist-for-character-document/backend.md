# Backend Plan: Add photos and file shortlist for character document

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" — this agent produces the 8 new endpoints, the two
new serializers (plus the `description` addition to `CharacterDocumentSerializer`), and must
match the gating/permission rules and route paths exactly as specified there, since the frontend
plan is written against them.

## Implementation Steps

### Step 1 — Add `description` to `CharacterDocumentSerializer`

In `backend/games/serializers/characters/character_document.py`, add a `description` field
(`serializers.CharField(source='game_document.description', read_only=True)`) to
`CharacterDocumentSerializer`, alongside the existing `name`/`photo_path` delegation, and add it
to `Meta.fields`. `CharacterDocumentAllSerializer` inherits it automatically.

### Step 2 — New `CharacterDocumentFile`/`CharacterDocumentPhoto` serializers

These are **not** `ModelSerializer`s over a real table (no such tables exist, per the issue's
"Abstract" section) — they serialize plain `GameDocumentFile`/`GameDocumentPhoto` instances
(queried straight off `character_document.game_document.files`/`.photos`), with
`character_document_id` added from serializer `context` (each instance has no back-reference to
*which* `CharacterDocument` it's being listed under — a `GameDocument` can be held by several).

Add, mirroring `backend/games/serializers/games/documents/game_document_file.py` /
`game_document_photo.py`:
- `backend/games/serializers/characters/character_document_file.py` —
  `CharacterDocumentFileSerializer(serializers.ModelSerializer)` over `GameDocumentFile`, fields
  `['id', 'character_document_id', 'name', 'path', 'photo_path']`, with
  `character_document_id = serializers.SerializerMethodField()` reading
  `self.context['character_document_id']` (passed via `paginated_list_response(..., context=...)`,
  same mechanism `common.py` already supports).
- `backend/games/serializers/characters/character_document_photo.py` — same shape for
  `GameDocumentPhoto`, fields `['id', 'character_document_id', 'path']`.

Register both in `backend/games/serializers/__init__.py` (and `characters/__init__.py` if that
submodule re-exports).

### Step 3 — Shared view logic: `_document_files.py` / `_document_photos.py`

Add `backend/games/views/game/_document_files.py` and `_document_photos.py`, mirroring
`_documents.py`'s shape (`character_documents`/`character_document_detail`) but narrowed to a
single `CharacterDocument`'s files/photos:

```python
def character_document_files(request, game, character_id, document_id, npc, check_hidden):
    character = _get_character_or_404(game, character_id, npc)
    if check_hidden:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response
    document = get_object_or_404(
        character.character_documents.exclude(hidden=True), id=document_id,
    )
    if character.incognito:
        return paginated_list_response(request, GameDocumentFile.objects.none(), CharacterDocumentFileSerializer)
    files = document.game_document.files.filter(ready=True)
    return paginated_list_response(
        request, files, CharacterDocumentFileSerializer,
        context={'character_document_id': document.id},
    )
```

(Illustrative — adjust to match this file's actual conventions, e.g. whether the incognito check
belongs before or after the document lookup, and whether `X-Skip-Cache` needs setting the way
`character_documents` does when `check_hidden and character.hidden`.) The `_all` variant drops
`check_hidden`/incognito handling entirely (private endpoints ignore all of that) and is gated by
the permission check in Step 4, same relationship `character_documents`/`build_documents_all_view`
already have — `allow_hidden` isn't needed here since a single document is looked up by id, not
filtered from a list, but confirm whether the `/all.json` variant should still resolve a
hidden `CharacterDocument` (it must, since it's DM/owner-only and ignores hidden state per the
issue) — i.e. the `_all` variant's queryset must **not** `.exclude(hidden=True)`.

Write one function per resource (files/photos) × cardinality (single-document lookup, not list),
or a single parameterized helper if the two are structurally identical enough — judgment call,
follow whichever existing sibling file (`_documents.py` vs `_items.py`) reads cleaner as a
template.

### Step 4 — View factories in `_character_shared.py`

Add `build_document_files_view(npc)`, `build_document_files_all_view(npc)`,
`build_document_photos_view(npc)`, `build_document_photos_all_view(npc)`, mirroring
`build_documents_view`/`build_documents_all_view` (lines ~241-272 today) exactly — same
`@_build_api_view(['GET'], AllowAny)` decorator, same `_check_character_all_permission(request,
game, character_id, npc)` gate on the `_all` variants, same `X-Skip-Cache` header set on the
`_all` response.

### Step 5 — Routes

Add to `_CHARACTER_ROUTES` in `backend/games/urls/_character_routes.py`, right after the existing
`documents/<int:document_id>/full.json` entry:

```python
('/documents/<int:document_id>/files.json', 'document_files'),
('/documents/<int:document_id>/files/all.json', 'document_files_all'),
('/documents/<int:document_id>/photos.json', 'document_photos'),
('/documents/<int:document_id>/photos/all.json', 'document_photos_all'),
```

### Step 6 — One-line view wrapper files

Add, mirroring `backend/games/views/game/pcs/detail/documents/game_pc_documents.py` /
`game_pc_documents_all.py` (and the `npcs/` siblings):
- `games/views/game/pcs/detail/documents/game_pc_document_files.py` /
  `game_pc_document_files_all.py` / `game_pc_document_photos.py` / `game_pc_document_photos_all.py`
- Same four files under `games/views/game/npcs/detail/documents/`

Each is a one-liner: `game_pc_document_files = build_document_files_view(npc=False)`, etc.
Register all 8 in `games/views/game/pcs/__init__.py`, `games/views/game/npcs/__init__.py`, and
`games/views/__init__.py` (imports + `__all__`), following the existing `documents`/`documents_all`
entries as the template.

### Step 7 — Tests

Add tests under `backend/games/tests/views/game/` (covered by the `pytest_views_characters` CI
job), mirroring the existing `documents`/`documents_all` test files for pcs and npcs. Cover: happy
path (files/photos returned with correct `character_document_id`), `CharacterDocument.hidden` →
404, NPC `Character.hidden` → 404 (and PC `Character.hidden` → *not* gated), `Character.incognito`
→ `[]`, `GameDocument.hidden` → still visible, `/all.json` permission split (dm/admin/owner for pc,
dm/admin for npc, player-of-neither → 403/404), pagination.

## Files to Change

- `backend/games/serializers/characters/character_document.py` — add `description` field.
- `backend/games/serializers/characters/character_document_file.py` — new.
- `backend/games/serializers/characters/character_document_photo.py` — new.
- `backend/games/serializers/__init__.py` (and `characters/__init__.py` if applicable) — register
  new serializers.
- `backend/games/views/game/_document_files.py` — new.
- `backend/games/views/game/_document_photos.py` — new.
- `backend/games/views/game/_character_shared.py` — add 4 new `build_*_view` factories.
- `backend/games/urls/_character_routes.py` — add 4 new route entries.
- `backend/games/views/game/pcs/detail/documents/game_pc_document_files.py` (+ `_all`, `_photos`,
  `_photos_all`) — new, one-liners.
- `backend/games/views/game/npcs/detail/documents/game_npc_document_files.py` (+ `_all`,
  `_photos`, `_photos_all`) — new, one-liners.
- `backend/games/views/game/pcs/__init__.py`, `backend/games/views/game/npcs/__init__.py`,
  `backend/games/views/__init__.py` — register the 8 new view names.
- `backend/games/tests/views/game/` — new test files for the 8 endpoints (pc + npc × files/photos
  × public/all).
- `docs/agents/access-control/character-document.md` — add the new endpoints to its table
  (per that doc's own "update this document in the same PR" convention, flagged by product-owner).
- `docs/agents/access-control/character.md` — update the "Incognito field" section to document
  that incognito now also empties these two endpoints' lists, not just `profile_photo_path`
  (flagged by product-owner as a genuine extension of documented scope, not a pre-existing rule).

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov` (CI job: `pytest_views_characters`)
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- Confirm during implementation whether the `/all.json` document-files/photos lookup should
  404 when the underlying `CharacterDocument` doesn't exist regardless of its `hidden` state
  (it should — private endpoints ignore hidden entirely, so the queryset must not
  `.exclude(hidden=True)` the way the public variant does).
- `data-access`/`security` review is warranted before merge given this issue adds new endpoints
  and a new access-control rule (`incognito` → `[]`); dispatch those read-only reviewers against
  the diff once implemented.
