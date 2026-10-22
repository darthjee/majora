# Declare scopes on document views

Add `@token_scopes(...)` (above `@api_view`) to each view in `backend/games/views/games/`, covering every method the view serves:

| URL name | View | Declaration |
|---|---|---|
| `game-documents` | `game_documents` | `GET=[]`, `POST=['documents:write']` |
| `game-documents-all` | `game_documents_all` | `GET=['documents:read']` |
| `game-document-detail` | `game_document_detail` | `GET=[]`, `PATCH=['documents:write']` |
| `game-document-detail-full` | `game_document_detail_full` | `GET=['documents:read']` |
| `game-document-photos` | `game_document_photos` | `GET=[]` |
| `game-document-photos-all` | `game_document_photos_all` | `GET=['documents:read']` |
| `game-document-files` | `game_document_files` | `GET=[]` |
| `game-document-files-all` | `game_document_files_all` | `GET=['documents:read']` |
| `game-document-pages` | `game_document_pages` | `GET=[]`, `POST`/`DELETE=['documents:write']` |
| `game-document-pages-all` | `game_document_pages_all` | `GET=['documents:read']`, `POST`/`DELETE=['documents:write']` |
| `game-document-pages-bump-version` | `game_document_pages_bump_version` | `PATCH=['documents:write']` |
| `game-document-pages-bump-version-all` | `game_document_pages_bump_version_all` | `PATCH=['documents:write']` |
| `game-document-page-detail` | `game_document_page_detail` | `PATCH=['documents:write']` |
| `game-document-page-detail-all` | `game_document_page_detail_all` | `PATCH=['documents:write']` |
| `game-document-photo-upload` | `game_document_photo_upload` | `POST=['documents:write']` |
| `game-document-file-upload` | `game_document_file_upload` | `POST=['documents:write']` |
| `game-document-file-photo-upload` | `game_document_file_photo_upload` | `POST=['documents:write']` |
| `game-document-photo-set` | `game_document_photo_set` | `PATCH=['documents:write']` |

Before declaring, confirm per view that the `api_view` method list matches the table and that no response embeds another family's restricted data.

## Files to Change
- `backend/games/views/games/game_documents.py`
- `backend/games/views/games/game_documents_all.py`
- `backend/games/views/games/game_document_detail.py`
- `backend/games/views/games/game_document_detail_full.py`
- `backend/games/views/games/game_document_photos.py`
- `backend/games/views/games/game_document_photos_all.py`
- `backend/games/views/games/game_document_files.py`
- `backend/games/views/games/game_document_files_all.py`
- `backend/games/views/games/game_document_pages.py`
- `backend/games/views/games/game_document_pages_all.py`
- `backend/games/views/games/game_document_pages_bump_version.py` (both views)
- `backend/games/views/games/game_document_page_detail.py` (both views)
- `backend/games/views/games/game_document_photo_upload.py`
- `backend/games/views/games/game_document_file_upload.py`
- `backend/games/views/games/game_document_file_photo_upload.py`
- `backend/games/views/games/game_document_photo_set.py`
