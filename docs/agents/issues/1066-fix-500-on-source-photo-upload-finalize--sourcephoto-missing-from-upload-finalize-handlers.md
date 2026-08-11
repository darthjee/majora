# Issue: Fix 500 on source photo upload finalize (SourcePhoto missing from upload_finalize handlers)

## Description
Photo upload endpoints route through a shared finalize step (`PATCH /uploads/image/:id.json`), reached via `POST <resource_path>/photo_upload.json` -> `POST /uploads/image/:image_id/submit` -> Tent calling back into the finalize endpoint to check permission and persist the file. That finalize step (`backend/games/views/upload_finalize.py`) was designed with `game`-owned entities in mind: it dispatches its permission check by content-object type through a `_PHOTO_HANDLERS` registry, falling back to a `game`-assuming default handler for anything not explicitly registered.

## Problem
Uploading a photo for an entity outside of `game` — e.g. a `Source` — crashed the finalize step with a 500:

- `POST /miniatures/sources/:id/photo_upload.json` -> 201 (init succeeds)
- `PATCH /uploads/image/:id.json` -> 500

<details>
<summary>Expand error</summary>

```
Internal Server Error: /uploads/image/173.json
Traceback (most recent call last):
  File "/home/app/.cache/pypoetry/virtualenvs/majora-PIKhWux7-py3.12/lib/python3.12/site-packages/django/core/handlers/exception.py", line 55, in inner
    response = get_response(request)
  File "/home/app/app/games/views/upload_finalize.py", line 239, in _game_photo_permission
    return check_game_edit(request, content_object.game)
AttributeError: 'SourcePhoto' object has no attribute 'game'
[11/Aug/2026 15:05:49] "PATCH /uploads/image/173.json HTTP/1.1" 500 112555
```
</details>

Root cause: `SourcePhoto` was never registered in `_PHOTO_HANDLERS`, so it fell through to the default handler (`_game_photo_permission`), which assumes `content_object.game` — `SourcePhoto` has no such attribute.

## Expected Behavior
Finalizing a photo upload for a `Source` (or any other non-`game` entity registered in `_PHOTO_HANDLERS`) should succeed, applying that entity's own authorization rule instead of assuming a `game` relationship.

## Solution
Implemented: registered `SourcePhoto` in `_PHOTO_HANDLERS` (`backend/games/views/upload_finalize.py`) with:
- **Permission**: `require_staff`, matching the staff-only gate already used by the `source_photo_upload` init endpoint (`Source` has no owning-game/ownership concept).
- **mark_ready**: always replace `source.photo` with the finalized `SourcePhoto`, mirroring the existing `TreasurePhoto`/`StlModelPhoto` "always replace" handlers (`Source` has at most one photo).

This is a standalone, narrowly-scoped fix — no broader refactor needed to resolve the 500.

**Implementation note**: already implemented, tested, and committed on branch `issue-1066-aux` (commit `4b1ecef8`), pushed to origin — kept off the `issue-1066` branch on purpose so it doesn't collide with the branch name `create_branch.sh` uses for this issue's normal pipeline run. When planning this issue, the plan should cherry-pick `4b1ecef8` from `issue-1066-aux` onto the `issue-1066` branch rather than re-implementing the fix.

**Follow-up split into its own issue**: the original ask here also proposed extracting photo upload into its own module and inventing a YAML-driven per-entity permission scheme. Exploration found a generic, YAML-config-driven permission engine already exists (`backend/permissions/`, `EndpointPermission`, `config/<resource>/endpoints.yml`), used by `game`, `treasure`, `game_item`, etc. — no new permission scheme is needed. The actual remaining problem is structural (`Upload`, `UploadInitiator`, `PhotoPathBuilder`, `upload_finalize` all living in `games` despite `miniatures` depending on them), and is tracked separately in #1067 — out of scope here.

## Benefits
- Unblocks source photo uploads (no more 500).
- Keeps this fix narrowly scoped and trivial to verify/cherry-pick.
- Frees the broader module-extraction work to be planned and estimated on its own in #1067, rather than blocking this bugfix.
