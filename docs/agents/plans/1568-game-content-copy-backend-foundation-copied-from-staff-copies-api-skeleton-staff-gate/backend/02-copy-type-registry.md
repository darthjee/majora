# Add the copy-type registry
Create `backend/staff/copy_types.py`, following the `PhotoType` idiom of `backend/staff/photo_types.py` (module docstring, class, ordered tuple, `_BY_SLUG`, lookup functions):

```python
class CopyType:
    """One copyable content type: its URL slug, its model, and its list/copy behavior."""

    def __init__(self, slug, model):
        self.slug = slug
        self.model = model

    def find_source(self, source_id):
        """Return the source row with `source_id` (its `game` selected), or None."""

    def list(self, request, from_game, to_game):
        """Return the tab's paginated `Response` of `from_game`'s entities."""
        raise NotImplementedError

    def copy(self, request, source, target_game):
        """Copy `source` into `target_game` and return the `Response`."""
        raise NotImplementedError


COPY_TYPES = ()
RESERVED_SLUGS = frozenset({'games', 'links'})
```

with `find(slug)` and `slugs()` as in `photo_types.py`. `find_source` uses `self.model.objects.select_related('game').filter(pk=source_id).first()`.

The registry ships **empty**. The module docstring states that each tab issue inserts its entry at its spec position (`items`, `common_items`, `recipes`, `documents`, `factions`, `possessions`), whatever order they are merged in, and that `games`/`links` are reserved (they are fixed URLs under `staff/copies/`).

Tests in `backend/staff/tests/copy_types_test.py`:
- The real registry is empty: `slugs() == []`, and `find('items')` is None.
- No registered slug is in `RESERVED_SLUGS` (it passes trivially now and protects the tab issues later).
- `CopyType.find_source` returns the row with its game, or None for an unknown id. Use a `CopyType('items', GameItem)` built in the test.
- `list`/`copy` raise `NotImplementedError` on the base class.

Add a test helper, `backend/staff/tests/copy_test_support.py`, with:
- an actors mixin (staff, superuser, regular user, tokens, `get_json`/`post_json`), reusing or mirroring `StaffPhotoActorsMixin`;
- a fake `CopyType` subclass that records its calls and returns simple `Response`s, plus a fixture/monkeypatch helper that registers it in `COPY_TYPES`/`_BY_SLUG` for the duration of a test.

## Files to Change
- `backend/staff/copy_types.py` — new registry.
- `backend/staff/tests/copy_types_test.py` — new.
- `backend/staff/tests/copy_test_support.py` — new shared actors, fake type and registry patching.
