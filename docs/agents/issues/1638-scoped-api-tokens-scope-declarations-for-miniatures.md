# Issue: Scoped API tokens: scope declarations for miniatures

## Description

Sub-issue of #1603 (epic #1592). Declare `@token_scopes` on every view of the `miniatures` family: sources, STL models and collections, with their imports and photo upload inits. These routes have no `game_slug`, so scopes alone govern them; there is no per-game check.

The rules are in [`docs/agents/access-control/token-scopes.md`](../access-control/token-scopes.md) (family table, read/write/link rules). Per-resource permissions are in [Source](../access-control/source.md), [StlModel](../access-control/stl-model.md) and [Collection](../access-control/collection.md).

**Blocked by:** #1616 and the #1603 core (catalogue, decorator, auth-class check, coverage test with a pending list). Those have landed.

## Problem

These 11 views are still on `PENDING_TOKEN_SCOPES` in `backend/accounts/tests/token_scopes_coverage_test.py`, so every scoped token gets `403 token_not_allowed` on them (fail closed):

`miniatures-sources-list`, `miniatures-sources-detail`, `miniatures-sources-photo-upload`, `miniatures-list`, `miniatures-detail`, `miniatures-import`, `miniatures-photo-upload`, `miniatures-collections-list`, `miniatures-collections-detail`, `miniatures-collections-import`, `miniatures-collections-photo-upload`.

This means an automation cannot use a scoped token to read the catalogue or to import miniatures.

## Expected Behavior

None of the miniatures reads are `AllowAny`: they all require login. So each one is a restricted read that needs `miniatures:read`. Every write needs `miniatures:write`. The responses only contain `miniatures` data, so no other family scope is needed.

| Route | Method | Scopes |
|-------|--------|--------|
| `miniatures/sources.json` | `GET` / `POST` | `miniatures:read` / `miniatures:write` |
| `miniatures/sources/<id>.json` | `GET` | `miniatures:read` |
| `miniatures/sources/<id>/photo_upload.json` | `POST` | `miniatures:write` |
| `miniatures/stl_models.json` | `GET` / `POST` | `miniatures:read` / `miniatures:write` |
| `miniatures/stl_models/import.json` | `POST` | `miniatures:write` |
| `miniatures/stl_models/<id>.json` | `GET` / `PATCH` | `miniatures:read` / `miniatures:write` |
| `miniatures/stl_models/<id>/photo_upload.json` | `POST` | `miniatures:write` |
| `miniatures/collections.json` | `GET` / `POST` | `miniatures:read` / `miniatures:write` |
| `miniatures/collections/<id>.json` | `GET` | `miniatures:read` |
| `miniatures/collections/import.json` | `POST` | `miniatures:write` |
| `miniatures/collections/<id>/photo_upload.json` | `POST` | `miniatures:write` |

The views keep their role checks. Writes stay staff/superuser only (`require_staff`), so a non-staff owner holding `miniatures:write` still gets `403`. The token never goes beyond what its owner can do.

## Solution

- Add `@token_scopes` to the 11 views in `backend/miniatures/views/`, following the table above.
- Remove their names from `PENDING_TOKEN_SCOPES`. If #1639, #1665 and #1666 have already landed and the set is empty, delete it and its pending-only tests.
- Add a miniatures token-scopes test module covering:
  - a missing scope (`403 scope_missing`) on a read and on a write;
  - a read with `miniatures:read`;
  - a staff-owner write with `miniatures:write`;
  - the owner-role intersection (a non-staff owner with `miniatures:write` still gets `403` on a create, import and photo upload init);
  - a token whose game list is not empty can still reach these routes, because they have no game.
- Update the status paragraph of `docs/agents/access-control/token-scopes.md` to list the miniatures family as declared, and add a short "Miniatures" bullet under Read/Write scopes.

There is no game-restriction test (`game_not_allowed`) and no link-route test. Neither applies to this family: the routes have no `game_slug` and no link routes. Finalize for `SourcePhoto` / `StlModelPhoto` / `CollectionPhoto` uploads stays in #1639.

## Benefits

- Automations such as an STL crawler can run on a scoped `miniatures` token instead of a full-access token.
- Session behaviour and legacy `Token` behaviour do not change. The current crawler uses a legacy `Token`, so it keeps working.
