# Issue: Add photos and file shortlist for character document

## Description
`GameDocument` represents a document the DM can share with players, and can have `GameDocumentFile`s and `GameDocumentPhoto`s attached to it (downloadable/viewable by anyone with access to the document). `CharacterDocument` is the join representing that a `Character` possesses a given `GameDocument` (two characters may share possession, but a character cannot possess the same `GameDocument` twice). `CharacterDocument` itself has no files or photos of its own — a player with access to a `CharacterDocument` should be able to list and see the underlying `GameDocument`'s files and photos.

`GameDocument.hidden` means the DM has not made the document public yet (even if already shared with a PC/NPC). `CharacterDocument.hidden` means the PC/NPC has not shared that they possess the document (visible only to dm, admin, and the owner).

## Problem
- On the `GameDocument` show page (`/#/games/:game_slug/documents/:id`), the files shortlist is more useful than the photos shortlist, but currently renders **after** it.
- The shortlist limit on that page is capped at 11 items, which is unnecessarily small given the page has little other content.
- The `CharacterDocument` show pages (PC and NPC) have no files/photos shortlists at all, even though a player with access to a `CharacterDocument` should be able to see the underlying `GameDocument`'s files and photos.

## Expected Behavior
- `GameDocument` show page: files shortlist appears above the photos shortlist, and the shortlist limit is raised from 11 to 17.
- `CharacterDocument` show pages (`/#/games/:game_slug/pcs/:character_id/documents/:id` and `.../npcs/:character_id/documents/:id`) look like the `GameDocument` show page: photo, name, description, files shortlist, photos shortlist — all delegated from the underlying `GameDocument`, since `CharacterDocument` carries no name/description/files/photos of its own.
- New paginated endpoints list a `CharacterDocument`'s underlying `GameDocument` files/photos, for both PC and NPC, each with a public and a private (`/all.json`) variant:
  - Public: 404 if `CharacterDocument` is `hidden`; for NPCs, also 404 if `Character` is `hidden` (matching the existing NPC-only hidden gate used by `documents.json`/`items.json` — a PC's own `hidden` flag does not gate its document endpoints, and this issue introduces no PC-hidden precedent); `[]` if `Character` is `incognito`; ignores `GameDocument.hidden`.
  - Private (`/all.json`): PC via `CharacterEditPermission` (dm, admin, owner), NPC via `GameEditPermission` (dm, admin — no owner concept for NPCs), matching the existing `documents/all.json`/`items/all.json` permission shape (no Staff bypass). Ignores `CharacterDocument`/`Character` hidden and incognito state, and `GameDocument.hidden`.
  - The `incognito` → `[]` rule is a **new extension** of `Character.incognito`'s documented scope (today it only nulls `profile_photo_path`, per `docs/agents/access-control/character.md`'s "Incognito field" section) — that doc must be updated in the same PR to reflect that incognito now also empties these content lists, alongside `docs/agents/access-control/character-document.md`'s endpoint table.

## Solution
- Frontend: swap the order of `DocumentFilesPreview`/`DocumentPhotosPreview` in `documentShowType.js`'s `bottom` slot, and raise `MAX_PREVIEW_PHOTOS`/`MAX_PREVIEW_FILES` (`characterPreviewConstants.js`) from 11 to 17.
- Frontend: extend `CharacterDocument`'s show-type config/helper to also render description and files/photos shortlists (mirroring the `GameDocument` page's bespoke `DocumentPhotosPreview`/`DocumentFilesPreview` pattern, not the generic `ShortList` component), backed by 2 new resource configs alongside `gameDocumentFileConfig.js` (e.g. `characterDocumentFileConfig.js`/`characterDocumentPhotoConfig.js`), one file per resource.
- Backend: add public + `/all.json` endpoints for PC/NPC document files and photos (8 endpoints total), following the existing `_character_shared.py` factory pattern (`build_documents_view`/`build_documents_all_view`, mirrored by `build_items_view`/`build_items_all_view`) and `_character_routes.py`'s route table, all paginated.
- Backend: introduce `CharacterDocumentFile`/`CharacterDocumentPhoto` as serializer-only (non-DB) shapes delegating straight to the underlying `GameDocument`'s `GameDocumentFile`/`GameDocumentPhoto` querysets — no new database tables. Field-by-field shape mirrors the existing `GameDocumentFileSerializer`/`GameDocumentPhotoSerializer` (plus `character_document_id`), finalized during planning rather than locked here.
- Backend: `CharacterDocument` delegates `name`, `description`, `GameDocumentPhoto`, and `GameDocumentFile` to its `GameDocument`.
- Backend: the public endpoints' `incognito` → `[]` rule needs new gating logic — today `incognito` is only a serializer-level concealment (`_profile_photo_path.py`), with no view-level gate to reuse; model it after the existing `_hidden_gate_response` pattern in `_shared.py`.

## Benefits
- Consistent experience between `GameDocument` and `CharacterDocument` show pages.
- Surfaces the more useful content (files) first and reduces wasted shortlist space.
- Gives players visibility into files/photos of documents their characters possess, symmetric to what the DM/owner already sees on the `GameDocument` page.
