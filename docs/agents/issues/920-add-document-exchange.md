# Issue: Add document exchange

## Description
Characters can hold three kinds of resources, similar on the surface but different in shape:

- **Treasure** — represents money. A character may hold several instances (quantity) of the same treasure; no per-instance flavor.
- **Item** — a special object the character has. A character may hold several instances of the same item, each with its own flavor (e.g. a red cape and a blue cape). Not traded for money.
- **Document** — a piece of knowledge shared with the character. A character may hold at most **one** instance of each document. Not traded for money.

Treasures and Items already have exchange modals on their character pages: `/#/.../(n)pcs/treasures` (buy, sell, acquire, remove) and `/#/.../(n)pcs/items` (acquire, remove). Documents already have working list/detail pages (`CharacterDocuments.jsx`, `PcCharacterDocuments.jsx`/`NpcCharacterDocuments.jsx`, `CharacterDocumentsHelper.jsx`, from issue #725) at `/#/.../pcs/:id/documents` and `/#/.../npcs/:id/documents`, but no exchange modal — there is currently no way to grant or revoke a document from a character through the UI.

## Problem
Documents have no acquire/remove exchange modal, unlike Treasures and Items — and no backend support exists yet either (no routes/views to acquire, remove, or list available documents for a character).

## Expected Behavior
- On `/#/.../pcs/:id/documents` and `/#/.../npcs/:id/documents`, a trigger button opens an exchange modal with **Acquire** and **Remove** tabs only (no Buy/Sell — documents carry no quantity or money), mirroring the Item exchange modal exactly.
- The Acquire tab browses the game's document catalog (`GameDocument`s the character does not already own), with a debounced name-filter search input; selecting an entry shows a detail pane on the right with the document's photo and name, a "hidden" toggle (defaulting to the `GameDocument`'s own hidden value), and Confirm/Cancel.
- The Remove tab revokes an owned document from the character.
- Both the player (their own character) and the DM/admin can acquire and remove; the DM/admin path additionally works with hidden `GameDocument`/`CharacterDocument`s via a private (`all.json`) endpoint variant.
- Acquiring a document the character already owns returns `422`.
- Regular endpoints return `404` if the character is hidden, `422` if the `GameDocument` is hidden — consistent with the existing Item/Treasure endpoints.
- Removing a document only deletes the character's acquisition record; the underlying `GameDocument`'s files/photos (served via `GameDocumentFile`/`GameDocumentPhoto`) are untouched.

## Solution

### Endpoints
All regular endpoints return 404 if the character is hidden and 422 if the `GameDocument` is hidden.

New routes, added to `_CHARACTER_ROUTES` in `backend/games/urls/_character_routes.py` right after the existing `/documents/...` entries — mirroring the `/items/available[...]`, `/items/acquire[...]`, `/items/remove[...]` routes already there:

```python
('/documents/available.json', 'documents_available'),
('/documents/available/all.json', 'documents_available_all'),
('/documents/acquire.json', 'document_acquire'),
('/documents/acquire/all.json', 'document_acquire_all'),
('/documents/remove.json', 'document_remove'),
('/documents/remove/all.json', 'document_remove_all'),
```

Since `build_character_urlpatterns` is shared by both PC and NPC `urls.py` modules, this yields all 12 concrete endpoints:

| Action | Regular (player-facing) | Private (DM/admin, `all.json`) |
|---|---|---|
| List available PC documents | `GET /games/:game_slug/pcs/:id/documents/available.json` | `GET /games/:game_slug/pcs/:id/documents/available/all.json` |
| Acquire PC document | `POST /games/:game_slug/pcs/:id/documents/acquire.json` | `POST /games/:game_slug/pcs/:id/documents/acquire/all.json` |
| Remove PC document | `POST /games/:game_slug/pcs/:id/documents/remove.json` | `POST /games/:game_slug/pcs/:id/documents/remove/all.json` |
| List available NPC documents | `GET /games/:game_slug/npcs/:id/documents/available.json` | `GET /games/:game_slug/npcs/:id/documents/available/all.json` |
| Acquire NPC document | `POST /games/:game_slug/npcs/:id/documents/acquire.json` | `POST /games/:game_slug/npcs/:id/documents/acquire/all.json` |
| Remove NPC document | `POST /games/:game_slug/npcs/:id/documents/remove.json` | `POST /games/:game_slug/npcs/:id/documents/remove/all.json` |

"List available" means: the character does not already own the document; the regular variant additionally excludes hidden `GameDocument`s, the private (`all.json`) variant includes them.

Both `.../documents/available.json` and `.../documents/available/all.json` accept an optional `?name=` query param, filtered via the existing `filter_by_name(request, queryset, field='name')` helper (`backend/games/views/games/_treasure_filters.py` — despite the filename, a generic case-insensitive-substring filter already reused by `character_items_available` in `_item_exchange.py`).

Backend implementation mirrors `backend/games/views/game/_item_exchange.py`: a new `_document_exchange.py` with `acquire`/`remove`/`available` handlers, `EndpointPermission(...).check(request, resource, 'restricted', 'create')`, `allow_hidden=True` on the `_all` variants.

### Permissions
On the backend, regular and private (`all.json`) endpoints share the *same* authorization check — mirroring `_item_exchange.py`'s `_check_item_create` (`EndpointPermission(request.user, game=game, pc=character).check(request, resource, 'restricted', 'create')`). The only functional difference between the two variants is `allow_hidden`: private accepts/returns hidden `GameDocument`/`CharacterDocument`, regular does not.

Which variant the *frontend* calls is a routing decision, not a separate backend permission tier: `gameCanEdit` (game-level) routes Acquire through `.../acquire/all.json`, `canEdit` (character-level) routes Remove through `.../remove/all.json` — the same split `CharacterItems.jsx` already uses for items.

The codebase's name for the regular/private pair on the frontend is **`regular`/`private`**, modeled by `frontend/assets/js/utils/requests/resourceConfig.js` + `RequestStore.js`, with per-resource configs under `frontend/assets/js/utils/requests/config/*.js` (e.g. `itemConfig.js`). `itemConfig.js`'s `POST.acquire`/`POST.remove` already have exactly the shape documents need:

```js
acquire: {
  regular: { path: acquirePath, permission: null },
  private: { path: acquireAllPath, permission: 'can_edit' },
},
remove: {
  regular: { path: removePath, permission: null },
  private: { path: removeAllPath, permission: 'can_edit' },
},
```

A new/extended `documentConfig.js` should mirror this shape — `GET.availableCollection`, `POST.acquire`, `POST.remove`, each with `regular`/`private` variants.

### Frontend modal design
The Documents exchange modal mirrors the **Item** exchange modal exactly (not Treasure's) since documents have neither quantity nor money:

- `documentExchangeTabs.js` — config map with only `acquire`/`remove` tabs, same shape as `itemExchangeTabs.js`.
- `AcquireDocumentTab.jsx` / `RemoveDocumentTab.jsx` — clones of `AcquireItemTab.jsx`/`RemoveItemTab.jsx`, pointed at the new `documents/available.json` / `documents/acquire.json` / `documents/remove.json` endpoints. The Acquire tab keeps the debounced (`SEARCH_DEBOUNCE_MS`) name-filter search input wired to `?name=`.
- The Acquire tab's detail pane mirrors `AcquireItemTabHelper`'s two-column layout: browse list on the left, and on the right the selected document's photo and name, a hidden-toggle, and Confirm/Cancel.
- `CharacterDocuments.jsx` gains a `showExchangeModal` state and wires in `ResourceExchangeModal`, the same way `CharacterItems.jsx` does. Documents have no create page/permission, so there's no `canCreateDocument` access controller to add — just the exchange trigger button.
- `CharacterDocumentsHelper.jsx` gains an optional trigger-button callback param, mirroring `CharacterItemsHelper.render`'s.
- New i18n namespace `document_exchange_modal.*`, mirroring `item_exchange_modal.*`.

### Data model — nothing new needed
No migration is required; the existing models already carry everything this issue needs:

- `GameDocument` (`backend/games/models/game/game_document.py`): `game`, `name`, `description`, `photo` (FK to `GameDocumentPhoto`), `hidden` — the catalog an acquire browse list reads from.
- `CharacterDocument` (`backend/games/models/character/character_document.py`): `character`, `game_document` (FK), `hidden` (own flag, not inherited from `GameDocument`) — already has `unique_together = [('character', 'game_document')]` at the DB level, enforcing "one instance per document." The new acquire endpoint just needs to check for an existing row (or catch the constraint) and return `422` instead of letting a raw `IntegrityError` surface.

Confirmed by walking the migration history: migration `0072_characterdocument_characterdocumentphoto_and_more.py` already applies `AlterUniqueTogether(("character", "game_document"))`, and migration `0079_remove_characterdocument_photo_and_more.py` (which dropped `CharacterDocumentPhoto` and `CharacterDocument.photo/name/description`) left `GameDocument` and that constraint untouched. Current model files match migration history exactly.

### Affected files
Frontend:
- `frontend/assets/js/components/resources/character/pages/shared/CharacterDocuments.jsx` — modified
- `.../pages/helpers/CharacterDocumentsHelper.jsx` — modified
- `.../pages/elements/documentExchangeTabs.js` — new
- `.../pages/elements/tabs/AcquireDocumentTab.jsx`, `RemoveDocumentTab.jsx` — new
- `.../pages/elements/tabs/helpers/AcquireDocumentTabHelper.jsx`, `RemoveDocumentTabHelper.jsx` — new
- `.../pages/elements/tabs/controllers/AcquireDocumentTabController.js`, `RemoveDocumentTabController.js` — new
- `frontend/assets/js/utils/requests/config/documentConfig.js` — modified
- i18n files — new `document_exchange_modal.*` keys

Backend:
- `backend/games/urls/_character_routes.py` — modified (6 new route entries)
- `backend/games/views/game/_document_exchange.py` — new
- `backend/games/views/game/_character_shared.py` — modified, adds `build_documents_available_view`, `build_documents_available_all_view`, `build_document_acquire_view`, `build_document_acquire_all_view`, `build_document_remove_view`, `build_document_remove_all_view`
- `backend/games/views/game/pcs/detail/documents/game_pc_document_{acquire,acquire_all,remove,remove_all}.py`, `game_pc_documents_available{,_all}.py` — new
- `backend/games/views/game/npcs/detail/documents/game_npc_document_{acquire,acquire_all,remove,remove_all}.py`, `game_npc_documents_available{,_all}.py` — new

## Benefits
- Feature parity across all three resource types a character can hold — Documents get the same acquire/remove workflow Treasures and Items already have.
- DMs/admins gain a UI to grant or revoke documents from a character, matching the existing item-management workflow.
