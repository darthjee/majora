# Plan: Add documents show page and create page

Issue: [758-add-documents-show-page-and-create-page.md](../issues/758-add-documents-show-page-and-create-page.md)

## Overview

Add a create flow and a show flow for `GameDocument`, closing the read-only gap left by issue #725. This closely mirrors the `GameItem` game-level creation feature just merged (issue #784, PR #822) for the create side — a bare `POST /games/:game_slug/documents.json` with no owning `CharacterDocument`, restricted to dm/admin/staff — and the existing `GameItem` detail-endpoint pattern (`game_item_detail.py`/`game_item_detail_full.py`) for the show side. No photo upload, no edit/delete, in this issue.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### New/changed backend endpoints (frontend depends on these exact shapes)

| Endpoint | Method | Who | Request | Response |
|---|---|---|---|---|
| `/games/<slug>/documents.json` | POST | `GameDocumentCreatePermission` (dm, admin/superuser, or staff — **not** plain players) | `{ name: string, description?: string, hidden?: boolean }` | `201` `GameDocumentDetailFullSerializer` (`id, name, photo_path, description, hidden`) |
| `/games/<slug>/documents/<document_id>.json` | GET | `AllowAny` | — | `200` `GameDocumentDetailSerializer` (`id, name, photo_path, description`) for a non-hidden document; `404` if hidden or unknown |
| `/games/<slug>/documents/<document_id>/full.json` | GET | `GameEditPermission` (dm/admin only, **not** staff) | — | `200` `GameDocumentDetailFullSerializer` including `hidden`; `X-Skip-Cache: true` |

Error shapes (matching every other endpoint in this app): `401 {"errors": {"detail": ["authentication required"]}}`, `403 {"errors": {"detail": ["not allowed"]}}`, `400 {"errors": {"<field>": ["<message>", ...]}}`, `404` for unknown `game_slug`/`document_id`.

### `GET /games/<slug>/permissions.json` gains a field

`GamePermissionsSerializer` gains `can_create_document: boolean`, computed the same way `can_create_item` is (real-identity via `GameDocumentCreatePermission.is_allowed`, role-simulated `?role=` via `GameDocumentCreatePermission.is_allowed_for_roles`). Frontend gates the "Create documents" button and the `/documents/new` page's own access-redirect on this field.

### Frontend → backend field names

The create form posts exactly `{ name, description, hidden }` (no `photo` — out of scope). The frontend must not send any other fields.

### Permission correction vs. the original issue text

The original issue said "for players, dm, staff and admin" for the create endpoint. This plan follows the now-established `GameItemCreatePermission` precedent instead (dm, admin/superuser, staff — **no plain players**), since a bare game-level entity has no owning-character concept to extend "player" access through. Confirmed with the issue owner during refinement.
