# Plan: Add photos and file shortlist for character document

Issue: [897_add-photos-and-and-file-shortlist-for-character-document.md](../../issues/897-add-photos-and-and-file-shortlist-for-character-document.md)

## Overview

Reorder and enlarge the `GameDocument` show page's files/photos shortlists, then bring the
`CharacterDocument` (PC/NPC) show pages up to parity by adding the same photo/name/description/
files/photos display. Parity requires 8 new backend endpoints (files + photos, public + `/all.json`,
pc + npc) that read through a `CharacterDocument` to its underlying `GameDocument`'s files/photos,
plus new frontend resource configs and preview components mirroring the existing `GameDocument`
page's bespoke pattern.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

**New endpoints** (all paginated, `Paginator`/`paginated_list_response` shape — `data` array +
pagination headers), added to `_CHARACTER_ROUTES` in `backend/games/urls/_character_routes.py`
and exposed for both `pcs` and `npcs`:

| Path suffix | Visibility |
|---|---|
| `/documents/<document_id>/files.json` | public (see gating below) |
| `/documents/<document_id>/files/all.json` | private |
| `/documents/<document_id>/photos.json` | public (see gating below) |
| `/documents/<document_id>/photos/all.json` | private |

Full paths: `/games/:game_slug/pcs/:character_id/documents/:document_id/files.json`, and the
`npcs`/`photos`/`all.json` combinations thereof — `:document_id` is the `CharacterDocument`'s own
id (matching the existing `/documents/:id.json` route), not `GameDocument`'s id.

**Gating** (public variant): 404 if `CharacterDocument.hidden`; for NPCs only, also 404 if
`Character.hidden` (PCs have no such gate — matches the existing `documents.json`/`items.json`
NPC-only `check_hidden` pattern); `[]` (empty paginated response, not 404) if `Character.incognito`.
`GameDocument.hidden` is ignored in both variants. Private variant (`/all.json`): PC via
`CharacterEditPermission` (dm/admin/owner), NPC via `GameEditPermission` (dm/admin, no owner
concept) — no Staff bypass — and ignores all hidden/incognito state, matching
`_check_character_all_permission`'s existing split.

**Response shape** — new `CharacterDocumentFileSerializer`/`CharacterDocumentPhotoSerializer`,
serializing the underlying `GameDocumentFile`/`GameDocumentPhoto` rows plus the requested
`CharacterDocument`'s id:
- File: `id` (`GameDocumentFile.id`), `character_document_id`, `name`, `path`, `photo_path`
  (mirrors `GameDocumentFileSerializer` plus `character_document_id`).
- Photo: `id` (`GameDocumentPhoto.id`), `character_document_id`, `path` (mirrors
  `GameDocumentPhotoSerializer` plus `character_document_id`).

`CharacterDocumentSerializer` additionally gains a `description` field (`source='game_document.description'`,
read-only) — needed by the frontend show page, currently absent entirely.

**Frontend resource config keys** (registered in `frontend/assets/js/utils/requests/resourceConfig.js`):
`characterDocumentFile`/`characterDocumentPhoto`, `GET.collection.regular`/`.private`, params
`gameSlug`, `kind` (`'pcs'`/`'npcs'`), `characterId`, `documentId` — pointing at the paths above.
Mirrors `gameDocumentFileConfig.js`/`gameDocumentPhotoConfig.js` exactly, one extra path segment
for the character scope.

**Shortlist item limit**: both the `GameDocument` page (existing) and the new `CharacterDocument`
previews use the same limit, raised to 17 — but see `frontend.md`'s note: `MAX_PREVIEW_PHOTOS` is
currently shared with an unrelated character-photo preview section, so it must **not** be bumped
directly; introduce a dedicated constant instead.
