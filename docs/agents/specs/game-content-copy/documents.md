# Game Content Copy — Documents

Part of the [Game Content Copy](../game-content-copy.md) spec. Only adds the rules specific to
the **Documents** tab; everything else follows the global pages: [page.md](page.md),
[copy-flow.md](copy-flow.md), [hard-links.md](hard-links.md) and
[permissions.md](permissions.md).

`GameDocument` is the richest copyable type: besides its own fields it owns versioned pages,
many photos (one of which is the cover), many files, and an optional photo per file.

## Model

- Tab slug `documents`, label "Documents", model `GameDocument`
  (`backend/games/models/game/game_document.py`): `game`, `name`, `description`, `hidden`,
  cover `photo` FK → `GameDocumentPhoto` (`SET_NULL`), simple-history.
- `GameDocumentPage` (`backend/games/models/game/game_document_page.py`): `game_document` FK
  (`related_name='pages'`), `content`, `order`, `version` (default 1).
- `GameDocumentPageHistory`: FK to the document only (`related_name='page_history'`), none to
  the page.
- `GameDocumentPhoto` (`BasePhoto`: `path`, `ready`): `game_document` FK
  (`related_name='photos'`).
- `GameDocumentFile` (`BaseFile`: `path`, `name`, `ready`): `game_document` FK
  (`related_name='files'`), `photo` FK → `GameDocumentFilePhoto` (`SET_NULL`,
  `related_name='+'`).
- `GameDocumentFilePhoto` (`BasePhoto`: `path`, `ready`): **no** FK to its file. It is linked to
  its file only through `GameDocumentFile.photo`, and so to its game only through that file.

## Copied fields

| Field | Value on the copy |
|---|---|
| `name`, `description` | Source value. |
| `hidden` | Source value ([copy-flow.md](copy-flow.md#hidden)). |
| `game` | The target game. |
| `copied_from` | The source document ([copy-flow.md](copy-flow.md#copied_from)). |
| `photo` | Null at copy time, set by the cover link's finalize ([copy-flow.md](copy-flow.md#cover-photo)). |

The associated rows (pages, photos, files, file photos) are created in the same transaction, as
described below.

## Not copied

- `GameDocumentPageHistory` rows of the source: the copy starts with no page history.
- The source document's history (simple-history).
- Any photo, file or file photo with `ready=false` ([Ready filter](#ready-filter)).

See [copy-flow.md](copy-flow.md#character-links-and-history).

## Pages

- Only the current `GameDocumentPage` rows of the source are copied, each keeping its `order`
  and `content`.
- Every copied page starts at `version=1`, whatever the source version, and **no**
  `GameDocumentPageHistory` row is created for the copy.
- `content` is copied verbatim. **Known limitation**: URLs embedded in the markdown (e.g. links
  or images pointing at the source game's photos/files or pages) keep pointing at the source
  game; they are not rewritten.

## Ready filter

Only `ready=true` rows are copied, as for items
([copy-flow.md](copy-flow.md#edge-cases)):

- a not-ready cover photo → the copy has **no cover** (no row, no link, `photo` stays null);
- a not-ready `GameDocumentPhoto` → skipped;
- a not-ready `GameDocumentFile` → skipped **together with** its photo;
- a ready file whose photo is not ready → the file is copied **without** a photo.

## Photos

- Each ready `GameDocumentPhoto` of the source becomes one `GameDocumentPhoto` row of the copy,
  `ready=false`, at a path built like `game_document_photo_upload`: `PhotoPathBuilder` segments
  `['games', <target-slug>, 'documents', <copy-id>]`, the source filename with `use_uuid=True`,
  `root='photos'` — i.e. `photos/games/<target-slug>/documents/<copy-id>/<stem>_<uuid><ext>`
  ([hard-links.md](hard-links.md#storage-roots)). `<stem>` and `<ext>` come from the source
  path's filename with its uuid suffix removed, so a re-copy does not chain uuids; a fresh uuid
  is generated for the copy.
- Each gets one copy-origin `Upload` with `upload_type=image`. The row matching the source's
  cover `photo` gets `is_cover=true`; every other photo gets `is_cover=false`.
- The cover link's finalize (`CopyLinkFinalizer`) sets the copy's `photo` FK
  ([hard-links.md](hard-links.md#finalize)); the other photo links only set `ready=true`.

## Files

- Each ready `GameDocumentFile` of the source becomes one `GameDocumentFile` row of the copy,
  keeping its `name`, `ready=false`, at a path built like `game_document_file_upload`: same
  segments, source filename with `use_uuid=True`, `root='files'` — i.e.
  `files/games/<target-slug>/documents/<copy-id>/<stem>_<uuid><ext>`.
- Each gets one copy-origin `Upload` with `upload_type=file` and `is_cover=false`, hard-linked
  within the files root ([hard-links.md](hard-links.md#storage-roots)).

## File photos

- For each copied file whose source `photo` is set and `ready=true`, a new
  `GameDocumentFilePhoto` row is created, `ready=false`, at the fixed path built like
  `game_document_file_photo_upload`: segments
  `['games', <target-slug>, 'documents', <copy-id>, 'files', <file-copy-id>]`, name
  `photo<ext>` (extension kept from the source path), `use_uuid=False`, `root='photos'` — i.e.
  `photos/games/<target-slug>/documents/<copy-id>/files/<file-copy-id>/photo<ext>`.
- The copied file's `photo` FK is set to that new row **at copy time**, inside the copy
  transaction, exactly as the regular upload sets `file.photo` immediately with `ready=false`.
  Why: the file photo has no other link to its file, so without the FK it would be an orphan,
  unreachable by the pending-links query, by the staff photo types and by the cleanup that runs
  when the document or game is deleted. No new `Upload` field is needed for this.
- It gets one copy-origin `Upload` with `upload_type=image` and `is_cover=false`. Its finalize
  only sets `ready=true`; until then the copied file shows no photo, as during a regular upload.

## Names

Name clashes in the target game are allowed (`GameDocument` and `GameDocumentFile` have no
unique name constraint): the copy never answers `422` for names
([copy-flow.md](copy-flow.md#names)).

## Large documents

There is **no hard limit** on the number of pages, photos or files of a copied document. The
copy is still one transaction that only writes rows, no file I/O
([copy-flow.md](copy-flow.md#edge-cases)). The `links` list of the `201` response, and the
per-file progress on the page ([page.md](page.md#execution-and-progress)), grow with the number
of photos + files + file photos copied.

## API

Global shapes in [copy-flow.md](copy-flow.md#api).

- `GET staff/copies/documents.json?from=<slug>&to=<slug>` — paginated, ordered by `id`. Lists
  **every** document of the source game, hidden ones included. Row fields:

  | Field | Value |
  |---|---|
  | `id` | Source document id. |
  | `name` | Source document name. |
  | `hidden` | Source `hidden` flag. |
  | `photo` | Path of the cover `photo` when it is `ready`, else null. |
  | `pages_count` | Number of pages of the source. |
  | `photos_count` | Number of `ready=true` photos (what will be copied). |
  | `files_count` | Number of `ready=true` files (what will be copied). |
  | `copied_to_target` | See [copy-flow.md](copy-flow.md#copied_from). |

- `POST staff/copies/documents/<id>.json` `{target}` — global responses; `id` is the new
  document's id. `links` holds 0..N entries: one per copied photo (cover included), one per
  copied file and one per copied file photo.
- Pending-links query ([hard-links.md](hard-links.md#pending-links-query)), per record type:
  - `GameDocumentPhoto` reaches its game through `game_document__game`;
  - `GameDocumentFile` reaches its game through `game_document__game`;
  - `GameDocumentFilePhoto` reaches its game through the file pointing at it
    (`GameDocumentFile.photo`) → `game_document__game`, which is why the FK is set at copy time
    ([File photos](#file-photos)).

`copied_from` itself is never exposed, only `copied_to_target`.

## Cache

The copy `201` and every link finalize send `X-Cache-Clear` for the target game's document
family, cleared on every domain ([permissions.md](permissions.md#cache)). Built by reusing
`DOCUMENTS` (`backend/staff/photo_cache_paths.py`, same as the staff photo types; a file photo
resolves to its document's family through `GameDocumentFileCachePaths(DOCUMENTS)`):

- `/games/<target>/documents.json`
- `/games/<target>/documents/all.json`
- `/games/<target>/documents/<copy-id>.json`
- `/games/<target>/documents/<copy-id>/full.json`
- `/games/<target>/documents/<copy-id>/photos.json`
- `/games/<target>/documents/<copy-id>/photos/all.json`
- `/games/<target>/documents/<copy-id>/files.json`
- `/games/<target>/documents/<copy-id>/files/all.json`

The copy `201` also clears the copy's page lists, which `DOCUMENTS` does not include:

- `/games/<target>/documents/<copy-id>/pages.json`
- `/games/<target>/documents/<copy-id>/pages/all.json`

These two are added in the copy handler, not to `DOCUMENTS`, to leave the staff photo types
untouched. Link finalizes do not change pages, so they do not clear them. Per-page paths
(`pages/<page-id>.json`, `pages/<page-id>/all.json`) need no clearing: the copied pages are new
ids, never cached before.

## Frontend

Only the row component is tab-specific ([page.md](page.md#frontend-structure)). Columns:

1. checkbox;
2. cover thumbnail (placeholder when `photo` is null);
3. name;
4. counts: pages / photos / files;
5. hidden badge (when `hidden`);
6. "already copied" flag (when `copied_to_target`).

## Testing

Per-type cases, on top of the global strategy ([../game-content-copy.md](../game-content-copy.md)):

- **backend** — `name`/`description`/`hidden`/`copied_from` copied and `game` set to the target;
  `photo` null at copy time; pages copied with their `order` and `content`, all at `version=1`,
  no `GameDocumentPageHistory` created; only ready photos, files and file photos copied (not-ready
  cover → no cover, not-ready file skipped with its photo, ready file with not-ready photo copied
  without photo); one link per copied photo with `is_cover=true` only for the cover; one `file`
  link per copied file, keeping `name`; one link per copied file photo with the copied file's
  `photo` FK set to the new row at copy time; paths, uuid placement and roots as specified; link
  count in the `201`; name clash allowed; list row fields and counts, `photo` only when ready,
  hidden documents listed; cover finalize sets the copy's `photo`, other finalizes only set
  `ready`; pending-links query for each of the three record types; `X-Cache-Clear` paths,
  including the page lists on the copy `201`.
- **frontend** — row rendering: thumbnail, placeholder, name, counts, hidden badge, "already
  copied" flag.
