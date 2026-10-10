# Issue: Game content copy spec: Documents tab

## Description

Part of the "copy content between games" epic (#1550). Write the spec page
`docs/agents/specs/game-content-copy/documents.md` for the **Documents** tab of the staff-only
copy page. Like the Items, Common items and Recipes pages, it only adds the rules specific to
`GameDocument` and references the global pages (`page.md`, `copy-flow.md`, `hard-links.md`,
`permissions.md`) instead of repeating them. No code changes.

## Problem

`GameDocument` is the richest copyable type: besides its own fields it owns versioned pages
(`GameDocumentPage` + `GameDocumentPageHistory`), many uuid-named photos (`GameDocumentPhoto`,
one of which is the cover), many uuid-named files under the `files` root (`GameDocumentFile`),
and an optional photo per file (`GameDocumentFilePhoto`). That photo is linked to its file only
through `GameDocumentFile.photo`, so it has no back-reference to its file. The global pages do
not say how these associations are copied, and the tab cannot be implemented without that.

## Expected Behavior

`documents.md` exists, follows the structure of `items.md` (Model, Copied fields, Not copied,
Pages, Photos, Files, Names, API, Cache, Frontend, Testing), and is linked from the index
`docs/agents/specs/game-content-copy.md` (replacing the pending "Documents — #1555" entry). It
specifies:

- **Copied model**: `GameDocument` — `name`, `description`, `hidden` (source value), `game` =
  target, `copied_from` = source; cover `photo` null at copy time, set by the cover link's
  finalize (`is_cover=true`).
- **Pages**: only the current `GameDocumentPage` rows, keeping `order` and `content`; every
  copied page starts at `version` 1 and **no** `GameDocumentPageHistory` is created. Content is
  copied verbatim; the spec notes that URLs embedded in the markdown keep pointing at the source
  game.
- **Ready filter**: only `ready=true` photos, files and file photos are copied (as Items does).
  A not-ready cover means the copy has no cover; a not-ready file is skipped with its photo; a
  ready file with a not-ready photo is copied without a photo.
- **Document photos**: each `GameDocumentPhoto` → a new `ready=false` row under the copy, at a
  path built like `game_document_photo_upload` (`games/<target>/documents/<copy-id>/`, uuid,
  `photos` root), with one `image` copy-origin `Upload`; the source cover gets `is_cover=true`.
- **Document files**: each `GameDocumentFile` (keeping `name`) → a new `ready=false` row at a
  path built like `game_document_file_upload` (uuid, `files` root), with one `file` copy-origin
  `Upload` hard-linked within the files root.
- **File photos**: each file's `GameDocumentFilePhoto` → a new `ready=false` row at the fixed
  `games/<target>/documents/<copy-id>/files/<file-copy-id>/photo<ext>` path, with one `image`
  `Upload`. The copied file's `photo` FK is set to it **at copy time**, inside the transaction,
  as the regular upload does (photo `ready=false` until its link finalizes). This keeps the row
  reachable: it has no other link to its file, and so none to its game. The finalize only sets
  `ready=true` (`is_cover=false`).
- **Names**: clashes in the target game are allowed.
- **Large documents**: no hard limit. Still one transaction that writes rows only (no file
  I/O); the spec notes that the `links` list and the per-file progress grow with photos +
  files + file photos.
- **API**: list `GET staff/copies/documents.json?from=&to=` row fields, `POST
  staff/copies/documents/<id>.json` (`links` with N entries across photos, files and file
  photos), and the pending-links query per record type (`GameDocumentPhoto` via
  `game_document__game`, `GameDocumentFile` via `game_document__game`, `GameDocumentFilePhoto`
  via its owning file).
- **Cache**: the `X-Cache-Clear` paths for the target game's document family (document, pages,
  photos, files).
- **Frontend**: the tab's row columns.
- **Testing**: the per-type backend and frontend cases.

## Solution

Spec-only change, owned by `architect`: add `documents.md` and update the index link.
Decisions made in the discussion:

- Copied file's `photo` FK set at copy time (not on finalize), so no new `Upload` field is
  needed and the file-photo row stays reachable for the pending-links query.
- Only `ready=true` photos/files/file photos are copied.
- Page content copied verbatim, with embedded source URLs documented as a known limitation.
- No hard size limit on a copied document.

## Benefits

- Unblocks the Documents part of the implementation (#1558) with no guesswork about pages,
  history, multiple photos/files and nested file photos.
- Keeps the per-tab pages consistent and the global rules in one place.
