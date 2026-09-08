# CrawlerDebugEmission model + migration

Add a new Django model scoped to this debug harness only — do not surface it in any
serializer/API other than the two endpoints in step 03. The `staff` app currently has no
`models/` package, so this creates one.

Fields: `id` (auto PK), `created_at` (`DateTimeField(auto_now_add=True)`), `source`
(`CharField`, required, e.g. `"lootstudios"`), `type` (`CharField`, required, e.g.
`"stl_model"`/`"collection"`), `payload` (`JSONField`, arbitrary crawler-emitted JSON).
Add a `class Meta: ordering = ['id']` (or an explicit `created_at`/`id` index) so the
cursor helper in step 02 can rely on ascending `id` order without an extra `order_by`
per call.

Generate the migration via `docker-compose run --rm majora_backend python manage.py
makemigrations staff` — do not hand-write it.

## Files to Change

- `backend/staff/models/__init__.py` — new, re-exports `CrawlerDebugEmission`
- `backend/staff/models/crawler_debug_emission.py` — new, the model itself
- `backend/staff/migrations/0001_crawler_debug_emission.py` (or next available number) —
  generated migration
