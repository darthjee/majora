# Issue: Backend: staff photo endpoints (list / replace / delete) and finalize staff branch

## Description

Part of #1468 (staff page to manage photos). Majora has 13 photo models, all subclasses of `games.models.base_photo.BasePhoto` (`path`, `ready`, history): `GamePhoto`, `GameFactionPhoto`, `GameItemPhoto`, `GameCommonItemPhoto`, `GameDocumentPhoto`, `GameDocumentFilePhoto`, `GamePossessionPhoto`, `CharacterPhoto`, `CharacterItemPhoto`, `TreasurePhoto`, `StlModelPhoto`, `SourcePhoto`, `CollectionPhoto`. Each owning entity has a `photo` FK (`SET_NULL`); each photo row links to its `uploads.Upload` through a generic relation. File bytes are written/deleted by the Tent proxy only — the backend never touches the photos volume.

This sub-issue delivers the **backend API** the staff photos page (and the proxy) build on. It owns the shared contracts used by the other sub-issues.

- `security` and `data-access` agents should review this sub-issue (new endpoints, permission logic).
- No Navi resources for these endpoints.

## Problem

There is no backend API for staff to list, replace or delete photos across all 13 photo types, and the shared upload finalize endpoint only authorizes game editors, so a staff-initiated replace can't complete. The proxy and frontend sub-issues of #1468 (#1471–#1474) need a stable backend contract to build on.

## Expected Behavior

All new endpoints live in the `staff` Django app, are gated by `require_staff` (staff **or** superuser), respond with `X-Skip-Cache: true`, and take a `photo_type` slug validated against an allow-list of the 13 types (unknown → 404), e.g. `game`, `game_faction`, `game_item`, `game_common_item`, `game_document`, `game_document_file`, `game_possession`, `character`, `character_item`, `treasure`, `stl_model`, `source`, `collection`.

### 0. Index — `GET /staff/photos.json`

- Returns `{"max_dimension": <int>, "types": ["game", "game_faction", ..., "collection"]}` — the resize limit (see setting below) and the ordered list of photo-type slugs; the frontend builds its tabs from `types`.

### 1. List — `GET /staff/photos/<photo_type>.json`

- Standard pagination via `paginated_list_response`: **plain JSON array** body, pagination in headers (same as `staff/users.json`).
- **Every** row of that photo model, including not-ready ones, **newest first** (`-id`).
- Item shape:

  ```json
  {
    "id": 42,
    "path": "photos/games/foo/factions/3/photo.png",
    "ready": true,
    "replace_in_progress": false,
    "owner": {
      "type": "game_faction",
      "id": 3,
      "name": "Red Hand",
      "kind": null,
      "game": { "slug": "foo", "name": "Foo" }
    }
  }
  ```

  - `replace_in_progress`: `true` while the photo has an active `Upload` (status `pending`/`uploading`, not expired) — lets the UI disable actions up front instead of only reacting to 409/422.
  - `owner.kind`: `"pc"` / `"npc"` for characters, `null` otherwise.
  - `owner.game`: `null` for non-game-scoped owners (miniatures, global treasures with `Treasure.game = NULL`).
  - `owner`: `null` when the photo has no owner — possible for `GameDocumentFilePhoto`, which has no FK to its owner (the owner is the `GameDocumentFile` whose `photo` points at it, a reverse lookup).

### 2. Replace init — `POST /staff/photos/<photo_type>/<photo_id>/replace.json`

- Validates the filename with the same rules as `PhotoUploadSerializer` (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`).
- **Path:** keeps the photo's current path **stem** (directory + filename without extension) and uses the new file's extension. Same extension → same path (in-place overwrite); different extension → `<stem>.<new ext>`.
- Creates an `Upload` (`origin='staff'`, see below) linked to the **existing** photo row; returns **201** `{upload_id, token, upload_type, id, photo_type}`, mirroring the `UploadInitiator` response of the existing init endpoints.
- Does **not** touch `photo.path` / `photo.ready` at init (the old image stays visible until finalize). Never creates a new photo row, never changes the owning entity's `photo` FK.
- **409 Conflict** if the photo already has an active `Upload` (status `pending`/`uploading` and not expired).

### 3. Delete — `GET /staff/photos/<photo_type>/<photo_id>/deletable.json` + `DELETE /staff/photos/<photo_type>/<photo_id>.json`

Consumed by the proxy delete orchestration, same contract as the existing character-photo flow: `deletable.json` → **200** `{"deletable": true, "path": "<file path>"}` or **422** with no body; 404 if not found. `DELETE` → **204**. Unlike the character-photo check (deletable only when *not ready*), the staff check allows deleting ready photos — it only refuses while a replace is in flight.

- `deletable.json` answers **422** while the photo has an active `Upload`.
- `DELETE` removes the `*Photo` row. For gallery entities (`Game`, `Character`, `GameDocument`, `Collection` — entities that can own several photo rows), if the deleted photo was the entity's current `photo`, fall back to another **ready** photo of its gallery (most recent), or `NULL` if none.

### 4. `Upload.origin` + finalize staff branch

- New field `Upload.origin` (`regular` default / `staff`) + migration on `games_upload` (the same migration adds a composite index on `(content_type, object_id)`, see Performance). Existing rows and existing init endpoints are unaffected.
- `upload_finalize` (`PATCH /uploads/image/<id>.json`): for `origin='staff'` uploads, authorize with `require_staff` instead of the game-edit permission check. Token / owning-user / expiry / not-already-uploaded checks still apply.
- `pending → uploading` is unchanged for staff uploads (returns `{file_path}`, the path the proxy writes to).
- On a staff upload reaching **`uploaded`**:
  1. In one transaction, lock the photo row (`select_for_update`), remember `old_path = photo.path`, set `photo.path = upload.file_path` and `ready = True`, and save.
  2. **Skip the per-type `mark_ready` handlers** (`_PHOTO_HANDLERS` in `uploads/views.py`). A staff replace never changes which photo the owning entity points to. Running the "always replace" handlers would make an orphan photo row (one the entity no longer points to, e.g. an old `TreasurePhoto`) become the entity's photo again.
  3. Respond **200** `{"previous_path": old_path}` **only** when `old_path` is non-empty and differs from the new path (extension changed); otherwise 200 with no body, as today. This way the proxy never deletes the file it just wrote. `previous_path` is sent even if the photo was never ready (the old file may not exist — the proxy treats a missing file as already deleted).
- Non-staff (`origin='regular'`) uploads keep today's finalize behaviour exactly (permission check, `mark_ready` handlers, response).

### 5. Setting

- `Settings.photo_max_dimension()` reading `MAJORA_PHOTO_MAX_DIMENSION` (default `1024`) — the longest-side limit the frontend resizes to.

### 6. Documentation

- New `docs/agents/access-control/staff-photo.md` (following `staff-cache.md` / `staff-crawler.md`) documenting the new endpoints, their gating and `X-Skip-Cache`.
- `docs/agents/access-control/endpoints.md`: index entries for the new endpoints.
- `docs/agents/access-control/upload.md`: the `Upload.origin` field and the finalize staff branch (`require_staff`, `previous_path`).

The four parts above (list, replace init, delete pair, `Upload.origin` + finalize) intentionally ship together as one issue: they share the photo-type registry and together form the backend contract the proxy and frontend sub-issues code against.

### Out of scope

- Proxy changes (atomic overwrite, old-file deletion, staff delete rule) — separate sub-issue.
- Frontend — separate sub-issues.
- Existing per-entity photo upload / delete endpoints stay unchanged.

## Solution

### Design: photo-type registry

All per-type knowledge lives in **one ordered registry in the `staff` app** (e.g. `backend/staff/photo_types.py`): a list of small `PhotoType` entries, one per photo model, each declaring:

- `slug` (the URL `photo_type`, e.g. `game_faction`) and `model` (e.g. `GameFactionPhoto`);
- an **owner resolver** — direct FK for 12 types; reverse lookup through `GameDocumentFile.photo` for `GameDocumentFilePhoto` (may yield no owner);
- how to describe the owner (`type`, `id`, `name`, `kind`, `game`);
- a **gallery** flag (`Game`, `Character`, `GameDocument`, `Collection`) and how to find gallery siblings for the delete fallback;
- the `select_related` paths the list needs.

One set of generic views and one list serializer read from it; the registry's order is the index's `types` order, and an unknown slug → 404.

#### Alternatives considered

- **Per-type views (13 types × 4 endpoints)** — rejected: ~52 near-duplicate views/routes.
- **Owner/gallery methods on the 13 `BasePhoto` models** — rejected: puts staff-only presentation concerns into domain models.
- **One registry shared with finalize's `_PHOTO_HANDLERS`** (`uploads/views.py`) — rejected for this issue: refactors the finalize path used by every existing upload flow. Instead, a **test asserts both registries cover the same set of photo models**, so a future 14th type can't be added to one and forgotten in the other.

### Permissions

- **All five endpoints** (index, list, replace init, `deletable.json`, `DELETE`) follow the existing `staff/*` view pattern: `@restricted` + `@permission_classes([AllowAny])`, then **`require_staff(request)` inline** first thing — 401 unauthenticated, 403 not staff/superuser (via `AdminOrStaffCache`). No `EndpointPermission` / `permissions.yaml` config (those are for game resources). All responses set `X-Skip-Cache: true`.
- **Check order:** `require_staff` runs **before** `photo_type` / `photo_id` are resolved, so a non-staff caller gets the same 401/403 whether or not the type or photo exists (no existence probing).
- **Finalize staff branch:** for `origin='staff'` uploads, `require_staff` **replaces** the game-edit check; the token, owning-user, expiry and not-already-uploaded checks still apply. Another staff member can't finalize someone else's upload, and a user demoted mid-upload gets 403 at finalize (subject to `AdminOrStaffCache`'s usual staleness).
- **Game roles:** DM / game admin without staff get 403 on all of these, even for their own games' photos — they keep using the per-entity endpoints.
- **Docs:** `docs/agents/access-control/staff-photo.md` modelled on `staff-cache.md` (a **Staff resource**, with a "Who can" table); `upload.md` documents the `origin` branch.

### Edge cases

- **Empty `path`** (`BasePhoto.path` defaults to `''`): there's no stem to keep, so replace init answers **422** (e.g. `{"errors": {"path": ["photo_path_missing"]}}`); staff should delete the broken row instead.
- **UUID stems** (gallery paths like `.../name_<uuid>.png`): the stem, UUID included, is kept as-is — nothing special.
- **Extension comparison:** the new file's extension is **lowercased** before building the path and comparing with the current one. `.JPG` replacing `.jpg` is the same type (in-place overwrite); `.jpeg` ↔ `.jpg` counts as a change (path updated, `previous_path` returned).
- **Active upload** (for the 409 on replace init, the 422 on `deletable.json`, and `replace_in_progress`): an `Upload` linked to the photo with status `pending`/`uploading` **and not expired**. An expired leftover never blocks a photo.
- **Token expires mid-replace:** if the proxy already wrote the file but finalize is refused (403, expired), a same-type replace has simply overwritten the file; an extension-changing one leaves an orphan file under the new extension. Rare — accepted.
- **Owner (and so the photo row) deleted while a staff replace is in flight:** finalize answers **404** with body `{"cleanup_path": "<upload.file_path>"}` so the proxy removes the file it wrote (path taken from the `Upload` row, never from the request). Only for `origin='staff'` uploads; regular uploads keep today's behaviour. *This adds a contract to the proxy sub-issue (#1472).*
- **Gallery fallback on delete:** the owner's `photo` becomes its **ready** sibling with the highest id, or `NULL` if none; a not-ready sibling is never picked. Non-gallery owners whose current photo is deleted end up with `photo = NULL` (via `SET_NULL`).
- **`photo_id` of another type:** 404 — each registry entry only looks up its own model.

### Performance & security

#### Performance (list endpoint)

- **Owner + game:** each registry entry declares its `select_related` paths (e.g. `faction__game`, `treasure__game` — nullable game).
- **`GameDocumentFilePhoto` owners:** `GameDocumentFile.photo` has `related_name='+'`, so no prefetch; instead **one batch query per page** (`GameDocumentFile.objects.filter(photo_id__in=page_ids).select_related('game_document__game')`) mapped back onto the rows, through a registry `load_owners(page)` hook.
- **`replace_in_progress`:** **one batch query per page** on `Upload` (`content_type`, `object_id__in=page_ids`, active status, not expired).
- **Index:** add a composite index on `Upload (content_type, object_id)` in the same migration as `origin` — it backs every active-upload lookup (list, replace 409, deletable 422) on an ever-growing table.
- **Query budget:** the list endpoint runs a constant number of queries per page, regardless of page size; enforced in tests with `django_assert_num_queries` for a direct-FK type and for `GameDocumentFilePhoto`.

#### Security

- `photo_type` comes only from the registry allow-list — no dynamic model lookup by name.
- Replace init accepts only `filename`, validated by `PhotoUploadSerializer`'s extension allow-list; only its **lowercased extension** is used. The target path is the photo's **stored stem** + that extension — the client's filename stem is ignored, so the request can't influence the directory or name (no traversal surface).
- `previous_path` / `cleanup_path` come from the database (`photo.path` / `upload.file_path`), never from the request.
- File content is still validated by the proxy (`UploadContentValidator`).
- `deletable.json` exposes the file path to staff only (same as the character-photo flow).

### Testing

- **Parametrized over the registry:** the generic endpoint tests (index, list, replace init, `deletable.json`, `DELETE`, finalize staff branch — happy paths and 401/403/404) run for **every** registry entry, so all 13 types are covered and a new entry is tested automatically.
- **Focused tests** for the special cases: `GameDocumentFilePhoto` reverse owner (incl. `owner: null`), gallery fallback on delete (ready sibling / none / not-ready sibling ignored), `Treasure` with `game = NULL`, PC vs NPC `kind`, 409 on replace init / 422 on `deletable.json` with an active upload (and none with an expired one), empty-`path` 422, extension change → `previous_path` (incl. case-only change → none), owner deleted mid-replace → 404 `{cleanup_path}`, staff finalize skipping `mark_ready` handlers (orphan row stays orphan), regular-upload finalize unchanged.
- **Query budget** (`django_assert_num_queries`) for a direct-FK type and `GameDocumentFilePhoto`.
- **Registry sync test:** the staff registry and finalize's `_PHOTO_HANDLERS` cover the same photo models.

## Benefits

- One generic, registry-driven API covers all 13 photo types; adding a 14th is a single registry entry (guarded by a sync test against finalize's handlers).
- Staff can repair broken / oversized photos without touching the database or the filesystem.
- Clear, documented contracts let the proxy (#1472) and frontend (#1473, #1474) sub-issues proceed in parallel.
