# Write `hard-links.md`

Describe the link phase end to end, from the issue's `hard-links.md`, `Upload` extension, API
baseline (link endpoints) and edge-case sections.

- Storage roots (`/var/www/html/photos`, `/var/www/html/files`), target paths built by
  `PhotoPathBuilder` under the target game.
- `Upload` extension: `ORIGIN_COPY`, `source_path`, `is_cover`, `error` codes, `STATUS_FAILED`
  (copy origin only), `CopyLinkFinalizer`, renew semantics (new token/expiry, `user` = retrying
  staff, status reset, error cleared), `GenericRelation` on copyable photo/file models, the
  pending-links query (not `active()`).
- Proxy flow for `POST /uploads/link/<image|file>/<id>/submit`: `StaffAccessGuard` →
  `PATCH uploading` (returns `{file_path, source_path}`) → validate both ends (same root, inside
  base, source exists) → create directory → `link()` (never `symlink()`) → `PATCH uploaded` or
  `PATCH failed` + `{error}`.
- Narrowing the `UploadHandler` matcher to `/uploads/(image|file)/`.
- Failure handling (no byte-copy fallback, `EXDEV` included), same-inode idempotent retry,
  renewal on expiry, independence of copies under delete/replace, `du` counting once.
- Backward compatibility: additive migrations; regular/staff uploads unchanged.

## Files to Change

- `docs/agents/specs/game-content-copy/hard-links.md` — new.
