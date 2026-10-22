# Declare scopes on the miniatures views

Add `from games.decorators import token_scopes` and a `@token_scopes(...)` line above `@api_view` in each view. Each served method must be declared, or the coverage test fails:

| View file | Declaration |
|-----------|-------------|
| `sources_list.py` | `@token_scopes(GET=['miniatures:read'], POST=['miniatures:write'])` |
| `source_detail.py` | `@token_scopes(GET=['miniatures:read'])` |
| `source_photo_upload.py` | `@token_scopes(POST=['miniatures:write'])` |
| `stl_models_list.py` | `@token_scopes(GET=['miniatures:read'], POST=['miniatures:write'])` |
| `stl_model_import.py` | `@token_scopes(POST=['miniatures:write'])` |
| `stl_model_detail.py` | `@token_scopes(GET=['miniatures:read'], PATCH=['miniatures:write'])` |
| `stl_model_photo_upload.py` | `@token_scopes(POST=['miniatures:write'])` |
| `collections_list.py` | `@token_scopes(GET=['miniatures:read'], POST=['miniatures:write'])` |
| `collection_detail.py` | `@token_scopes(GET=['miniatures:read'])` |
| `collection_import.py` | `@token_scopes(POST=['miniatures:write'])` |
| `collection_photo_upload.py` | `@token_scopes(POST=['miniatures:write'])` |

Read the decorator's signature in `backend/games/decorators.py` before applying it, and check that `miniatures:read` / `miniatures:write` are in the scope catalogue. Leave the permission classes and `require_staff` calls as they are.

Then remove the 11 `miniatures-*` names from `PENDING_TOKEN_SCOPES`. See the backend plan's Notes for the case where the set ends up empty.

## Files to Change
- `backend/miniatures/views/sources_list.py`, `source_detail.py`, `source_photo_upload.py` — add the declarations
- `backend/miniatures/views/stl_models_list.py`, `stl_model_import.py`, `stl_model_detail.py`, `stl_model_photo_upload.py` — add the declarations
- `backend/miniatures/views/collections_list.py`, `collection_detail.py`, `collection_import.py`, `collection_photo_upload.py` — add the declarations
- `backend/accounts/tests/token_scopes_coverage_test.py` — remove the 11 miniatures names from `PENDING_TOKEN_SCOPES`
