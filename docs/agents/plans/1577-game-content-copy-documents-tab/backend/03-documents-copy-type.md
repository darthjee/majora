# Documents copy type, serializer and registry

**Serializer** — `backend/staff/serializers/staff_copy_document.py`,
`StaffCopyDocumentSerializer` (modelled on `StaffCopyPossessionSerializer`): fields `id`, `name`,
`hidden`, `photo` (cover path only when ready), `pages_count`, `photos_count`, `files_count`,
`copied_to_target`. The counts read queryset annotations; export it from
`backend/staff/serializers/__init__.py`.

**Copy type** — `backend/staff/copy_types_documents.py`, `DocumentsCopyType(ModelCopyType)`:

- `copied_fields = ('name', 'description', 'hidden')`; slug `documents`, model `GameDocument`.
- `source_queryset`: `select_related('photo')` plus the three count annotations. Use
  `Count(..., distinct=True)` with `filter=Q(...ready=True)` for photos/files, or subquery
  counts, so the multiple joins don't multiply each other.
- `copy_associations(request, source, copy)`, in this order:
  1. pages: `bulk_create` a `GameDocumentPage` per source page (keeping `order` and `content`,
     `version=1`); no `GameDocumentPageHistory`;
  2. photos: one gallery link per ready `GameDocumentPhoto`, `is_cover = (photo.pk == source.photo_id)`;
     a not-ready cover creates nothing, so `copy.photo` stays null;
  3. files: one file link per ready `GameDocumentFile`; then, when the source file's `photo` is
     set and ready, one file-photo link for the copied file (which sets the copied file's `photo` FK).
     A not-ready file is skipped together with its photo.
  Return every created `Upload` (photos, files, file photos), which become the `201` `links`.
- `cache_paths(copy)`: `documents_copy_cache_paths(copy)` (step 02).
- No name-clash handling (never `422` for names).

**Registry** — import `DocumentsCopyType` in `backend/staff/copy_types.py` and insert it right
after `RecipesCopyType()` in `COPY_TYPES`.

Tests (mirror `staff_copies_possessions_test.py`):
- `backend/staff/tests/staff_copies_documents_test.py`: list row fields and counts (only-ready
  photo/file counts, `photo` only when ready, hidden documents listed, `copied_to_target`,
  pagination/order); copy of `name`/`description`/`hidden`/`copied_from`/`game`, `photo` null at
  copy time; pages copied with `order`/`content` at `version=1` and no page history; the ready
  filter cases (not-ready cover → no cover, not-ready photo skipped, not-ready file skipped
  together with its photo, ready file with not-ready photo copied without a photo); link count
  and `is_cover` only on the cover; file `name` kept; file photo FK set at copy time; name clash
  allowed; `X-Cache-Clear` on the `201` (family + page lists + one `documents/available.json` per
  target PC/NPC; family + page lists only when the target has no characters); permission cases
  as in the other tab tests.
- `backend/staff/tests/copy_types_test.py`: `documents` registered in the right order.
- `backend/staff/tests/staff_copies_index_test.py`: `types` order includes `documents` after `recipes`.

## Files to Change
- `backend/staff/serializers/staff_copy_document.py` — new list row serializer.
- `backend/staff/serializers/__init__.py` — export it.
- `backend/staff/copy_types_documents.py` — new copy type.
- `backend/staff/copy_types.py` — register `documents` after `recipes`.
- `backend/staff/tests/staff_copies_documents_test.py` — new endpoint tests.
- `backend/staff/tests/copy_types_test.py` — registry test.
- `backend/staff/tests/staff_copies_index_test.py` — types order.
