# Issue: Add game documents and character game documents

## Description
Add `GameDocument` and `CharacterDocument` models, following the same architectural pattern as the existing `GameItem`/`CharacterItem` pair. Items represent magical or special items; documents are special items that carry written information instead. Multi-photo galleries and file uploads (the actual document content) are explicitly deferred to future issues.

## Solution

### GameDocument and CharacterDocument
Just like `GameItem`/`CharacterItem`, add a `GameDocument` model (game-scoped) and a `CharacterDocument` model (character-scoped, FK to both `Character` and `GameDocument`), following the same field/association shape (`name`, `description`, `hidden`, display `photo` FK) and the same versioning setup (`HistoricalRecords`) as the item pair.

### Display photo
Like the `Character` model's `profile_photo`, `GameDocument` and `CharacterDocument` each have a single designed display photo field. This issue adds the `GameDocumentPhoto`/`CharacterDocumentPhoto` models and the display `photo` FK on each model (schema only, mirroring `GameItem`'s original scope before photo upload was added), with a placeholder shown when empty.

### Photo gallery (deferred)
Documents will eventually have a full photo gallery, like a character's photo collection (more than just the single display photo). That gallery, and any photo upload endpoint, are not solved in this issue/PR.

### Fallback attributes
Just like `CharacterItemSerializer`, `CharacterDocumentSerializer` falls back to the linked `GameDocument` attributes (`name`, `description`, `photo`) whenever the `CharacterDocument` own value is `None` - using the same resolution helper pattern as `resolve_character_item_field`.

### Photo placeholder
When there is no photo, show a minimalistic placeholder image: a book with a scroll and a few loose pages of paper coming out of it (parallel to `default_item.png`).

### See all icon
Use the bootstrap `folder` icon for the "see all documents" link.

### Hidden
Both models have their own independent `hidden` boolean, exactly like `GameItem`/`CharacterItem`. The `CharacterDocument` endpoints filter on `CharacterDocument.hidden`, not `GameDocument.hidden`.

### UI
PC and NPC show pages get a documents shortlist, positioned beneath the existing items shortlist.

### Permissions
Same permission model as `GameItem`/`CharacterItem`: regular endpoints are open/read-scoped and exclude hidden documents; `/all.json` endpoints require game-edit permission (staff/DM) and include hidden documents.

### Changed Pages
- `/#/game/:game_slug/pc/:id`
- `/#/game/:game_slug/npc/:id`

Add a link to the Documents page (`/#/game/:game_slug/documents`) under the "Game" header dropdown menu.

### New pages
- `/#/game/:game_slug/documents`
- `/#/game/:game_slug/pc/:id/documents`
- `/#/game/:game_slug/npc/:id/documents`

Same restricted-endpoint permission handling as the equivalent item pages.

### Endpoints
- `/game/:game_slug/documents.json`
- `/game/:game_slug/documents/all.json`
- `/game/:game_slug/pc/:id/documents.json`
- `/game/:game_slug/pc/:id/documents/all.json`
- `/game/:game_slug/npc/:id/documents.json`
- `/game/:game_slug/npc/:id/documents/all.json`

### Cache warming
Warm the new endpoints in `.circleci/navi_config.yaml`, following the existing item entries:
- With pagination: `/game/:game_slug/documents.json`, `/game/:game_slug/pc/:id/documents.json`, `/game/:game_slug/npc/:id/documents.json`
- Short list (`?per_page=5`): `/game/:game_slug/pc/:id/documents.json`, `/game/:game_slug/npc/:id/documents.json`

### Not in this issue / PR
- Single document show page and its detail endpoint (`GET /documents/<id>.json`)
- Create/edit document pages and create/update endpoints
- Photo upload endpoint and the multi-photo gallery (beyond the single display photo)
- File upload — files are the actual document content; a document will eventually have a collection of files (many files per document, like the photo gallery), to be designed in a future issue
