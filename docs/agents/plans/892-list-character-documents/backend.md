# Backend Plan: List Character Documents

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the serializer fields and the four new show/detail endpoints described in
[plan.md](plan.md)'s "Shared contracts" section — the frontend and translator agents depend on
these exact field names, endpoint paths, and permission rules.

## Implementation Steps

### Step 1 — Strip flavor fields from `CharacterDocument`

- `backend/games/models/character/character_document.py`: remove `name`, `description`, `photo`
  fields and their docstring mentions. Keep `character`, `game_document`, `hidden`, `history`,
  `Meta` (ordering/`unique_together`), and `__str__` — but `__str__` currently returns
  `self.name or self.game_document.name`; simplify to `self.game_document.name` since `name` no
  longer exists.
- Delete `backend/games/models/character/character_document_photo.py`
  (`CharacterDocumentPhoto`) and its registration in `backend/games/models/__init__.py`.
- Generate migrations in **both** apps (mirrors the `0027_characterphoto_...delete_photo.py` /
  paired-`versioning` precedent found for this repo):
  - `games`: `RemoveField` for `name`/`description`/`photo` on `CharacterDocument`, then
    `DeleteModel` for `CharacterDocumentPhoto`.
  - `versioning`: matching field removal on `HistoricalCharacterDocument` and `DeleteModel` for
    `HistoricalCharacterDocumentPhoto`.
  - Run `poetry run python manage.py makemigrations` and review the generated files rather than
    hand-writing them.

### Step 2 — Remove the now-dead fallback-resolution helpers

- Delete `resolve_character_document_field`/`resolve_character_document_photo_path`
  (`backend/games/serializers/games/documents/character_document_fields.py`) and its test file
  (`tests/serializers/games/documents/character_document_fields_test.py`) — there is nothing left
  to fall back from once `CharacterDocument` has no overridable fields.

### Step 3 — Rewrite `CharacterDocumentSerializer` to source from `GameDocument` directly

`backend/games/serializers/characters/character_document.py`:
- `name`: `serializers.CharField(source='game_document.name', read_only=True)` (no longer a
  `SerializerMethodField` — there's no fallback logic left, just a straight FK traversal).
- `photo_path`: `serializers.CharField(source='game_document.photo.path', default=None,
  read_only=True)` — mirrors `GameDocumentListSerializer`'s own `photo_path` field exactly.
- `game_document_id` and `CharacterDocumentAllSerializer` (adds `hidden`) stay as-is.
- Update `backend/games/serializers/characters/character_document_test.py` and
  `character_document_all_test.py` for the new field sourcing.

### Step 4 — Add detail serializers

New in the same file (or a sibling, matching how `character_item.py` keeps all four tiers
together): `CharacterDocumentDetailSerializer` — for this issue this is identical in fields to
`CharacterDocumentSerializer` (no `description` tier exists, unlike `CharacterItemDetailSerializer`
which adds one) — and `CharacterDocumentDetailFullSerializer(HiddenFieldMixin,
CharacterDocumentDetailSerializer)` adding `hidden`. If the two non-`All`/non-`Full` serializers
end up field-identical, consider whether `CharacterDocumentDetailSerializer` needs to exist at all
versus reusing `CharacterDocumentSerializer` directly for the show endpoint — decide based on
whether `CharacterItemDetailSerializer`'s existence for symmetry alone is worth mirroring here;
either is defensible, but keep whichever choice consistent with the `_documents.py` detail
function's `serializer_class` default in Step 5.

### Step 5 — Add `character_document_detail` to `_documents.py`

Mirror `_items.py`'s `character_item_detail` function exactly: same hidden-character gate
(`check_hidden`), same hidden-document exclusion (`allow_hidden`), single-row lookup via
`get_object_or_404`, same `X-Skip-Cache` handling.

### Step 6 — Add `build_document_detail_view`/`build_document_detail_full_view` to `_character_shared.py`

Mirror `build_item_detail_view`/`build_item_detail_full_view` exactly, but **no `PATCH` branch**
(documents have no update endpoint) and no photo-upload wiring. Reuses the existing
`_check_character_all_permission` helper for the `/full.json` variant's dm/admin(/owner) split.

### Step 7 — Wire up view files, `__init__.py` re-exports, and URL routes

- New view files (mirroring `game_pc_item_detail.py`/`game_pc_item_detail_full.py`):
  - `backend/games/views/game/pcs/detail/documents/game_pc_document_detail.py`
  - `backend/games/views/game/pcs/detail/documents/game_pc_document_detail_full.py`
  - `backend/games/views/game/npcs/detail/documents/game_npc_document_detail.py`
  - `backend/games/views/game/npcs/detail/documents/game_npc_document_detail_full.py`
- Re-export each through the same three-level `__init__.py` chain items already use:
  `views/game/pcs/__init__.py` (and `npcs/__init__.py`) → `views/game/__init__.py` →
  `views/__init__.py` (import + `__all__` entry in all three, per side).
- `backend/games/urls/_character_routes.py`: add to `_CHARACTER_ROUTES`:
  ```python
  ('/documents/<int:document_id>.json', 'document_detail'),
  ('/documents/<int:document_id>/full.json', 'document_detail_full'),
  ```
  placed near the existing `documents`/`documents_all` entries (matches `_character_route`'s
  `game_<kind>_<name_suffix>` naming convention — verify the generated view names
  `game_pc_document_detail`/`game_npc_document_detail_full` etc. line up with what Step 7's files
  actually export).

### Step 8 — Update access-control documentation

Rewrite `docs/agents/access-control/character-document.md` to reflect the post-#892 shape:
- Drop the "optional overrides"/fallback-resolution description — `CharacterDocument` is now a
  thin join, `name`/`photo_path` always come straight from `GameDocument`.
- Add the four new show/detail endpoints to the endpoints table, alongside the four existing
  index endpoints, with their permission rules (public: `AllowAny`, 404 on hidden; private:
  `CharacterEditPermission`/`GameEditPermission` per PC/NPC).
- Remove the now-inaccurate "no detail endpoint... in this issue" line.

### Step 9 — Tests

- Model tests: delete `tests/models/character/character_document_photo_test.py`; update
  `character_document_test.py` for the trimmed field set.
- Serializer tests: update `character_document_test.py`/`character_document_all_test.py`; add new
  detail-serializer tests if Step 4 introduces new classes.
- View tests: add `tests/views/game/pcs/...`/`tests/views/game/npcs/...` coverage for the four new
  detail/detail-full endpoints, mirroring the existing `character_item_detail` test structure
  (public 200/404-if-hidden/404-if-missing, private permission matrix: owner/dm/admin/stranger).

## Files to Change

- `backend/games/models/character/character_document.py` — strip flavor fields
- `backend/games/models/character/character_document_photo.py` — delete
- `backend/games/models/__init__.py` — remove `CharacterDocumentPhoto` registration
- `backend/games/migrations/00NN_*.py` — new migration(s) for the above
- `backend/versioning/migrations/00NN_*.py` — paired historical-model migration(s)
- `backend/games/serializers/games/documents/character_document_fields.py` — delete
- `backend/games/serializers/characters/character_document.py` — rewrite `name`/`photo_path`
  sourcing, add detail serializer(s)
- `backend/games/views/game/_documents.py` — add `character_document_detail`
- `backend/games/views/game/_character_shared.py` — add `build_document_detail_view`/
  `build_document_detail_full_view`
- `backend/games/views/game/pcs/detail/documents/game_pc_document_detail.py` — new
- `backend/games/views/game/pcs/detail/documents/game_pc_document_detail_full.py` — new
- `backend/games/views/game/npcs/detail/documents/game_npc_document_detail.py` — new
- `backend/games/views/game/npcs/detail/documents/game_npc_document_detail_full.py` — new
- `backend/games/views/game/pcs/__init__.py`, `backend/games/views/game/npcs/__init__.py`,
  `backend/games/views/game/__init__.py`, `backend/games/views/__init__.py` — re-export new views
- `backend/games/urls/_character_routes.py` — add the two new route entries
- `docs/agents/access-control/character-document.md` — rewrite for post-#892 shape
- Test files under `backend/games/tests/models/character/`, `tests/serializers/characters/`,
  `tests/serializers/games/documents/`, `tests/views/game/pcs/`, `tests/views/game/npcs/` — delete/
  update/add as described in Step 9

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov` (CI job: `pytest_views_characters`)
  — covers the new PC/NPC detail views
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov` (CI job: `pytest_all`) — covers
  model/serializer tests
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- Confirmed with the user: `game_document` FK stays (the original issue text's field-removal list
  appeared to drop it too, which was a contradiction with its own next section — resolved in
  favor of keeping it, since it's the only link to the `GameDocument` definition).
- Confirmed with the user: private show endpoints use the `/full.json` suffix convention, matching
  `CharacterItem`'s `item_detail_full`.
- No `description` field exists at any serializer tier for `CharacterDocument`, unlike
  `CharacterItem`'s detail tier — confirmed against the issue's own explicit field lists. If this
  turns out to be an oversight once the frontend show page is built, that's a follow-up issue, not
  a blocker for #892.
- `docs/agents/access-control/character-document.md`'s existing content was flagged by the
  product-owner agent as if it constrained #892's scope to list-only; on inspection it's stale
  documentation describing the *previous* issue's shipped state (list endpoints only), not a
  scope boundary for #892 — the GitHub issue explicitly asks for show endpoints/pages too, and the
  user confirmed this reading. Update the doc rather than trim the issue's scope to match it.
