# Document link builders

`CoverPhotoLinkBuilder` (`backend/staff/copy_photo_links.py`) only creates a single fixed
`photo<ext>` cover link, so add three builders next to it (in the same module, or a sibling
`copy_document_links.py` if it grows too large). Each one creates the target row with
`ready=false` plus one copy-origin `Upload` (`origin=copy`, `status=pending`, `user=request.user`,
`source_path=<source path>`, `file_path=<new path>`, `content_object=<new row>`), skips not-ready
sources (returning `None`), and builds paths server-side only:

- **Gallery photo link** (`GameDocumentPhoto`): path
  `PhotoPathBuilder(['games', <target-slug>, 'documents', <copy-id>], <stem><ext>, use_uuid=True).build(root='photos')`,
  `upload_type=image`, and an `is_cover` argument (true only for the source cover).
- **File link** (`GameDocumentFile`): same segments, `use_uuid=True`, `root='files'`, keeps the
  source `name`, `upload_type=file`, `is_cover=false`. Returns the new file row together with the
  upload, so the file photo can be attached to it.
- **File photo link** (`GameDocumentFilePhoto`): segments
  `['games', <target-slug>, 'documents', <copy-id>, 'files', <file-copy-id>]`, name `photo<ext>`
  (source extension), `use_uuid=False`, `root='photos'`, `upload_type=image`, `is_cover=false`.
  Sets the copied file's `photo` FK to the new row and saves it **at build time** (inside the
  copy transaction). Without that FK the file photo would be an orphan, unreachable by the
  pending-links query and the delete cleanup.

`<stem>` comes from the source filename with its uuid suffix removed (`_<uuid4>` right before
the extension), so a re-copy does not chain uuids; `PhotoPathBuilder` then adds a fresh uuid. Add
a small helper for this, e.g. a regex
`_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$` on the stem, leaving stems
without a uuid untouched.

Update the module docstring, which says gallery/file variants are "left to their tabs".

Tests (`backend/staff/tests/copy_photo_links_test.py`): not-ready source → `None` and no rows;
paths, roots and uuid placement per builder; source uuid stripped and not chained; stem with no
uuid kept; `upload_type`/`is_cover`/`origin`/`status`/`source_path`/`file_path` on each
`Upload`; the file keeps `name`; the file photo's FK is set on the copied file at build time.

## Files to Change
- `backend/staff/copy_photo_links.py` (or new `backend/staff/copy_document_links.py`) — the three builders and the uuid-stripping helper.
- `backend/staff/tests/copy_photo_links_test.py` (or a new `copy_document_links_test.py`) — builder tests.
