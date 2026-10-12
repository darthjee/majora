# Document cache paths and copy-link hooks

In `backend/staff/copy_cache_paths.py`:

- add `_AVAILABLE_DOCUMENTS = GameCharactersAvailableCachePaths('documents')`;
- add `documents_family_cache_paths(document)` → `DOCUMENTS.paths(document)` (reuse `DOCUMENTS`
  from `staff/photo_cache_paths.py`, or `photo_types.find('game_document').cache_paths(...)` if
  that resolves to the same family — check, and keep whichever the other tabs' style matches);
- add `documents_copy_cache_paths(document)` for the copy `201`: the family, plus
  `/games/<target>/documents/<id>/pages.json` and `/pages/all.json` (added here, **not** to
  `DOCUMENTS`, so the staff photo types are untouched), plus `_AVAILABLE_DOCUMENTS.paths(document.game)`;
- add `documents_cover_cache_paths(document)` for the cover finalize: the family plus
  `_AVAILABLE_DOCUMENTS.paths(document.game)` (no page lists).

In `backend/staff/copy_links.py`, pass `cache_paths=` to the three document entries of `COPY_LINKS`:

- `CoverCopyLink(GameDocumentPhoto, 'game_document', ...)`: the cover paths when
  `upload.is_cover`, else the family only;
- `DocumentFileCopyLink(...)`: the family of `row.game_document`;
- `DocumentFilePhotoCopyLink(...)`: the family of the document of the file pointing at the photo
  (`GameDocumentFile.objects.select_related('game_document__game').filter(photo=row).first()`,
  matching how `GameDocumentFileCachePaths(DOCUMENTS)` resolves); return `[]` if no file points
  at it anymore.

Update the module docstring's hook list if it still says the document hooks are pending.

Tests:
- `backend/staff/tests/copy_links_test.py`: each document entry's `cache_paths`, with the cover
  vs non-cover photo cases, for a target game with characters (one PC, one NPC) and with none.
- `backend/uploads/tests/views_finalize_copy_test.py`: finalizing a cover document photo sets
  the copy's `photo` FK and clears the family plus every PC/NPC `documents/available.json`; a
  non-cover photo, a file and a file photo only set `ready=true` and clear just the family.
- `backend/staff/tests/staff_copy_links_test.py` (pending-links query): rows of all three record
  types are listed for the target game (the file photo reached through the file's `photo` FK).

## Files to Change
- `backend/staff/copy_cache_paths.py` — documents family/copy/cover path builders.
- `backend/staff/copy_links.py` — cache-path hooks on the three document entries.
- `backend/staff/tests/copy_links_test.py` — hook tests.
- `backend/uploads/tests/views_finalize_copy_test.py` — finalize tests for the three record types.
- `backend/staff/tests/staff_copy_links_test.py` — pending-links reach for the three record types.
