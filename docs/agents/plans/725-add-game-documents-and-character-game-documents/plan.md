# Plan: Add game documents and character game documents

Issue: [725-add-game-documents-and-character-game-documents.md](../issues/725-add-game-documents-and-character-game-documents.md)

## Overview

Add a `GameDocument`/`CharacterDocument` model pair that mirrors the existing
`GameItem`/`CharacterItem` pair exactly (same field shape, `hidden` semantics, fallback
resolution, and permission model), but scoped down to read-only surfaces: list + `/all.json`
endpoints (no detail/create/update/photo-upload endpoints), new list pages, a PC/NPC documents
shortlist beneath the existing items shortlist, a header nav link, and Navi cache warming. A
display-photo FK and its backing photo models are created now (schema only, no upload endpoint
yet), matching how `GameItem` originally shipped before photo upload was added in a later issue.
Multi-photo galleries and file uploads (the actual document content) are out of scope, deferred
to future issues.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)
- [infra](infra.md)

## Shared contracts

**New read-only endpoints** (all `GET`, no request body):
- `/games/<slug>/documents.json` — paginated, `AllowAny`, excludes `hidden=True` documents.
- `/games/<slug>/documents/all.json` — `GameEditPermission` (staff/DM), includes hidden, sets
  `X-Skip-Cache: true`.
- `/games/<slug>/pcs/<id>/documents.json` / `/games/<slug>/npcs/<id>/documents.json` — paginated,
  same visibility rules as the equivalent item endpoints (character-owner/DM/admin can view the
  character at all; the character's own `hidden` documents are excluded from this variant).
- `/games/<slug>/pcs/<id>/documents/all.json` / `/games/<slug>/npcs/<id>/documents/all.json` —
  `CharacterEditPermission` (PC) / `GameEditPermission` (NPC), includes hidden.

There is **no** `/documents/<id>.json` detail endpoint in this issue (no show-document page yet).

**Response fields**:
- `GameDocumentListSerializer` (list + all-list base): `id`, `name`, `photo_path`.
- `GameDocumentAllListSerializer`: adds `hidden`.
- `CharacterDocumentSerializer`: `id`, `game_document_id`, `name`, `photo_path` — `name`/
  `photo_path` fall back to the linked `GameDocument`'s value whenever the `CharacterDocument`'s
  own value is `None` (exactly like `CharacterItemSerializer`/`resolve_character_item_field`).
- `CharacterDocumentAllSerializer`: adds `hidden` (own field, never inherited from `GameDocument`).

**Photo schema** (produced by backend, consumed by nothing outside backend in this issue since
there's no upload endpoint yet): `GameDocument.photo` FK → `GameDocumentPhoto` (`SET_NULL`,
`related_name='+'`), `CharacterDocument.photo` FK → `CharacterDocumentPhoto` (`SET_NULL`,
`related_name='+'`). `photo_path` is `null` until a future issue adds upload.

**Frontend ⇄ translator i18n keys** (frontend calls `Translator.t(...)` with these; translator
adds them to both `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`):
- `game_page.documents` — nav dropdown + game show page link label.
- `character_page.documents_title` — PC/NPC nav link + shortlist preview title.
- `character_documents_preview.empty` — shortlist empty-state text.
- `game_documents_page.{loading,title,hidden_label}` — game-level full list page.
- `character_documents_page.{loading,title,hidden_label}` — PC/NPC full list page.

**Frontend ⇄ infra endpoint paths** (infra wires Navi cache-warming resources against exactly
these paths, produced by backend): the six endpoint paths listed above, plus the existing
`?per_page=5` shortlist convention (`MAX_PREVIEW_ITEMS = 5`) applied to
`pc_documents`/`npc_documents` the same way `short_pc_items`/`short_npc_items` work today.

**Icon**: bootstrap `folder` icon (`bi-folder`) for the shortlist "see all documents" link and
list-type config — new `folder` entry needed in `frontend/assets/js/utils/ui/Icons.js`.

**Placeholder photo asset**: a new `frontend/assets/images/placeholders/default_document.png`
(book with a scroll and loose pages, minimalistic — parallel to `default_item.png`) is needed;
this is a static asset the frontend agent should source/generate, not something backend or infra
touches.
