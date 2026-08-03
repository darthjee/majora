# Backend plan: Add document exchange

See [plan.md](plan.md) for the overview and the full shared-contracts section (routes, request/
response bodies, permission matrix, i18n). This file only covers backend-specific steps.

## 1. New permission resource config

`_character_document_resource(character)` (new helper, mirrors `_character_item_resource` in
`backend/games/views/game/_shared.py`) must return `'game_pc_document'` / `'game_npc_document'`.
Neither resource exists in `backend/games/permissions/config/` yet (unlike
`game_pc_item`/`game_npc_item`) — `PermissionConfigStore._load` does a bare `open()` with no
fallback, so these files are required or every acquire/remove call will raise
`FileNotFoundError`:

`backend/games/permissions/config/game_pc_document/endpoints.yml`:
```yaml
restricted:
  create:
    - staff
    - owner
```

`backend/games/permissions/config/game_npc_document/endpoints.yml`:
```yaml
restricted:
  create:
    - staff
```

(Mirrors `game_pc_item`/`game_npc_item`'s `endpoints.yml` exactly. No `ui.yml` needed — unlike
items, documents have no create page/permission exposed via `CharacterPermissionsSerializer`, so
there's no `can_create_document`-style flag to add.)

Add `_character_document_resource` next to `_character_item_resource` in `_shared.py`.

## 2. `_document_exchange.py` (new)

New file `backend/games/views/game/_document_exchange.py`, mirroring `_item_exchange.py`
structurally:

- `_check_document_create(request, game, character)` — calls
  `EndpointPermission(request.user, game=game, pc=character).check(request,
  _character_document_resource(character), 'restricted', 'create')`.
- `_DocumentAcquireSerializer` (`game_document_id: IntegerField`, `hidden: BooleanField
  (required=False, default=None, allow_null=True)`) and `_DocumentRemoveSerializer`
  (`game_document_id: IntegerField`) — plain validation serializers, mirroring
  `_ItemAcquireSerializer`/`_ItemRemoveSerializer`.
- `character_documents_available(request, game, character_id, npc, check_hidden,
  allow_hidden=False, serializer_class=None)` — mirrors `character_items_available`: fetch the
  character, apply `_hidden_gate_response` if `check_hidden`, query
  `game.documents.exclude(id__in=character.character_documents.values_list('game_document_id',
  flat=True))`, exclude `hidden=True` unless `allow_hidden`, apply `filter_by_name` (import from
  `..games._treasure_filters`, same as `_item_exchange.py` does), return
  `paginated_list_response(...)`, set `X-Skip-Cache` when `check_hidden and character.hidden`.
- `character_document_acquire(request, game, character, allow_hidden=False)` — mirrors
  `character_item_acquire`, with two differences:
  - Look up the `GameDocument` via `game.documents` instead of `game.items`.
  - On duplicate (`CharacterDocument.objects.get_or_create` returns `created=False`), return
    **`422`** (not `400` — this is a deliberate divergence from items, confirmed with the issue
    author during `/enhance-issue`), body `{'errors': {'game_document_id': ['already owned']}}`.
  - On success, `201` with `CharacterDocumentAllSerializer(character_document).data` (existing
    serializer — do not create a new "detail full" serializer, `CharacterDocumentAllSerializer`
    already carries everything: `id`, `game_document_id`, `name`, `description`, `photo_path`,
    `hidden`).
- `character_document_remove(request, game, character, allow_hidden=False)` — mirrors
  `character_item_remove` exactly, swapping `character.character_items` for
  `character.character_documents` and `game_item_id` for `game_document_id`. `204` on success,
  `Http404` if not found or hidden without `allow_hidden`.
- `_find_game_document(game, game_document_id, allow_hidden)` — mirrors `_find_game_item`.

## 3. `_character_shared.py` builders (new)

Add six builder functions next to the existing `build_items_available_view`/
`build_items_available_all_view`/`build_item_acquire_view`/`build_item_acquire_all_view`/
`build_item_remove_view`/`build_item_remove_all_view` — **do not copy their permission shape
uniformly**; per the plan.md permission matrix, Acquire's private gate must stay stricter than
Remove's:

- `build_documents_available_view(npc)` — `AllowAny`, calls `character_documents_available(...,
  serializer_class=GameDocumentListSerializer)`. No extra gate (matches
  `build_items_available_view`).
- `build_documents_available_all_view(npc)` — gate with `check_game_edit(request, game)` first
  (matches `build_items_available_all_view`, **not** `_check_character_all_permission`), then
  `character_documents_available(..., allow_hidden=True,
  serializer_class=GameDocumentAllListSerializer)`, set `X-Skip-Cache`.
- `build_document_acquire_view(npc)` — no extra gate, calls `character_document_acquire(request,
  game, character)` (matches `build_item_acquire_view`).
- `build_document_acquire_all_view(npc)` — gate with `check_game_edit(request, game)` first
  (matches `build_item_acquire_all_view` — **DM-only, no PC-owner shortcut**), then
  `character_document_acquire(request, game, character, allow_hidden=True)`.
- `build_document_remove_view(npc)` — no extra gate, calls `character_document_remove(request,
  game, character)` (matches `build_item_remove_view`).
- `build_document_remove_all_view(npc)` — gate with `_check_character_all_permission(request,
  game, character_id, npc)` first (matches `build_item_remove_all_view` — DM/admin/superuser, or
  the PC's owning player), then `character_document_remove(request, game, character,
  allow_hidden=True)`.

Import `GameDocumentListSerializer`/`GameDocumentAllListSerializer` from `...serializers` (they
already exist in `games/serializers/games/documents/game_document_list.py` — no new serializer
needed) and the three new functions from `._document_exchange`.

## 4. Thin per-kind view files (new)

Mirroring `games/views/game/pcs/detail/items/*.py` exactly (one-liners calling the builders):

`backend/games/views/game/pcs/detail/documents/`:
- `game_pc_documents_available.py` → `build_documents_available_view(npc=False)`
- `game_pc_documents_available_all.py` → `build_documents_available_all_view(npc=False)`
- `game_pc_document_acquire.py` → `build_document_acquire_view(npc=False)`
- `game_pc_document_acquire_all.py` → `build_document_acquire_all_view(npc=False)`
- `game_pc_document_remove.py` → `build_document_remove_view(npc=False)`
- `game_pc_document_remove_all.py` → `build_document_remove_all_view(npc=False)`

`backend/games/views/game/npcs/detail/documents/`: same six files, `npc=True`.

## 5. Re-export chain (easy to miss)

Each new view function must be threaded through **three** `__init__.py` aggregators, the same way
`game_pc_items_available` already is:
- `backend/games/views/game/pcs/__init__.py` (and `npcs/__init__.py`) — import from
  `.detail.documents.game_pc_document_acquire` etc., add to `__all__`.
- `backend/games/views/game/__init__.py` — re-export, add to `__all__`.
- `backend/games/views/__init__.py` — re-export, add to `__all__`.

(`_character_routes.py`'s `getattr(views, f'game_{kind}_{name_suffix}')` resolves against
`games/views/__init__.py`'s namespace, so a missed re-export fails at URL-resolution time, not
import time — easy to catch via a smoke test hitting each new route.)

## 6. Route registration

Add the 6 new entries to `_CHARACTER_ROUTES` in `backend/games/urls/_character_routes.py` (exact
list in `plan.md`), placed right after the existing `/documents/...` entries.

## 7. Tests

Mirror the existing item exchange test files under `backend/games/tests/views/game/{pcs,npcs}/
detail/items/` (e.g. `game_pc_item_acquire_test.py`, `game_pc_items_available_test.py`,
`game_pc_item_remove_all_test.py`) into a new `.../detail/documents/` sibling set, adapting
fixtures from `GameItem`/`CharacterItem` to `GameDocument`/`CharacterDocument`. Specifically cover:

- `available.json`/`available/all.json`: excludes already-owned documents; regular excludes
  hidden, private includes them; `?name=` filters case-insensitively; private requires
  `check_game_edit` (403 for a PC's own owning player who isn't staff/dm).
- `acquire.json`: 201 + correct body on success; 422 (not 400) on duplicate; 404 on hidden
  `GameDocument` via the regular endpoint; 403 for a non-owner, non-staff player.
- `acquire/all.json`: same as above but `allow_hidden=True`; additionally 403 for a PC's own
  owning player (no owner shortcut, unlike remove).
- `remove.json`/`remove/all.json`: 204 on success; 404 if not owned or hidden-without-permission;
  `remove/all.json` allows the PC's owning player (200/204), unlike `acquire/all.json`.
- 404 if the character itself is hidden (NPC only, `check_hidden=npc`), consistent with items.

Run via `docker-compose run --rm majora_tests pytest` (or `make tests` for an interactive shell)
and `ruff check .` for lint, per `AGENTS.md`.
