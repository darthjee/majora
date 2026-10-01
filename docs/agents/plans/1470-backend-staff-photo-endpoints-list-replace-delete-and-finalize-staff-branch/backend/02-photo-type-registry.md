# Photo-type registry

Create `backend/staff/photo_types.py`: an **ordered** list of `PhotoType` entries (small classes or dataclasses), one per photo model, plus `find(slug)` (→ entry or `None`) and `slugs()`.

Each entry declares:

- `slug` / `model`: `game`→`GamePhoto`, `game_faction`→`GameFactionPhoto`, `game_item`→`GameItemPhoto`, `game_common_item`→`GameCommonItemPhoto`, `game_document`→`GameDocumentPhoto`, `game_document_file`→`GameDocumentFilePhoto`, `game_possession`→`GamePossessionPhoto`, `character`→`CharacterPhoto`, `character_item`→`CharacterItemPhoto`, `treasure`→`TreasurePhoto`, `stl_model`→`StlModelPhoto`, `source`→`SourcePhoto`, `collection`→`CollectionPhoto` (this order is the index `types` order).
- `select_related` paths for the list (e.g. `faction__game`, `character_item__character__game`, `treasure__game`).
- `load_owners(photos)` → `{photo_id: owner_or_None}`: default reads the direct FK; `GameDocumentFilePhoto` overrides with **one** batch query `GameDocumentFile.objects.filter(photo_id__in=ids).select_related('game_document__game')`.
- `describe_owner(owner)` → `{type, id, name, kind, game}`: `kind` = `'npc'`/`'pc'` for `Character` (`npc` field), else `None`; `game` = `{slug, name}` or `None` (miniatures, `Treasure.game is None`). Name fields: use each owner's `name` (check `CharacterItem.name` is nullable — fall back to its `game_item.name`).
- `gallery`: `True` for `game`, `character`, `game_document`, `collection`, with a `gallery_owner(photo)` and `fallback_photo(owner, excluding=photo)` → most recent (`-id`) **ready** sibling or `None`; owner's FK attribute is `photo` in all cases.
- Keep the module free of view/HTTP concerns.

Tests (`backend/staff/tests/photo_types_test.py`):

- `find` / `slugs` (13, ordered, unknown → `None`).
- Owner resolution and `describe_owner` per type (parametrized), including `GameDocumentFilePhoto` with and without an owning file, `Treasure` with `game=None`, PC vs NPC.
- **Sync test:** the registry's set of models == the photo models covered by `uploads.views._PHOTO_HANDLERS` (keys that subclass `BasePhoto`) ∪ `{GamePhoto}` (handled by `_DEFAULT_HANDLERS`).

## Files to Change

- `backend/staff/photo_types.py` — new registry module.
- `backend/staff/tests/photo_types_test.py` — registry + sync tests.
