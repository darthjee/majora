# Plan: Game content copy: Documents tab

Issue: [1577-game-content-copy-documents-tab.md](../../issues/1577-game-content-copy-documents-tab.md)

## Overview
This adds the `documents` copy type to the staff copies API and the Documents row to the copy
page, following `docs/agents/specs/game-content-copy/documents.md`. The backend copies a
`GameDocument` with its pages, creates link rows and copy-origin `Upload`s for its ready photos,
files and file photos, and plugs cache-path hooks into the three document `COPY_LINKS` entries
(they already exist, without hooks). The frontend renders the row; the translator adds the new
column/count keys. The proxy `LinkHandler` already supports the `file` type / `files/` root, so
no proxy work is needed.

## Agents involved

- [backend](backend.md)
- [translator](translator.md)
- [frontend](frontend.md)

Reviews after implementation: `data-access`, `security`, and `cache` (confirm the
`X-Cache-Clear` paths and that no Navi resource is needed — `staff/copies/*` is not warmed).

## Shared contracts

### `GET staff/copies/documents.json?from=<slug>&to=<slug>` row (backend → frontend)

Paginated, ordered by `id`, every source document (hidden included):

```json
{
  "id": 12,
  "name": "Royal decree",
  "hidden": false,
  "photo": "photos/games/src/documents/12/decree_<uuid>.png",
  "pages_count": 3,
  "photos_count": 2,
  "files_count": 1,
  "copied_to_target": false
}
```

- `photo`: string or `null` (the cover path only when the cover is `ready`).
- `pages_count`: int, every page of the source.
- `photos_count` / `files_count`: int, `ready=true` rows only.
- `copied_to_target`: bool.

### Tab slug and order

`documents` is inserted in `COPY_TYPES` right after `recipes` (spec order: `items`,
`common_items`, `recipes`, `documents`, `factions`, `possessions`). The `staff_copies_page.types.documents`
label already exists.

### i18n keys (translator → frontend), in `staff_copies_page` (en + pt)

- `counts_column`: header of the counts column — en `Contents`.
- `document_counts`: en `'{{pages}} pages / {{photos}} photos / {{files}} files'` (interpolated
  with `pages`, `photos`, `files`).

The photo, name, hidden and "already copied" cells reuse the existing `photo_column`,
`name_column`, `hidden_column`, `hidden_badge` and `copied_to_target` keys.
