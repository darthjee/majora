# Plan: Game content copy spec: Documents tab

Issue: [1555-game-content-copy-spec-documents-tab.md](../../issues/1555-game-content-copy-spec-documents-tab.md)

## Overview

Write the per-tab spec page `docs/agents/specs/game-content-copy/documents.md` for the
**Documents** tab of the staff copy page (epic #1550), and link it from the index. Docs-only, no
code changes; owned by `architect` (cross-cutting spec under `docs/agents/specs/`).

## Context

The global pages (`page.md`, `copy-flow.md`, `hard-links.md`, `permissions.md`) and the sibling
tab pages (`items.md`, `common-items.md`, `recipes.md`) already exist. `documents.md` must follow
the structure of `items.md` and only add what is specific to `GameDocument`, linking to the
global pages instead of repeating them.

Facts gathered from the code:

- `GameDocument` (`backend/games/models/game/game_document.py`): `game`, `name`, `description`,
  `hidden`, cover `photo` FK → `GameDocumentPhoto` (`SET_NULL`), simple-history.
- `GameDocumentPage` (`game_document_page.py`): `game_document` FK (`related_name='pages'`),
  `content`, `order`, `version` (default 1). `GameDocumentPageHistory` has no FK to the page,
  only to the document (`related_name='page_history'`).
- `GameDocumentPhoto` (`BasePhoto`: `path`, `ready`): `game_document` FK
  (`related_name='photos'`). Regular upload path
  (`game_document_photo_upload._build_file_path`): segments
  `['games', slug, 'documents', document_id]`, original filename, `use_uuid=True`, `photos` root.
- `GameDocumentFile` (`BaseFile`: `path`, `name`, `ready`): `game_document` FK
  (`related_name='files'`), `photo` FK → `GameDocumentFilePhoto` (`SET_NULL`,
  `related_name='+'`). Regular upload path: same segments, `use_uuid=True`,
  `build(root='files')`.
- `GameDocumentFilePhoto` (`BasePhoto`): **no** FK to its file. Regular upload
  (`game_document_file_photo_upload`) uses fixed `photo<ext>` at
  `['games', slug, 'documents', document_id, 'files', file_id]`, `use_uuid=False`, and sets
  `file.photo` immediately with `ready=false`.
- Cache: `DOCUMENTS = GameResourceCachePaths('documents', collection=('.json', '/all.json'),
  member=('.json', '/full.json', '/photos.json', '/photos/all.json', '/files.json',
  '/files/all.json'))` and `GameDocumentFileCachePaths(DOCUMENTS)` in
  `backend/staff/photo_cache_paths.py`. Pages are served at
  `games/<slug>/documents/<id>/pages.json` (+ `pages/all.json`), which `DOCUMENTS` does not
  include.
- Staff photo types (`backend/staff/photo_types.py`): `game_document` reaches its game via
  `game_document__game`; `GameDocumentFilePhotoType` resolves its owner by reverse lookup on
  `GameDocumentFile.photo_id`.

Decisions recorded in the issue: file `photo` FK set at copy time; only `ready=true`
photos/files/file photos copied; page content copied verbatim (embedded URLs documented); no
hard size limit.

## Implementation Steps

### Step 1 — Write `documents.md`

Create `docs/agents/specs/game-content-copy/documents.md` mirroring `items.md`'s sections:

- **Intro**: part of the Game Content Copy spec, links to the four global pages.
- **Model**: tab slug `documents`, label "Documents", model `GameDocument` and its associated
  models with their relevant fields and FKs (as listed in Context).
- **Copied fields** table: `name`, `description`, `hidden` (source; link
  `copy-flow.md#hidden`), `game` = target, `copied_from` = source, `photo` null at copy time and
  set by the cover link's finalize (`copy-flow.md#cover-photo`).
- **Not copied**: `GameDocumentPageHistory`, the document's simple-history, any not-ready
  photo/file/file photo; link `copy-flow.md#character-links-and-history`.
- **Pages**: current `GameDocumentPage` rows only, same `order` and `content`, `version=1` on
  every copied page, no history rows. Content copied verbatim: URLs embedded in the markdown
  keep pointing at the source game (known limitation, not rewritten).
- **Photos**: every `ready=true` `GameDocumentPhoto` → new `ready=false` row under the copy at
  `photos/games/<target>/documents/<copy-id>/<name>-<uuid><ext>` (same `PhotoPathBuilder`
  segments/filename/`use_uuid` as the regular upload — check `PhotoPathBuilder` for the exact
  uuid placement and state it), one `image` copy-origin `Upload` each; the source cover (if
  ready) gets `is_cover=true`. A not-ready cover → no cover on the copy.
- **Files**: every `ready=true` `GameDocumentFile` → new `ready=false` row keeping `name`, path
  under `files/games/<target>/documents/<copy-id>/` with uuid (`root='files'`), one `file`
  copy-origin `Upload` (same-root rule: `hard-links.md#storage-roots`).
- **File photos**: for a copied file whose `photo` is `ready=true` → new `ready=false`
  `GameDocumentFilePhoto` at the fixed
  `photos/games/<target>/documents/<copy-id>/files/<file-copy-id>/photo<ext>`, and the copied
  file's `photo` FK set to it **inside the copy transaction** (as the regular upload does).
  Explain why: the row has no other link to its file, so without the FK it would be orphaned and
  unreachable by the pending-links query and the staff photo types. Its `Upload` has
  `upload_type=image`, `is_cover=false`; finalize only sets `ready=true`. A not-ready file
  photo → file copied without a photo; a not-ready file → skipped with its photo.
- **Names**: clashes allowed, never `422` (`copy-flow.md#names`).
- **Large documents**: no hard limit; still one transaction writing rows only
  (`copy-flow.md#edge-cases`); `links` and the per-file progress grow with photos + files +
  file photos.
- **API**: `GET staff/copies/documents.json?from=&to=` (paginated, by `id`, hidden included)
  with row fields `id`, `name`, `hidden`, `photo` (cover path when ready, else null), and
  counts useful to the row (e.g. `pages_count`, `photos_count`, `files_count`, counting only
  what will be copied), `copied_to_target`; `POST staff/copies/documents/<id>.json` `{target}`
  with `links` holding 0..N entries; pending-links query per record type:
  `GameDocumentPhoto` and `GameDocumentFile` via `game_document__game`,
  `GameDocumentFilePhoto` via the file pointing at it (`GameDocumentFile.photo`) →
  `game_document__game`. `copied_from` never exposed.
- **Cache**: copy `201` and every link finalize clear the target's documents family on every
  domain (`permissions.md#cache`): collection `/games/<target>/documents.json`, `/all.json`;
  member `.json`, `/full.json`, `/photos.json`, `/photos/all.json`, `/files.json`,
  `/files/all.json`, built by reusing `DOCUMENTS` (file photos via
  `GameDocumentFileCachePaths`). The copy `201` also clears `/pages.json` and
  `/pages/all.json` of the copy, which `DOCUMENTS` lacks — state whether to extend the family
  or add the two paths in the copy handler (recommend adding them in the copy handler, to
  leave the staff photo types untouched).
- **Frontend**: row columns — checkbox; cover thumbnail (placeholder when null); name; counts
  (pages / photos / files); hidden badge; "already copied" flag.
- **Testing**: per-type backend cases (fields copied; pages copied with `order`/`content`,
  `version=1`, no history; only ready photos/files/file photos copied; cover `is_cover=true`;
  file `photo` FK set at copy time to the new row; paths/uuid/roots; link counts; name clash
  allowed; list fields and counts; pending-links query for each of the three record types;
  `X-Cache-Clear` paths incl. pages) and frontend row-rendering cases.

### Step 2 — Link from the index

In `docs/agents/specs/game-content-copy.md`, under **Tab pages**, replace `- Documents — #1555`
with `- [Documents](game-content-copy/documents.md) — #1555`.

## Files to Change

- `docs/agents/specs/game-content-copy/documents.md` — new tab spec page.
- `docs/agents/specs/game-content-copy.md` — link the Documents page.

## CI Checks

- Root markdown: markdownlint via `.markdownlint-cli2.jsonc` (run through the project's
  docker-compose/make target, never on the host).

## Notes

- Keep line width and style consistent with `items.md` (≈100 columns, tables for field values).
- Do not repeat global rules; link to their anchors (verify each anchor exists in the global
  pages).
- If writing the page reveals a gap in a global page (e.g. the finalize needing to touch a
  non-cover FK), do not edit the global page silently; note it in `documents.md` and flag it in
  the PR. The decision to set the file `photo` FK at copy time is meant to avoid that.
