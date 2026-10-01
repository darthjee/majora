# Backend Plan: Backend: staff photo endpoints (list / replace / delete) and finalize staff branch

Main plan: [plan.md](plan.md)

## Overview

Registry-driven staff photo API (13 photo types) plus the `Upload.origin` finalize branch — the backend contract that the proxy (#1472) and frontend (#1473, #1474) sub-issues of #1468 build on.

## Context

- 13 photo models subclass `games.models.base_photo.BasePhoto` (`path`, `ready`, history). 12 have a direct FK to their owner; `GameDocumentFilePhoto` has none (owner = `GameDocumentFile` whose `photo` points at it, `related_name='+'`).
- Gallery owners (several photo rows): `Game` (`GamePhoto.game`), `Character` (`CharacterPhoto.character`), `GameDocument` (`GameDocumentPhoto.game_document`), `Collection` (`CollectionPhoto.collection`).
- Existing staff views (`backend/staff/views/*.py`) use `@restricted` (outermost) + `@api_view` + `@permission_classes([AllowAny])` + inline `require_staff(request)`; lists use `paginated_list_response` (plain array, pagination headers).
- `upload_finalize` lives in `backend/uploads/views.py` with the `_PHOTO_HANDLERS` registry (`GamePhoto` falls through to `_DEFAULT_HANDLERS`; the map also contains the non-photo `GameDocumentFile`).
- Existing character-photo `deletable.json` contract: `backend/games/views/game/photos/_photo_deletable.py` → 200 `{deletable, path}` or 422 with no body.

## Steps

- [01 — Upload.origin, index and photo max dimension setting](backend/01-upload-origin-and-setting.md)
- [02 — Photo-type registry](backend/02-photo-type-registry.md)
- [03 — Index and list endpoints](backend/03-index-and-list-endpoints.md)
- [04 — Replace init endpoint](backend/04-replace-init-endpoint.md)
- [05 — Deletable and delete endpoints](backend/05-deletable-and-delete-endpoints.md)
- [06 — Finalize staff branch](backend/06-finalize-staff-branch.md)
- [07 — Documentation](backend/07-documentation.md)

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all` — covers `staff/tests` and `uploads/tests`), `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (`pytest_views_rest`), `poetry run ruff check .` + `bin/reports.sh ci` (`checks`) — run through `docker-compose` / `make tests`, never on the host.
- `docs`: `yarn lint_md` (CI job: `markdownlint`).

## Notes

- Out of scope: proxy (#1471, #1472), frontend (#1473, #1474), Navi resources, existing per-entity upload/delete endpoints (unchanged).
- Ask `security` and `data-access` to review the diff (new endpoints, permission logic, file-path exposure).
- Stale entity JSON after extension-changing replace / delete is accepted (tracked in #1469).
