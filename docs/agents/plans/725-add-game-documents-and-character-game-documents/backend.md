# Backend Plan: Add game documents and character game documents

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section for the full endpoint list, response field
shapes, and the i18n-key/cache-warming contracts this plan's endpoints must satisfy for the
frontend and infra agents.

## Implementation Steps

### Step 1 — Models

Add, mirroring `backend/games/models/game/game_item.py` and
`backend/games/models/character/character_item.py` field-for-field:

- `backend/games/models/game/game_document.py` — `GameDocument`: `game` FK (CASCADE,
  `related_name='documents'`), `name` (`CharField(max_length=200)`), `description`
  (`TextField(blank=True, default='')`), `photo` FK to `games.GameDocumentPhoto` (`SET_NULL`,
  `null=True`, `blank=True`, `related_name='+'`), `hidden` (`BooleanField(default=False)`),
  `history = HistoricalRecords(app='versioning', user_db_constraint=False)`, `Meta.ordering =
  ['id']`, `__str__` returns `self.name`.
- `backend/games/models/game/game_document_photo.py` — `GameDocumentPhoto(BasePhoto)`:
  `game_document` FK (CASCADE, `related_name='photos'`) — mirrors `game_item_photo.py`.
- `backend/games/models/character/character_document.py` — `CharacterDocument`: `character` FK
  (CASCADE, `related_name='character_documents'`), `game_document` FK (CASCADE,
  `related_name='character_documents'`), nullable `name`/`description` overrides, `photo` FK to
  `games.CharacterDocumentPhoto` (`SET_NULL`, `related_name='+'`), `hidden`
  (`BooleanField(default=False)`), `history = HistoricalRecords(app='versioning',
  user_db_constraint=False)`, `Meta.ordering = ['id']`, `Meta.unique_together =
  [('character', 'game_document')]`, `__str__` returns `self.name or self.game_document.name`.
- `backend/games/models/character/character_document_photo.py` —
  `CharacterDocumentPhoto(BasePhoto)`: `character_document` FK (CASCADE, `related_name='photos'`)
  — mirrors `character_item_photo.py`.

Register all four in the relevant `models/__init__.py` / app registry exactly like the item
models are registered (check how `GameItem`/`GameItemPhoto`/`CharacterItem`/`CharacterItemPhoto`
are imported/exported and follow the same spot).

### Step 2 — Migrations

Run `makemigrations` (via `docker-compose run --rm majora_be python manage.py makemigrations`,
per `AGENTS.md`) to generate:
- `backend/games/migrations/<next>_characterdocument_characterdocumentphoto_..._and_more.py` —
  should create all four models plus their FKs in one migration, following the precedent set by
  `0069_characteritem_characteritemphoto_characteritem_photo_and_more.py` (current tail is
  `0071_move_userprofile_passwordresettoken_to_accounts.py`, so this is `0072_...`).
- `backend/versioning/migrations/<next>_historicalcharacterdocument_..._and_more.py` — the
  auto-generated `Historical*` tables (current tail `0007_...`, so this is `0008_...`).

Verify the generated migrations don't include unrelated model changes (re-run
`makemigrations --check` if unsure) before committing.

### Step 3 — Serializers

Add `backend/games/serializers/games/documents/` (sibling to `.../items/`):
- `__init__.py`
- `game_document_list.py` — `GameDocumentListSerializer` (`Meta.fields = ['id', 'name',
  'photo_path']`, `photo_path = serializers.CharField(source='photo.path', default=None,
  read_only=True)`), `GameDocumentAllListSerializer(HiddenFieldMixin,
  GameDocumentListSerializer)` (adds `'hidden'`). No `Detail`/`DetailAll` variants — there's no
  detail endpoint in this issue.
- `character_document_fields.py` — `resolve_character_document_field(character_document, field)`
  and `resolve_character_document_photo_path(character_document)`, mirroring
  `character_item_fields.py`'s two functions verbatim (substitute `character_item`→
  `character_document`, `game_item`→`game_document`).
- `game_document_photo.py` — `GameDocumentPhotoSerializer` (`Meta.fields = ['id', 'path']`).

Add `backend/games/serializers/characters/character_document.py`:
- `CharacterDocumentSerializer` — `Meta.fields = ['id', 'game_document_id', 'name',
  'photo_path']`; `game_document_id = serializers.IntegerField(source='game_document.id',
  read_only=True)`; `name`/`photo_path` as `SerializerMethodField`s delegating to
  `resolve_character_document_field`/`resolve_character_document_photo_path`.
- `CharacterDocumentAllSerializer(HiddenFieldMixin, CharacterDocumentSerializer)` — adds
  `'hidden'`.

No `Detail`/`DetailAll` variants here either (mirrors the "no detail endpoint" decision above).

### Step 4 — Permissions

No new permission classes are needed — reuse `GameEditPermission` and `CharacterEditPermission`
exactly as `/items/all.json` and the PC/NPC `/items/all.json` variants do today (see
`_check_items_all_permission` in `backend/games/views/game/_character_shared.py` for the
NPC→`GameEditPermission` / PC→`CharacterEditPermission` branch). Either reuse that helper
directly if it's already generic over the item/document distinction, or add a sibling
`_check_documents_all_permission` with identical branching if the existing one is item-specific
in a way that can't be trivially parameterized — prefer generalizing the existing helper if it's
a small change, to avoid duplicating the branch logic.

### Step 5 — Views

Game-level, `backend/games/views/games/`:
- `game_documents.py` — `GET /games/<slug>/documents.json`, `AllowAny`, filters
  `hidden=False`, `GameDocumentListSerializer`, paginated — mirror `game_items.py`.
- `game_documents_all.py` — `GET /games/<slug>/documents/all.json`, inline
  `GameEditPermission.check(request, game)`, no hidden filter, `GameDocumentAllListSerializer`,
  `X-Skip-Cache: true` — mirror `game_items_all.py`.

No `game_document_detail(_all).py` and no `game_document_photo_upload.py` in this issue.

Character-level, add `backend/games/views/game/_documents.py` mirroring the list half of
`_items.py` (`character_documents(...)`, generic over `npc`/`serializer_class`/`allow_hidden`,
reusing `_get_character_or_404`/`_hidden_gate_response` from `_shared.py`). Do **not** port
`character_item_detail`'s counterpart — no document detail view.

Extend `_character_shared.py` with `build_documents_view(npc)` (GET only, no POST — no create
endpoint) and `build_documents_all_view(npc, serializer_class)`, following the same factory
pattern as `build_items_view`/`build_items_all_view` minus the POST branch.

Thin per-kind wrappers (each a 1-line `build_*_view(npc=...)` call):
- `backend/games/views/game/pcs/detail/documents/game_pc_documents.py`,
  `game_pc_documents_all.py`
- `backend/games/views/game/npcs/detail/documents/game_npc_documents.py`,
  `game_npc_documents_all.py`

### Step 6 — URLs

- `backend/games/urls/games.py` — add `game-documents`, `game-documents-all` patterns next to
  the existing `game-items*` ones (2 lines, no detail pattern).
- `backend/games/urls/_character_routes.py` — add to the shared `_CHARACTER_ROUTES` list (picked
  up automatically by both `pcs.py`/`npcs.py`):
  ```python
  ('/documents.json', 'documents'),
  ('/documents/all.json', 'documents_all'),
  ```

### Step 7 — Factories & tests

Add to `backend/games/tests/factories.py` (flat file, no package):
```python
class GameDocumentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GameDocument
    game = factory.SubFactory(GameFactory)
    name = 'Test Document'
    description = 'A test document.'

class CharacterDocumentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CharacterDocument
    character = factory.SubFactory(CharacterFactory)
    game_document = factory.SubFactory(GameDocumentFactory)
```

Mirror the existing item test files 1:1 (same assertions — pagination headers, ordering, hidden
filtering, fallback resolution, field-set exhaustiveness), substituting document naming:
- `backend/games/tests/models/game/game_document_test.py`, `game_document_photo_test.py`
- `backend/games/tests/models/character/character_document_test.py`,
  `character_document_photo_test.py`
- `backend/games/tests/serializers/games/documents/game_document_list_test.py`,
  `character_document_fields_test.py`
- `backend/games/tests/serializers/characters/character_document_test.py`,
  `character_document_all_test.py`
- `backend/games/tests/views/games/game_documents_test.py`, `game_documents_all_test.py`
- `backend/games/tests/views/game/pcs/detail/documents/game_pc_documents_test.py`,
  `game_pc_documents_all_test.py`
- `backend/games/tests/views/game/npcs/detail/documents/game_npc_documents_test.py`,
  `game_npc_documents_all_test.py`

### Step 8 — Docs

- `docs/agents/architecture.md` — add `GameDocument`, `GameDocumentPhoto`, `CharacterDocument`,
  `CharacterDocumentPhoto` to the `versioning/` section's list of tracked models.
- `docs/agents/access-control/game-document.md` and `character-document.md` — clone
  `game-item.md`/`character-item.md`, trimmed to only the sections that apply: intro paragraph,
  "Document index endpoints" (list + all, table + exposed fields + `photo_path` note), "`hidden`".
  For `character-document.md`, also include "Fallback resolution" (adapted from
  `character-item.md`). Omit "Document detail endpoints", "creation endpoints", and "photo
  upload" sections entirely — none of those exist yet.
- `docs/agents/access-control.md` (top-level index) — add a table-of-contents entry for the two
  new per-model docs, next to the item entries.
- `docs/agents/product.md` — add a `### GameDocument / CharacterDocument` section following the
  `### GameItem / CharacterItem` template (lines 109-120), accurately describing this issue's
  read-only scope (no create/update/photo-upload yet). While in this section: the existing
  `### GameItem / CharacterItem` text (line 116) claims items are "read-only... (no create,
  update, or photo upload flow)", which is now stale (issues #714/#750 added creation and photo
  upload) — fix that sentence as a drive-by correction since this step already touches the file.

## Files to Change

- `backend/games/models/game/game_document.py`, `game_document_photo.py` — new models
- `backend/games/models/character/character_document.py`, `character_document_photo.py` — new
  models
- `backend/games/migrations/00XX_*.py`, `backend/versioning/migrations/000X_*.py` — new
  migrations
- `backend/games/serializers/games/documents/__init__.py`, `game_document_list.py`,
  `character_document_fields.py`, `game_document_photo.py` — new serializers
- `backend/games/serializers/characters/character_document.py` — new serializer
- `backend/games/permissions.py` — only if the existing all-permission helper needs
  generalizing (Step 4)
- `backend/games/views/games/game_documents.py`, `game_documents_all.py` — new views
- `backend/games/views/game/_documents.py` — new shared list logic
- `backend/games/views/game/_character_shared.py` — extend with document view factories
- `backend/games/views/game/pcs/detail/documents/*.py`,
  `backend/games/views/game/npcs/detail/documents/*.py` — new thin wrapper views
- `backend/games/urls/games.py`, `backend/games/urls/_character_routes.py` — new URL patterns
- `backend/games/tests/factories.py` — new factories
- `backend/games/tests/models/`, `.../serializers/`, `.../views/` — new test files (Step 7)
- `docs/agents/architecture.md`, `docs/agents/access-control.md`,
  `docs/agents/access-control/game-document.md`, `character-document.md`,
  `docs/agents/product.md` — doc updates

## CI Checks

- `backend/`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views_characters`,
  `pytest_views_rest`, `pytest_all` — new tests land under `games/tests/views/game/` and
  `games/tests/models`/`serializers`, split across these per their existing path-based grouping)
- `backend/`: `docker-compose run --rm majora_be ruff check .` (CI job: `checks`)

## Notes

- `CharacterDocument.character_documents` and `GameDocument.documents` related-name choices
  follow the item precedent's naming style (`character_items`/`items`) — keep consistent.
- No `can_create_document`/`can_upload_document_photo` permission flags are added to
  `CharacterPermissionsSerializer` in this issue — those only make sense once create/upload
  endpoints exist.
- Double-check whether `_check_items_all_permission` can be trivially generalized (Step 4) before
  duplicating it — duplicating is an acceptable fallback if the existing helper is entangled with
  item-specific naming.
