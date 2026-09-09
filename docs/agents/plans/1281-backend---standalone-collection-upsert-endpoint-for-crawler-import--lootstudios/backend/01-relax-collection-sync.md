# Relax CollectionSync

`CollectionSync` (`backend/miniatures/serializers/_crawler_import_sync.py:22-68`) currently can't create a `Collection` with `name=None` (`Collection.name` is `CharField(unique=True)`, not nullable — `_create()` would raise `IntegrityError`), and never updates `name`/`url` on a matched existing `Collection`. Both are needed for the new `collections/import.json` endpoint: creating a stub from `external_id` alone, and filling in a stub's real `name`/`url` on a later matching call.

Change `CollectionSync`:

- Constructor gains two new optional params: `url=None` and `update_existing=False` (both default to today's behavior — the existing `stl_models/import.json` call site in `backend/miniatures/serializers/stl_model_import.py`'s `_resolve_collection` passes neither, so its behavior is unchanged).
- `_create()`: fall back to `self.external_id` as a placeholder `name` when `self.name` is falsy (`name=self.name or self.external_id`), and also set `url=self.url` (currently `_create()` doesn't set `url` at all).
- `resolve()`: record `self.created = collection is None` right after `_find()` (before branching into `_create()`/`_reassign_source()`), so callers can read `sync.created` after `resolve()` returns — mirrors the `self.created` pattern `StlModelImportSerializer` already uses for its own upsert.
- On a match (`_find()` returned a row), when `update_existing` is `True`, also update `name`/`url` from whichever of `self.name`/`self.url` were given (skip a field that's falsy/`None`) — add a new `_update_details(collection)` method alongside the existing `_reassign_source(collection)`, called from `resolve()` only when `update_existing`. Only save fields that actually changed, matching `_reassign_source`'s `if ... != ...: ...; save(update_fields=[...])` shape.
- Update the class docstring to describe the placeholder-name fallback and the opt-in update-on-match behavior.

## Files to Change

- `backend/miniatures/serializers/_crawler_import_sync.py` — `CollectionSync.__init__`, `_create()`, `resolve()`, new `_update_details()`, docstring.
