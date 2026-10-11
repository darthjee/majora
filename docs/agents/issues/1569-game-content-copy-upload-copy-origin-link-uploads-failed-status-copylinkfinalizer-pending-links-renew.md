# Issue: Game content copy: Upload copy origin (link uploads, failed status, CopyLinkFinalizer, pending links, renew)

## Description
Part of "copy content between games" (epic #1550). Copied photos and files are shared with the copy through filesystem hard links. The proxy creates these links (#1570), driven by `Upload` records with a new **copy** origin. This issue adds the backend side: the `Upload` extension, the link start/finalize/fail contract on the existing upload `PATCH`, `CopyLinkFinalizer`, cleanup on delete, and the two `staff/copies/links*` endpoints.

Design source of truth: `docs/agents/specs/game-content-copy/hard-links.md` (backend parts), `docs/agents/specs/game-content-copy/permissions.md`, and `docs/agents/access-control/staff-copy.md`. If this issue and the specs disagree, the specs win.

Builds on the backend foundation (#1568, merged): `copied_from`, the `staff/copies*` skeleton, the `staff/copy_types.py` registry (ships empty; `links` is a reserved slug) and the staff gate. The per-type tab issues (#1572–#1577) create copy-origin uploads and plug their per-type pieces into the hooks defined here.

## Expected Behavior
### `Upload` model (`backend/uploads/models.py`)
- `ORIGIN_COPY = 'copy'` and an `is_copy_origin` property next to `is_staff_origin`.
- New fields: `source_path` (nullable), `is_cover` (boolean, default false), `error` (nullable; choices `source_missing`, `path_rejected`, `cross_device`, `target_exists`, `permission`, `unknown`).
- New `STATUS_FAILED = 'failed'`.
- Additive migrations only.

### `PATCH uploads/<image|file>/<id>.json` (existing endpoint)
- **Permission**: for copy uploads, `require_staff` **replaces** the per-type permission check, as it does for staff-origin uploads. The token, `user`, expiry and not-uploaded checks still apply. The staff check is part of the uniform-`403` group that runs before the `upload_type` `404`, preserving the no-leak ordering in `access-control/upload.md`.
- **Start**: `status=uploading` on a copy upload returns `{file_path, source_path}`. Regular uploads still return only `file_path`.
- **Failure**: `status=failed` with a valid `error` is accepted only for copy uploads, and only from `pending` or `uploading`. It returns `400` when sent for a non-copy upload, without an `error`, or with an `error` outside the choices. A `failed` upload accepts no further `PATCH` until it is renewed.
- **Finalize**: `status=uploaded` on a copy upload dispatches to `CopyLinkFinalizer`, the same way staff uploads dispatch to `StaffUploadFinalizer`. The finalizer:
  - sets `ready=true` on the copied row;
  - when `is_cover` is set, sets the owner's cover `photo` FK to that row;
  - skips the per-type `mark_ready` handlers (`_PHOTO_HANDLERS`);
  - returns `X-Cache-Clear` with the target game's stale paths. The paths come from a per-type hook that the tab issues fill in.
- Regular and staff uploads behave exactly as today.

### Cleanup
- A `pre_delete` hook filtered on `origin='copy'` deletes the copy-origin `Upload`s of a copied photo/file row when that row (or its game) is deleted. This issue registers it for all seven copyable photo/file models: `GameItemPhoto`, `GameCommonItemPhoto`, `GameFactionPhoto`, `GamePossessionPhoto`, `GameDocumentPhoto`, `GameDocumentFile` and `GameDocumentFilePhoto`. Cleanup therefore does not depend on the order the tabs are merged in.
- There is deliberately **no** `GenericRelation`: it would cascade to regular/staff uploads and break `StaffUploadFinalizer`'s orphan-file cleanup.

### `GET staff/copies/links.json?to=<slug>` (staff-or-superuser, `X-Skip-Cache`)
- Lists the pending and failed links of the target game. It uses its own query instead of `UploadQuerySet.active()`: copy origin, status not `uploaded` (expired ones included), content object still existing and belonging to the target game.
- This issue wires how each copyable photo/file model reaches its game, for all seven of them. For example, `GameDocumentFilePhoto` reaches it through `GameDocumentFile.photo` → document → game.
- Each link exposes the copied entity, `upload_id`, `upload_type`, `status` and `error`. No paths and no token.

### `POST staff/copies/links/<upload_id>/renew.json` (staff-or-superuser, `X-Skip-Cache`)
- `<upload_id>` is resolved only after `require_staff`.
- A non-copy upload returns `404`. An `uploaded` upload, or an `uploading` one that has not expired, returns `409`.
- Otherwise, a single save issues a new `token` and `expiration_time`, resets `status` to `pending`, clears `error`, and reassigns `user` to the renewing staff member. The old token stops working.
- Returns `{upload_id, upload_type, token}` and no paths.

### Docs
- Update `docs/agents/access-control/upload.md`: the Fields section, the Read row, and a new "Copy-origin uploads" section, as `staff-copy.md` requires.

## Solution
- Agent: `backend`. Reviews: `data-access`, `security`, `cache` (no Navi resource expected; all new endpoints are `X-Skip-Cache`).
- Copy-origin uploads are created only by the per-type copy endpoints, so they are out of scope here. This issue wires the model plumbing for all seven photo/file models (`pre_delete` cleanup and the pending-links game reach). The tab issues only fill in the finalizer's per-type hooks (cover owner and `X-Cache-Clear` paths), and tests here exercise those hooks with a test registration.
- Tests follow the spec's testing strategy: the link flow (start returns both paths), `failed` + `error` (allowed and refused transitions, `400` cases), the finalizer (ready, cover FK, skipped handlers, `X-Cache-Clear`), cleanup on row and game delete (regular/staff uploads untouched), renew (`404`/`409`/success, token rotation, user reassignment), the pending-links list (failed and expired included, uploaded and orphaned excluded, no paths or token), the staff gate and no-leak ordering, and `X-Skip-Cache`.

### Depends on
#1568 (merged).

### Related
#1570 (proxy link handler) consumes this contract. #1571 (copy page) consumes `links.json` and renew. #1572–#1577 (tabs) plug into the per-type hooks.

## Benefits
Defines the backend contract that the proxy link handler and the copy page rely on, without changing regular or staff uploads.
