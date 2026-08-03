# Plan: Add document exchange

Issue: [920-add-document-exchange.md](../../issues/920-add-document-exchange.md)

## Overview

Documents currently have working list/detail pages but no way to grant or revoke one from a
character. This plan adds an Acquire/Remove exchange modal to the PC/NPC documents pages,
mirroring the existing **Item** exchange modal (issue #773) almost line-for-line — same tab
shape (no Buy/Sell, since documents carry no quantity/money), same `regular`/`private`
(`all.json`) endpoint-variant pattern, same permission asymmetry between Acquire and Remove.

No migration is needed: `GameDocument` and `CharacterDocument` (including the `unique_together`
constraint enforcing one-instance-per-character) already carry everything required. Most of the
serializers needed already exist too (`GameDocumentListSerializer`/`GameDocumentAllListSerializer`
for the catalog, `CharacterDocumentSerializer`/`CharacterDocumentAllSerializer` for the acquire
response) — confirmed by reading the actual `_item_exchange.py`/`_character_shared.py` sources
rather than assuming symmetry with items, which also surfaced two corrections to the issue file
itself (documented in `backend.md`): the private/`all.json` endpoints do **not** share a uniform
permission check with the regular ones — Acquire's private variant is strictly DM/admin-only
(`check_game_edit`, no PC-owner shortcut) while Remove's private variant additionally allows the
PC's owning player (`_check_character_all_permission`) — and a brand-new permission resource
(`game_pc_document`/`game_npc_document`) must be created since it doesn't exist yet, unlike
`game_pc_item`/`game_npc_item`.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

(No `cache` work: items/documents' character-scoped endpoints are not registered in
`navi/navi_config.yaml` at all today — only `treasures`, `games`, `pcs`, `npcs`, `permissions`
are. This issue doesn't change that.)

## Shared contracts

### New backend routes

Added to `_CHARACTER_ROUTES` in `backend/games/urls/_character_routes.py` (shared by both PC and
NPC `urls.py`), right after the existing `/documents/...` entries:

```python
('/documents/available.json', 'documents_available'),
('/documents/available/all.json', 'documents_available_all'),
('/documents/acquire.json', 'document_acquire'),
('/documents/acquire/all.json', 'document_acquire_all'),
('/documents/remove.json', 'document_remove'),
('/documents/remove/all.json', 'document_remove_all'),
```

Resulting endpoints (`:kind` = `pcs`/`npcs`):

| Action | Regular | Private (`all.json`) |
|---|---|---|
| List available documents | `GET .../:kind/:id/documents/available.json` | `GET .../:kind/:id/documents/available/all.json` |
| Acquire document | `POST .../:kind/:id/documents/acquire.json` | `POST .../:kind/:id/documents/acquire/all.json` |
| Remove document | `POST .../:kind/:id/documents/remove.json` | `POST .../:kind/:id/documents/remove/all.json` |

### Request/response bodies

- **Acquire request:** `{ "game_document_id": <int>, "hidden": <bool|null> }` — `hidden` optional,
  defaults to the selected `GameDocument`'s own `hidden` value when omitted/`null`.
- **Acquire success:** `201`, body = `CharacterDocumentAllSerializer(character_document).data`
  (existing serializer, already has `id`, `game_document_id`, `name`, `description`,
  `photo_path`, `hidden` — no new serializer needed).
- **Acquire duplicate:** `422` (not `400`, unlike items — an explicit, deliberate divergence from
  the `_item_exchange.py` precedent, decided during `/enhance-issue`; do not copy items' `400`).
- **Remove request:** `{ "game_document_id": <int> }`.
- **Remove success:** `204`. **Remove not found / hidden without permission:** `404`.
- **Available list:** paginated envelope wrapping `GameDocumentListSerializer` (`id`, `name`,
  `photo_path`) regular / `GameDocumentAllListSerializer` (+ `hidden`) private — both already
  exist, reused as-is. Supports `?name=` (case-insensitive substring on `GameDocument.name`, via
  the existing `filter_by_name` helper) and standard pagination (`page`, `per_page`).

### Permission matrix (verified against `_item_exchange.py`/`_character_shared.py`, not assumed)

| Endpoint | Outer gate | Inner resource check |
|---|---|---|
| `available` (regular) | none (`AllowAny`; NPC hidden-character gate still applies) | none |
| `available/all` (private) | `check_game_edit` — **DM/admin/superuser only, no PC-owner shortcut** | none |
| `acquire`/`remove` (regular) | none | `EndpointPermission(...).check(request, resource, 'restricted', 'create')`, `resource` = `game_pc_document`/`game_npc_document` |
| `acquire/all` (private) | `check_game_edit` — **DM/admin/superuser only, no PC-owner shortcut** (deliberately asymmetric vs. remove — matches items' issue #773 precedent) | same inner check, `allow_hidden=True` |
| `remove/all` (private) | `_check_character_all_permission` — DM/admin/superuser, **or the PC's owning player** for PCs | same inner check, `allow_hidden=True` |

This asymmetry (Acquire's private path is stricter than Remove's) is why the frontend routes
Acquire off `gameCanEdit` (game-level) and Remove off `canEdit` (character-level) — see
`frontend.md`.

New permission resource config required (does not exist yet, unlike items):
`backend/games/permissions/config/game_pc_document/endpoints.yml` and
`.../game_npc_document/endpoints.yml` — see `backend.md` for exact content.

### Frontend request config (`documentConfig.js`)

Three new entries, `regular`/`private` pairs shaped exactly like `itemConfig.js`'s
`GET.availableCollection`/`POST.acquire`/`POST.remove` (`permission: null` regular,
`permission: 'can_edit'` private — documentation-only, since callers always pass `variantName`
explicitly). `GET.collection` (the plain documents list) already exists unchanged and is reused
as-is by the Remove tab's browse list (see `frontend.md`).

### i18n

New namespace `document_exchange_modal`, added to both `frontend/assets/i18n/en.yaml` and
`pt.yaml`. Full key set (mirrors `item_exchange_modal`'s exactly): `title`, `search_placeholder`,
`acquire_tab`, `acquire_tab_tooltip`, `remove_tab`, `remove_tab_tooltip`, `hidden_label`,
`confirm`, `cancel`, `back`, `cancel_selection`, `loading`, `empty`, `load_error`,
`already_owned_error`, `generic_error`. See `translator.md` for exact copy.
