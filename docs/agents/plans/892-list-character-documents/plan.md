# Plan: List Character Documents

Issue: [892-list-character-documents.md](../../issues/892-list-character-documents.md)

## Overview

Strip `CharacterDocument` down to a thin join (`id`, `character`, `game_document`, `hidden`) by
removing its `name`/`description`/`photo` override fields and the `CharacterDocumentPhoto` model,
then add the missing show/detail endpoints and frontend pages for it (list endpoints/pages
already exist), mirroring `CharacterItem`'s equivalent feature end-to-end. The backend agent owns
the model/serializer/migration/endpoint work; the frontend agent owns the new pages, routing, and
the shortlist/list click-through wiring that's already scaffolded and waiting on this; the
translator agent adds the new i18n keys the frontend agent's copy needs.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Public `CharacterDocument` fields (from backend, consumed by frontend)

`CharacterDocumentSerializer` (`GET .../documents.json`, `GET .../documents/:id.json`):
- `id` (integer) — the `CharacterDocument` row id, not the `GameDocument` id
- `game_document_id` (integer)
- `name` (string) — sourced directly from `game_document.name` (no more override/fallback)
- `photo_path` (string, nullable) — sourced directly from `game_document.photo.path`

`CharacterDocumentAllSerializer` (`GET .../documents/all.json`, `GET .../documents/:id/full.json`)
adds:
- `hidden` (boolean)

No `description` field is exposed at any tier — the issue's own serializer spec never lists one,
unlike `CharacterItem`'s detail tier. Frontend must not expect it.

### New endpoints (backend produces, frontend consumes)

- `GET /games/:game_slug/pcs/:character_id/documents/:id.json` — public show, `AllowAny`, 404 if
  hidden `CharacterDocument` or missing.
- `GET /games/:game_slug/npcs/:character_id/documents/:id.json` — public show, `AllowAny`, 404 if
  hidden `CharacterDocument`, missing, or NPC hidden.
- `GET /games/:game_slug/pcs/:character_id/documents/:id/full.json` — private show
  (`CharacterEditPermission`: dm, admin, or the PC's owning player), includes hidden.
- `GET /games/:game_slug/npcs/:character_id/documents/:id/full.json` — private show
  (`GameEditPermission`: dm, admin only, no owner), includes hidden.

These four mirror `CharacterItem`'s `item_detail`/`item_detail_full` route pair exactly (same
`/full.json` suffix convention, same permission split), just without a `PATCH` branch (documents
have nothing left to edit) and without photo-upload (documents no longer have their own photo).

### Frontend consumption points already scaffolded, waiting on the above

- `frontend/assets/js/utils/requests/config/documentConfig.js` — `GET.single` currently only
  branches on `kind: 'game'`; needs a `'pcs'|'npcs'` branch added, mirroring `itemConfig.js`'s
  `characterSinglePath`/`characterSingleFullPath` shape exactly (params: `gameSlug`, `kind`, `id`
  (character id), `documentId`).
- `frontend/assets/js/components/common/list_types/configs/documentListTypes.js` —
  `buildCharacterDocumentHref()` currently always returns `null`; once the show page exists it
  must build a real per-kind href, mirroring `listTypeConfig.js`'s `buildCharacterItemItemHref`.
- `frontend/assets/js/components/common/cards/shortListResourceConfig.js` — the `document` entry
  is `action: 'none'`; once the show page exists it must flip to `action: 'navigate'` with a
  `buildHref`, mirroring the `item` entry immediately above it.
- `frontend/assets/js/components/common/cards/DocumentPreviewCard.jsx` +
  `helpers/DocumentPreviewCardHelper.jsx` — currently render a non-link card by design (their own
  doc comments say so); need an optional `href` prop added, mirroring
  `ItemPreviewCard`/`ItemPreviewCardHelper` exactly.

### Documentation to update in the same PR

`docs/agents/access-control/character-document.md` currently documents the *pre-#892* state (still
describes `CharacterDocument`'s now-removed override fields, and explicitly says "no detail
endpoint... in this issue" referring to the issue that shipped the four index endpoints). It must
be rewritten to describe the post-#892 shape: thin join, fixed `GameDocument`-sourced `name`/
`photo_path`, and the four new show/detail endpoints — see `backend.md`.
