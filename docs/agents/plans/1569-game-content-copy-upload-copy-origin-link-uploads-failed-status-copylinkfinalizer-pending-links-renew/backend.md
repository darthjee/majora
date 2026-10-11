# Backend Plan: Game content copy: Upload copy origin (link uploads, failed status, CopyLinkFinalizer, pending links, renew)

Main plan: [plan.md](plan.md)

## Overview
This plan implements the backend half of `docs/agents/specs/game-content-copy/hard-links.md`, following the rules in `docs/agents/access-control/staff-copy.md`. The specs win over this plan when they disagree.

Copy-origin `Upload`s are created by the per-type copy endpoints (tab issues #1572–#1577), so nothing here creates them except tests. This plan wires everything that is model plumbing for **all seven** copyable photo/file models (`GameItemPhoto`, `GameCommonItemPhoto`, `GameFactionPhoto`, `GamePossessionPhoto`, `GameDocumentPhoto`, `GameDocumentFile`, `GameDocumentFilePhoto`):
- cleanup on delete;
- the pending-links game reach;
- the cover FK.

Only the finalize `X-Cache-Clear` paths are a per-type hook that the tab issues fill in.

## Context
- `backend/uploads/views.py` already has a staff-origin branch (`StaffUploadFinalizer`) in both `_check_permission` and `upload_finalize`. The copy branch mirrors it.
- `backend/staff/photo_types.py` (`PHOTO_TYPES`, `find_for_model`) already knows, for each of the seven models, the owner (`owner_of`), the owner's game (`game_path`), an owner description (`describe_owner`) and the owner's cache paths. Reuse it instead of duplicating per-model knowledge.
- `backend/staff/copy_types.py` reserves the `links` slug, and `backend/staff/urls.py` keeps reserved paths before the generic `<str:copy_type>` routes.
- Staff views use `@restricted` (`X-Skip-Cache`) with `AllowAny` and an inline `require_staff` (see `staff/views/staff_copies_games.py`). `resolve_list_games` and `GameSlugResolver` live in `staff/views/_staff_copy_shared.py`.
- `Upload.save()` refuses any change once the status is `uploaded`.

## Steps

- [01 — Upload model: copy origin, new fields, failed status](backend/01-upload-model.md)
- [02 — Copy-link registry (game reach, cover, cache-path hook)](backend/02-copy-link-registry.md)
- [03 — PATCH copy branch and CopyLinkFinalizer](backend/03-patch-copy-branch-and-finalizer.md)
- [04 — pre_delete cleanup of copy uploads](backend/04-pre-delete-cleanup.md)
- [05 — GET staff/copies/links.json](backend/05-pending-links-endpoint.md)
- [06 — POST staff/copies/links/<upload_id>/renew.json](backend/06-renew-endpoint.md)
- [07 — Update access-control/upload.md](backend/07-upload-access-control-doc.md)

## CI Checks
- `backend`: `docker-compose run --rm majora_tests pytest uploads staff` plus the full suite (CI jobs: `pytest_all`, `pytest_views_rest`, `pytest_views_characters`). Use the `make`/`docker-compose` targets from AGENTS.md; never run on the host.
- `backend`: `poetry run ruff check .` (CI job: `checks`).
- docs: markdownlint (CI job: `markdownlint`).

## Notes
- Regular and staff uploads must behave exactly as today. Keep the existing `views_finalize_test.py` and `views_finalize_staff_test.py` green without editing their expectations.
- There is deliberately no `GenericRelation` (it would break `StaffUploadFinalizer`'s `404 {cleanup_path}`).
- When a copied row is deleted, its copy upload is deleted too. A later link `PATCH` then gets `403` (upload not found, uniform group), and a renew gets `404`. The page treats the renew `404` as "drop the row". The proxy relays whatever the backend returns. This is consistent with the no-leak ordering; do not add a special case.
- No Navi resource changes: every new endpoint is `X-Skip-Cache`. `cache` reviews to confirm.
- Reviews: `data-access` (new endpoints, new exposed fields), `security` (token reissue, staff gate, no-leak ordering).
