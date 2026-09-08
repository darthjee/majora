# Add external_id fields and migration

Add a nullable, unique `external_id` field to both `StlModel` and `Collection`, mirroring the
existing nullable-unique pattern already used for `url` on both models (`null=True, blank=True,
default=None` — required so an omitted value stores as a real `NULL`, not `''`, which would
otherwise collide under `unique=True` on the second external-id-less row).

`Source` gets no `external_id` field — it stays matched/created by `name` only, per the issue
(one `Source` row per crawled site as a whole, not a per-item concept).

Both models use `simple_history`'s `HistoricalRecords`; `makemigrations` will also emit the
matching field addition on each model's historical table automatically — no manual handling
needed, just don't hand-edit the generated migration to drop that part.

## Files to Change

- `backend/miniatures/models/stl_model.py` — add `external_id = models.CharField(max_length=200,
  unique=True, null=True, blank=True, default=None)`.
- `backend/miniatures/models/collection.py` — same field addition.
- `backend/miniatures/migrations/` — new migration file(s) generated via `manage.py
  makemigrations miniatures`.
- `backend/miniatures/tests/models/` — extend/add model-level tests asserting the new field
  accepts `None`, accepts a string, and enforces uniqueness (two rows with the same non-null
  `external_id` should fail; two rows with `None` should both succeed).
