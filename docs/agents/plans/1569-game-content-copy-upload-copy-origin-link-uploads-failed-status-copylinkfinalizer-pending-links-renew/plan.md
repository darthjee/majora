# Plan: Game content copy: Upload copy origin (link uploads, failed status, CopyLinkFinalizer, pending links, renew)

Issue: [1569-game-content-copy-upload-copy-origin-link-uploads-failed-status-copylinkfinalizer-pending-links-renew.md](../../issues/1569-game-content-copy-upload-copy-origin-link-uploads-failed-status-copylinkfinalizer-pending-links-renew.md)

## Overview
Backend-only work. It adds the `copy` origin to `Upload` (`source_path`, `is_cover`, `error`, `failed` status), a copy branch on `PATCH uploads/<type>/<id>.json` with `CopyLinkFinalizer`, `pre_delete` cleanup of copy uploads, `GET staff/copies/links.json` and `POST staff/copies/links/<upload_id>/renew.json`, and the `access-control/upload.md` update.

See [backend.md](backend.md) for the full plan.
