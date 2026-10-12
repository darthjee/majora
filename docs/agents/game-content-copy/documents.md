# Game Content Copy: Documents

Part of [Game Content Copy](../game-content-copy.md); only the rules specific to the
**Documents** tab. Endpoint access and exposed fields:
[Staff Copy](../access-control/staff-copy.md).

`GameDocument` is the richest copyable type: besides its own fields it owns versioned pages,
many photos (one of them the cover), many files, and an optional photo per file.

## Model

- Tab slug `documents`, label "Documents", model `GameDocument`
  (`backend/games/models/game/game_document.py`): `game`, `name`, `description`, `hidden`,
  cover `photo` FK to `GameDocumentPhoto`, `copied_from`.
- `GameDocumentPage`: `game_document`, `content`, `order`, `version`.
  `GameDocumentPageHistory` points to the document only.
- `GameDocumentPhoto` (`path`, `ready`, `game_document`); `GameDocumentFile` (`path`, `name`,
  `ready`, `game_document`, `photo` FK to `GameDocumentFilePhoto`).
- `GameDocumentFilePhoto` (`path`, `ready`) has **no** FK to its file: it reaches its file only
  through `GameDocumentFile.photo`, and so its game only through that file.
- Copy type: `DocumentsCopyType` (`backend/staff/copy_types_documents.py`); associations are
  copied by `DocumentAssociationsCopier` (`backend/staff/copy_document_associations.py`) and
  linked by the builders of `backend/staff/copy_document_links.py`.

## Copied fields

| Field | Value on the copy |
|-------|-------------------|
| `name`, `description`, `hidden` | Source value. |
| `game` | The target game. |
| `copied_from` | The source document. |
| `photo` | Null at copy time, set by the cover link's finalize. |

Pages, photos, files and file photos are created in the same transaction, as below.

## Not copied

- `GameDocumentPageHistory` rows: the copy starts with no page history.
- The source document's history.
- Any photo, file or file photo with `ready=false` ([Ready filter](#ready-filter)).
- `CharacterDocument` rows pointing to the source.

## Pages

- Every current page of the source is recreated on the copy (bulk create), keeping `order` and
  `content`, at `version=1`; no `GameDocumentPageHistory` row is created.
- `content` is copied verbatim. **Known limitation**: URLs embedded in the markdown (links or
  images pointing at the source game's photos, files or pages) keep pointing at the source
  game.

## Ready filter

Only `ready=true` rows are copied:

- a not-ready cover photo: the copy has no cover (no row, no link, `photo` stays null);
- a not-ready `GameDocumentPhoto`: skipped;
- a not-ready `GameDocumentFile`: skipped together with its photo;
- a ready file whose photo is missing or not ready: the file is copied without a photo.

## Photos

- Each ready `GameDocumentPhoto` becomes a `GameDocumentPhoto` of the copy, `ready=false`, at
  `photos/games/<target-slug>/documents/<copy-id>/<stem>_<uuid><ext>`. `<stem><ext>` is the
  source file name with its `_<uuid>` suffix stripped (so re-copies never chain uuids); a fresh
  uuid is generated.
- Each gets one copy-origin `Upload` (`upload_type=image`); only the row matching the source's
  cover gets `is_cover=true`. The cover finalize sets the copy's `photo` FK; the others only
  set `ready=true`.

## Files

- Each ready `GameDocumentFile` becomes a `GameDocumentFile` of the copy, keeping its `name`,
  `ready=false`, at `files/games/<target-slug>/documents/<copy-id>/<stem>_<uuid><ext>`
  (`root='files'`).
- Each gets one copy-origin `Upload` (`upload_type=file`, `is_cover=false`), hard-linked within
  the files root.

## File photos

- For each copied file whose source `photo` is ready, a new `GameDocumentFilePhoto` is created,
  `ready=false`, at the fixed path
  `photos/games/<target-slug>/documents/<copy-id>/files/<file-copy-id>/photo<ext>` (no uuid).
- The copied file's `photo` FK is set to it **at copy time**, as the regular upload does.
  Without it the file photo would be an orphan, unreachable by the pending-links query, the
  staff photo types and the copy-upload cleanup.
- It gets one copy-origin `Upload` (`upload_type=image`, `is_cover=false`) whose finalize only
  sets `ready=true`.

## Names

Name clashes in the target game are allowed: `GameDocument` and `GameDocumentFile` have no
unique name constraint.

## Large documents

There is no limit on the number of pages, photos or files. The copy is still one transaction
that only writes rows (no file I/O). The `201` `links` list (one entry per copied photo, file
and file photo) and the page's per-file progress grow with it.

## List rows

`GET staff/copies/documents.json` lists every document of the source game (hidden ones
included), ordered by `id`: `id`, `name`, `hidden`, `photo` (cover path when ready, else null),
`pages_count`, `photos_count` and `files_count` (ready rows only, i.e. what will be copied), and
`copied_to_target`.

The pending-links query reaches `GameDocumentPhoto` and `GameDocumentFile` through
`game_document__game`, and `GameDocumentFilePhoto` through the file pointing at it.

## Cache

Paths come from `backend/staff/copy_cache_paths.py` and the document entries of
`backend/staff/copy_links.py`, cleared on every domain
([Cache](../game-content-copy.md#cache)).

The document family (`DOCUMENTS`, the same as the staff photo types):

- `/games/<target>/documents.json`
- `/games/<target>/documents/all.json`
- `/games/<target>/documents/<copy-id>.json`
- `/games/<target>/documents/<copy-id>/full.json`
- `/games/<target>/documents/<copy-id>/photos.json`
- `/games/<target>/documents/<copy-id>/photos/all.json`
- `/games/<target>/documents/<copy-id>/files.json`
- `/games/<target>/documents/<copy-id>/files/all.json`

Per response:

| Response | Clears |
|----------|--------|
| Copy `201` | The family, the copy's page lists (`/documents/<copy-id>/pages.json`, `/pages/all.json`) and every character's `documents/available.json` |
| Cover photo finalize | The family and every character's `documents/available.json` |
| Other photo, file or file photo finalize | The family only (a file photo reaches it through its file) |

The characters' available lists are `/games/<target>/<pcs|npcs>/<character-id>/documents/available.json`
for every character of the target game (a game without characters adds none). Non-cover
finalizes do not change those rows, so they skip them. Per-page paths need no clearing (the
copied pages are new ids), and the `documents/available/all.json` variants always send
`X-Skip-Cache`.

## Frontend

`StaffCopyDocumentRow` renders the cover thumbnail, the name, the counts
(`staff_copies_page.document_counts`: pages, photos, files) and the hidden badge.
