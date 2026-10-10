# Game Content Copy — Hard Links

Part of the [Game Content Copy](../game-content-copy.md) spec. Describes how the photos/files of
a copied entity are shared with the copy: the `Upload` extension, the proxy link handler, the
link API and its failure handling. The DB copy phase that creates the pending links is in
[copy-flow.md](copy-flow.md).

## Storage roots

- The proxy's `photos_path` and `files_path` are both the shared base path (`/var/www/html`, in
  dev and prod). The `photos/` and `files/` prefixes come from the backend path itself
  (`PhotoPathBuilder.build(root=...)`); only those subfolders are separate mounts.
- **Same root** therefore means: for `image`, both `source_path` and `file_path` start with
  `photos/`; for `file`, both start with `files/`. Both ends are validated against
  `<base>/photos` or `<base>/files` (base path plus type prefix), not against the bare base —
  never across roots.
- The copy's new `path` (`Upload.file_path`) is built with the same `PhotoPathBuilder` segments,
  filename, `use_uuid` and `root` as that record type's regular upload, under the **target** game
  and the copy's id. Most types (items, common items, possessions, factions, document-file photos)
  use a fixed `photo<ext>` name without uuid; game documents and document files add a uuid; document
  files use `root='files'`.
- `source_path` and `file_path` are always generated server-side; they are never accepted from a
  request body (copy `POST` or `PATCH`).
- Files are shared with PHP `link()` (a hard link), **never** `symlink()` and never a byte copy.

## `Upload` extension

Current model (`backend/uploads/models.py`): `user`, `token` (checked against `X-Upload-Token`),
`status` (`pending`/`uploading`/`uploaded`, immutable once `uploaded`), `upload_type`
(`image`/`file`), `file_path`, `expiration_time`, generic `content_object`, `origin`
(`regular`/`staff`; staff finalizes dispatch to `StaffUploadFinalizer`).

Changes:

- **Link kind**: new `ORIGIN_COPY = 'copy'` and an `is_copy_origin` property next to
  `is_staff_origin`. `_check_permission` and `upload_finalize` get a copy branch that dispatches
  to a new `CopyLinkFinalizer`, like they do for `StaffUploadFinalizer`.
- **New fields**:
  - `source_path` — the source row's path; null for non-copy uploads.
  - `is_cover` — boolean, default false; the source row was its owner's cover `photo`. Only
    meaningful for the owner `photo` FK of `GameDocument`, `GameItem`, `GameCommonItem`,
    `GameFaction` and `GamePossession` (recipes have no photo).
  - `error` — nullable, validated against fixed choices: `source_missing`, `path_rejected`,
    `cross_device`, `target_exists`, `permission`, `unknown`. Translated in the UI.
- **Statuses**: new `STATUS_FAILED = 'failed'`. `_VALID_STATUSES` accepts it on
  `PATCH uploads/<type>/<id>.json` only for copy uploads (together with a valid `error`; `400`
  otherwise), and only from `pending` or `uploading` — never from `uploaded`. A `failed` upload
  accepts no further `PATCH` until renewed. Regular/staff uploads keep accepting only
  `uploading`/`uploaded`.
- **Permission**: for a copy upload, `require_staff` **replaces** the per-type permission check
  (GameEdit and so on — staff are often not editors of the target game), exactly as for
  staff-origin uploads. Token, `user`, expiry and not-uploaded checks still apply, and the staff
  check belongs to the uniform-`403` group that runs before the `upload_type` `404` (the
  [no-leak ordering](../../access-control/upload.md#route-shape-and-the-no-leak-ordering-guarantee)).
- **Cleanup of copy uploads**: deleting a copied photo/file row (or its game) deletes its
  copy-origin `Upload`s explicitly (a `pre_delete` hook filtered on `origin='copy'`). A
  `GenericRelation` is deliberately **not** used: it would cascade to regular/staff uploads too and
  break `StaffUploadFinalizer`'s `404 {cleanup_path}` orphan-file cleanup. The pending-links query
  also skips uploads whose content object is gone.

### Start

For a copy upload, `PATCH uploads/<type>/<id>.json` with `status=uploading` returns
`{file_path, source_path}` (regular uploads keep returning only `file_path`). The endpoint is
proxy-facing but, like every `.json` route, reachable from the browser: a staff member holding the
token could call it directly, read the paths, or mark the row `uploaded` without linking. Accepted,
because the caller is staff — the same exposure as the existing `file_path` response.

### Finalize

`status=uploaded` on a copy upload runs `CopyLinkFinalizer`: it sets `ready=true` on the copied
row and, when `is_cover`, sets its owner's cover `photo` FK to it. The per-type `mark_ready`
handlers (`_PHOTO_HANDLERS`, e.g. `_set_item_photo`, `_set_game_photo_if_unset`) are skipped, as
`StaffUploadFinalizer` does. Its response carries `X-Cache-Clear` for the target game's stale
paths (see [permissions.md](permissions.md#cache)).

### Failure

`status=failed` + `{error}` records the failure. The upload stays retryable, keeping its error
reason for the pending-links list.

### Renew (retry)

`POST staff/copies/links/<upload_id>/renew.json`, resolved only after `require_staff`:

- `<upload_id>` must be a copy-origin upload, else `404` — staff can never take over a regular or
  staff upload's token.
- `409` when it is `uploaded`, or `uploading` and not expired (a link in flight).
- Otherwise (pending, failed, or expired): in one save, issues a new `token` (the old one stops
  working) and `expiration_time`, resets `status` to `pending`, clears `error`, and reassigns
  `user` to the retrying staff member, so any staff member can resume another's copy. Returns
  `{upload_id, upload_type, token}` — no paths.

### Pending-links query

`UploadQuerySet.active()` ignores failed and expired uploads, so the pending-links list uses its
own query: copy origin, status not `uploaded`, content object belonging to the target game. It is
built per content type: `GameDocumentFilePhoto`, for instance, reaches its game only through
`GameDocumentFile.photo`.

## Proxy link handler

A new handler (e.g. `LinkHandler` in `proxy/extension/lib/handlers/`) for
`POST /uploads/link/<image|file>/<id>/submit` (no `.json`, like the existing
`/uploads/<type>/<id>/submit`), with the upload token in `X-Upload-Token`:

1. `StaffAccessGuard::requireStaffAccess` rejects non-staff early.
2. `PATCH uploads/<type>/<id>.json` `status=uploading` on the backend; the response carries
   `{file_path, source_path}`. Any backend rejection (`403`/`404`) is relayed as-is.
   `UploadStatusClient` gets a method returning both paths (today `requestUploadingStatus()`
   returns only `file_path`) and a `requestFailedStatus($id, $error, $headers)`.
3. Validate the **source**: correct type prefix, `is_file($source) && !is_link($source)`, then
   `PathTraversalGuard::assertRealPathWithinBase` against `<base>/photos` or `<base>/files`.
   (`link()` on a symlink would link the symlink itself.)
4. Validate the **target** and create its directory with `SecurePhotoStorage::ensureDirectoryFor()`
   (validation + mkdir), against the same type root.
5. `link(source, target)`.
6. `PATCH uploads/<type>/<id>.json` `status=uploaded` → finalize, then
   `ResponseCacheClearer::clearFrom` on the finalize response headers (`X-Cache-Clear`), like
   `UploadHandler` (the rule therefore needs a `cache_path`; see
   [permissions.md](permissions.md#cache) for the cross-domain mode). On any failure in steps
   3–5: `status=failed` + `{error}`.

Paths never appear in the proxy's response: it answers with the status and, on failure, the
`error` code only.

### Route collision

The existing `UploadHandler` rule (`['method'=>'POST','uri'=>'/uploads/','type'=>'begins_with']`
in `proxy/dev_configuration/rules/uploads.php` and `proxy/prod_configuration/rules/uploads.php`)
matches every `POST` beginning with `/uploads/`, including `/uploads/link/...`. Replace it, in
both files, with an anchored regex rule:

```php
['method' => 'POST', 'pattern' => '#^/uploads/(image|file)/\d+/submit$#', 'type' => 'regex']
```

and give the link rule an equally anchored `#^/uploads/link/(image|file)/\d+/submit$#`, so each
request reaches the right handler regardless of rule order.

## Failures

- Any failure — missing source (`source_missing`), rejected path or symlinked source
  (`path_rejected`), `EXDEV` (`cross_device`), an existing different target (`target_exists`),
  permission error (`permission`), anything else (`unknown`) — is reported with
  `PATCH ... status=failed` + `{error}`. There is **no** fallback to a byte copy.
- Interrupted runs are resumable from the pending-links list; nothing is auto-deleted.
- **Idempotent retry**: if the target already exists, is not a symlink (`is_link`), and has the
  same inode as the source, skip linking and just finalize; any other existing file (or a symlink)
  → `target_exists`.
- **Expiry**: link uploads keep the normal `expiration_time`; retrying a row renews its `Upload`
  first, so a pending row is never stuck.

## Independence of copies

- Deleting one copy's file (`DeleteHandler`) or replacing it (`UploadStorageResolver`'s atomic
  `rename()`) only touches its own directory entry: the other hard links keep the old content.
- `DirectorySizeCalculator` (`du`) counts a hard-linked file once per scan, so storage stats
  report real disk usage — intended.

## API

| Side | Method & path | Purpose |
|---|---|---|
| Backend | `GET staff/copies/links.json?to=<slug>` | Pending/failed links of the target game, with error reasons. |
| Backend | `POST staff/copies/links/<upload_id>/renew.json` | Retry: re-issue a copy-origin link `Upload`; returns `{upload_id, upload_type, token}`. |
| Backend | `PATCH uploads/<image\|file>/<id>.json` (existing) | Link start (`uploading` → `{file_path, source_path}`), finalize (`uploaded`), failure (`failed` + `{error}`). |
| Proxy | `POST /uploads/link/<image\|file>/<id>/submit` | New link handler (see above). |

## Backward compatibility

Additive migrations only: new `origin`/`status`/`error` choice values and nullable/defaulted
`source_path`, `is_cover`, `error` on `Upload`, and nullable `copied_from` on the copyable models.
Those models use `HistoricalRecords(app='versioning')`, so each `copied_from` FK needs a
`versioning` migration as well as the `games` one. Regular and staff uploads behave exactly as
today (no `GenericRelation` cascade, see above).
