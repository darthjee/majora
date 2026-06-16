# Backend Plan: Add pagination to npcs page

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend `GenericClient.fetchIndex` reads these response headers:
- `page` — current page number (integer)
- `pages` — total number of pages (integer)
- `per_page` — items per page (integer)

The frontend `HashRouteResolver.getPaginationParams()` forwards these query params from the hash URL to the API:
- `page` — requested page number
- `per_page` — requested page size

## Tasks

1. Create `source/games/settings.py` with a `Settings` class:
   ```python
   import os

   class Settings:
       @staticmethod
       def pagination_size():
           try:
               return int(os.environ.get('MAJORA_PAGINATION_SIZE', 16))
           except (ValueError, TypeError):
               return 16
   ```

2. Create `source/games/paginator.py` with a `Paginator` class:
   - Constructor: `__init__(self, request, queryset)`
   - Reads `page` and `per_page` query params from the request (fallback: `Settings.pagination_size()` for per_page, `1` for page)
   - `paginate()` method: slices the queryset ordered by `id` and returns `(page_queryset, headers_dict)`
   - Headers dict: `{'page': N, 'pages': total_pages, 'per_page': page_size, 'total': total_count}`

3. Update `source/games/views/characters.py` — `game_npcs` view:
   - Use `Paginator(request, npcs_queryset).paginate()` to get `(page_npcs, headers)`
   - Return `Response(serializer.data, headers=headers)`

4. Write tests in `source/games/tests/views_test.py` for `TestGameNpcsView`:
   - Returns headers `page`, `pages`, `per_page`, `total`
   - Respects `?page=N` param
   - Respects `?per_page=N` param
   - Default page size uses `Settings.pagination_size()`

5. Write tests in `source/games/tests/` for `Settings` and `Paginator` classes

6. Run full test suite and lint

## Files

| File | Change |
|------|--------|
| `source/games/settings.py` | New — `Settings.pagination_size()` |
| `source/games/paginator.py` | New — reusable `Paginator` class |
| `source/games/views/characters.py` | Update `game_npcs` to use `Paginator` |
| `source/games/tests/views_test.py` | Add pagination tests for `TestGameNpcsView` |
| `source/games/tests/settings_test.py` | New — tests for `Settings` |
| `source/games/tests/paginator_test.py` | New — tests for `Paginator` |
