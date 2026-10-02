# Plan: Proxy: atomic photo overwrite, old-extension cleanup and staff photo delete rule

Issue: [1472-proxy-atomic-photo-overwrite-old-extension-cleanup-and-staff-photo-delete-rule.md](../../issues/1472-proxy-atomic-photo-overwrite-old-extension-cleanup-and-staff-photo-delete-rule.md)

## Overview
Proxy-only changes so it handles the staff photo contract from #1470. Uploads are written atomically (temp file + rename). The finalize call honors `previous_path` (200) and `cleanup_path` (404) by deleting those files through `SecurePhotoStorage`. A new `DELETE /staff/photos/<type>/<id>.json` rule reuses a generalized `DeleteHandler` so the file is removed too.

See [proxy.md](proxy.md) for the full plan.
