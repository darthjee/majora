# Game Content Copy — Hard Links

Part of the [Game Content Copy](../game-content-copy.md) spec. Describes how the photos/files of
a copied entity are shared with the copy: the `Upload` extension, the proxy link handler, the
link API and its failure handling. The DB copy phase that creates the pending links is in
[copy-flow.md](copy-flow.md).

## Storage roots

- Uploads live under two separate proxy mounts: `/var/www/html/photos` and
  `/var/www/html/files`. A photo is linked within the photos root, a file within the files root
  — never across roots.
- The copy's new `path` (`Upload.file_path`) is built by `PhotoPathBuilder` under the **target**
  game, with a new uuid-suffixed name, exactly like a regular upload of that record type.
- Files are shared with PHP `link()` (a hard link), **never** `symlink()` and never a byte copy.

## `Upload` extension

Current model (`backend/uploads/models.py`): `user`, `token` (checked against `X-Upload-Token`),
`status` (`pending`/`uploading`/`uploaded`, immutable once `uploaded`), `upload_type`
(`image`/`file`), `file_path`, `expiration_time`, generic `content_object`, `origin`
(`regular`/`staff`; staff finalizes dispatch to `StaffUploadFinalizer`).

Changes:

- **Link kind**: new `ORIGIN_COPY = 'copy'`. Finalize dispatches copy uploads to a new
  `CopyLinkFinalizer`, like it does for `StaffUploadFinalizer`.
- **New fields**:
  - `source_path` — the source row's path; null for non-copy uploads.
  - `is_cover` — boolean, default false; the source row was its owner's cover.
  - `error` — nullable, fixed choices: `source_missing`, `path_rejected`, `cross_device`,
    `target_exists`, `permission`, `unknown`. Translated in the UI.
- **Statuses**: new `STATUS_FAILED = 'failed'`, accepted by `PATCH uploads/<type>/<id>.json`
  only for copy uploads (together with `error`); regular/staff uploads keep accepting only
  `uploading`/`uploaded`.
- **Staff check**: on top of the existing `X-Upload-Token` / `user` match, `PATCH` on a copy
  upload also requires the caller to be staff/superuser (see
  [permissions.md](permissions.md#link-step)).
- **`GenericRelation`**: the copyable photo/file models declare a `GenericRelation` to `Upload`,
  so deleting a copied row (or its game) deletes its `Upload`s (see
  [copy-flow.md](copy-flow.md#edge-cases)).

### Start

For a copy upload, `PATCH uploads/<type>/<id>.json` with `status=uploading` returns
`{file_path, source_path}` (regular uploads keep returning only `file_path`). This response goes
to the proxy only; it is never relayed to the client.

### Finalize

`status=uploaded` on a copy upload runs `CopyLinkFinalizer`: it sets `ready=true` on the copied
row and, when `is_cover`, sets its owner's cover `photo` FK to it. The regular "first photo
becomes cover" (`_set_game_photo_if_unset`-style) logic does not apply to copies.

### Failure

`status=failed` + `{error}` records the failure. The upload stays retryable, keeping its error
reason for the pending-links list.

### Renew (retry)

`POST staff/copies/links/<upload_id>/renew.json` on a copy upload that is not `uploaded` (pending,
failed or expired): issues a new `token` and `expiration_time`, resets `status` to `pending`,
clears `error`, and reassigns `user` to the retrying staff member, so any staff member can resume
another's copy. Returns `{upload_id, upload_type, token}` — no paths.

### Pending-links query

`UploadQuerySet.active()` ignores failed and expired uploads, so the pending-links list uses its
own query: copy origin, status not `uploaded`, content object belonging to the target game.

## Proxy link handler

`POST /uploads/link/<image|file>/<id>/submit`, with the upload token in `X-Upload-Token`:

1. `StaffAccessGuard` rejects non-staff early.
2. `PATCH uploads/<type>/<id>.json` `status=uploading` on the backend; the response carries
   `{file_path, source_path}`. Any backend rejection (`403`/`404`) is relayed as-is.
3. Validate both ends with `PathTraversalGuard` / `SecurePhotoStorage`: both inside the same
   root (photos root for `image`, files root for `file`), inside the base path, and the source
   exists.
4. Create the target directory.
5. `link(source, target)`.
6. `PATCH uploads/<type>/<id>.json` `status=uploaded` → finalize; or, on any failure in steps 3–5,
   `status=failed` + `{error}`.

Paths never reach the client: the proxy responds with the status and, on failure, the `error`
code only.

### Route collision

The existing `UploadHandler` rule matches every `POST` beginning with `/uploads/`
(`proxy/*_configuration/rules/uploads.php`). Narrow it to `/uploads/(image|file)/` so
`/uploads/link/...` reaches the new handler regardless of rule order.

## Failures

- Any failure — missing source (`source_missing`), rejected path (`path_rejected`), `EXDEV`
  (`cross_device`), an existing different target (`target_exists`), permission error
  (`permission`), anything else (`unknown`) — is reported with `PATCH ... status=failed` +
  `{error}`. There is **no** fallback to a byte copy.
- Interrupted runs are resumable from the pending-links list; nothing is auto-deleted.
- **Idempotent retry**: if the target already exists with the same inode as the source, skip
  linking and just finalize; any other existing file → `target_exists`.
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
| Backend | `POST staff/copies/links/<upload_id>/renew.json` | Retry: re-issue a link `Upload`; returns `{upload_id, upload_type, token}`. |
| Backend | `PATCH uploads/<image\|file>/<id>.json` (existing) | Link start (`uploading` → `{file_path, source_path}`), finalize (`uploaded`), failure (`failed` + `{error}`). |
| Proxy | `POST /uploads/link/<image\|file>/<id>/submit` | New link handler (see above). |

## Backward compatibility

Additive migrations only: new `origin`/`status`/`error` choice values and nullable/defaulted
`source_path`, `is_cover`, `error`, `copied_from` fields. Regular and staff uploads behave exactly
as today.
