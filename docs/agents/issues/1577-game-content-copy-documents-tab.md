# Issue: Game content copy: Documents tab

## Description
Part of "copy content between games" (epic #1550): the **Documents** tab. `GameDocument` is the richest copyable type. Besides its own fields it owns versioned pages, many photos (one of them the cover), many files, and an optional photo per file.

Design source of truth: `docs/agents/specs/game-content-copy/documents.md`, on top of the global pages (`copy-flow.md`, `hard-links.md`, `permissions.md`, `page.md`) under `docs/agents/specs/game-content-copy/`, plus `docs/agents/access-control/staff-copy.md`. If this issue and the specs disagree, the specs win.

## Problem
Staff can already copy Items, Common items, Recipes, Possessions and Factions between games, but not Documents. Documents add three things no earlier tab needed: several photo links per entity (not just a cover), file links (`upload_type=file`, files root), and file photos that reach their game only through `GameDocumentFile.photo`.

## Expected Behavior
- **List** — `GET staff/copies/documents.json?from=&to=`, paginated and ordered by `id`. It lists every source document, hidden ones included, with the row fields `id`, `name`, `hidden`, `photo` (the cover path only when ready), `pages_count`, `photos_count` / `files_count` (ready rows only) and `copied_to_target`.
- **Copy** — `POST staff/copies/documents/<id>.json {target}` runs in one transaction and returns `201 {id, links}`:
  - copies `name`, `description` and `hidden`, sets `game` to the target and `copied_from` to the source; `photo` stays null at copy time;
  - copies the current pages with their `order` and `content`, each at `version=1`, with no `GameDocumentPageHistory`. Embedded markdown URLs are not rewritten (known limitation);
  - **ready filter**: a not-ready cover means no cover; not-ready photos are skipped; a not-ready file is skipped together with its photo; a ready file whose photo is not ready is copied without a photo;
  - each ready photo becomes a `GameDocumentPhoto` (`ready=false`) at `photos/games/<target>/documents/<copy-id>/<stem>_<uuid><ext>`, where `<stem>` has the source uuid suffix stripped. It gets one `image` copy-origin `Upload`, with `is_cover=true` only for the source cover;
  - each ready file becomes a `GameDocumentFile` (keeps `name`, `ready=false`) at `files/games/<target>/documents/<copy-id>/<stem>_<uuid><ext>`, with one `file` `Upload`;
  - each ready file photo becomes a `GameDocumentFilePhoto` (`ready=false`) at `photos/games/<target>/documents/<copy-id>/files/<file-copy-id>/photo<ext>`. The copied file's `photo` FK is set at copy time, and it gets one `image` `Upload`;
  - name clashes are allowed (never `422` for names), and there is no limit on pages, photos or files.
- **Finalize** — `CopyLinkFinalizer`: the cover link sets the copy's `photo` FK; every other link only sets `ready=true`. The pending-links query reaches all three record types; their registry entries already exist in `backend/staff/copy_links.py`.
- **Cache (`X-Cache-Clear`, every domain)**:
  - copy `201`: the target's `DOCUMENTS` family for the copy, plus `documents/<copy-id>/pages.json` and `pages/all.json` (added in the copy handler, not to `DOCUMENTS`), plus `documents/available.json` for every PC and NPC of the target game;
  - cover finalize: the family plus every character's `documents/available.json`;
  - other finalizes (non-cover photos, files, file photos): the family only (a file photo resolves through `GameDocumentFileCachePaths(DOCUMENTS)`).
- **Frontend** — a `StaffCopyDocumentRow` with these columns: checkbox, cover thumbnail (placeholder when null), name, pages/photos/files counts, hidden badge, and the "already copied" flag. Register it in `StaffCopyRows`, and add any new i18n keys in en and pt.

## Solution
- Follow the per-tab pattern of the earlier tabs (e.g. #1575, Possessions): add `copy_types_documents.py` (a `ModelCopyType` subclass, registered in `copy_types.py`), a `StaffCopyDocumentSerializer` with the count annotations, and a `documents_copy_cache_paths` in `copy_cache_paths.py` using a new `GameCharactersAvailableCachePaths('documents')`.
- New link builders next to `CoverPhotoLinkBuilder` (`copy_photo_links.py`). That builder only produces a single fixed-name cover, so Documents needs: uuid-suffixed multi-photo links that carry `is_cover`, file links (`upload_type=file`, `root='files'`), and fixed-path file-photo links.
- Plug `cache_paths` hooks into the three document entries of `COPY_LINKS`. The `GameDocumentPhoto` hook adds the `available.json` paths only when `upload.is_cover`.
- Agents: `backend` and `frontend` (+ `translator` for new keys). Reviews: `data-access` and `security`; `cache` confirms the `X-Cache-Clear` paths and that no Navi resource is needed.
- Tests: the per-type cases in the "Testing" section of `documents.md` (backend list, copy, finalize, pending-links and cache paths; frontend row rendering).

### Depends on
The Items tab (#1572, merged), which is the reference per-tab pattern.

## Benefits
Staff can copy Documents (with their pages, photos, files and file photos) between games, completing the content types covered by epic #1550.
