# Migrate `Domain.title` into `DomainConfiguration`, then drop it

`Domain.title` is currently unused anywhere in the codebase (no view/serializer/admin reference beyond the bare `admin.site.register(Domain)` in `backend/domains/admin.py`), and now duplicates `DomainConfiguration.title` since configuration is scoped to `DomainGroup`. Retire it in two migrations:

1. **Data migration**: for every `DomainGroup`, create (or get, if step 01's schema migration didn't already need one) a `DomainConfiguration` row. Set its `title` to the first non-empty `Domain.title` found among that group's `domains` (deterministic ordering — e.g. `.order_by('id')`), or leave `title` as `None` if none of the group's domains have a title set. Every `DomainGroup` should end up with exactly one `DomainConfiguration` row after this migration, even if all its fields end up `None`.
2. **Schema migration**: remove the `title` field from `Domain`.

Use Django's standard `RunPython` pattern for the data migration, sourcing `DomainGroup`/`Domain`/`DomainConfiguration` via `apps.get_model(...)` (the historical migration state), not the live app models.

## Files to Change

- `backend/domains/migrations/000X_migrate_domain_title.py` — data migration (`RunPython`)
- `backend/domains/migrations/000Y_remove_domain_title.py` — schema migration (`RemoveField`)
