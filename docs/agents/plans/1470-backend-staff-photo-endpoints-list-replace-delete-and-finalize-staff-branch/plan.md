# Plan: Backend: staff photo endpoints (list / replace / delete) and finalize staff branch

Issue: [1470-backend-staff-photo-endpoints-list-replace-delete-and-finalize-staff-branch.md](../../issues/1470-backend-staff-photo-endpoints-list-replace-delete-and-finalize-staff-branch.md)

## Overview

Add five staff-only endpoints in the `staff` app (index, per-type list, replace init, deletable check, delete), driven by a single ordered photo-type registry covering the 13 `BasePhoto` models; add `Upload.origin` (+ a `(content_type, object_id)` index) and a staff branch in `upload_finalize`; add the `MAJORA_PHOTO_MAX_DIMENSION` setting; document everything under `docs/agents/access-control/`.

See [backend.md](backend.md) for the full plan.
