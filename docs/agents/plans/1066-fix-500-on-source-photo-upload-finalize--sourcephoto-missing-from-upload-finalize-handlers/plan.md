# Plan: Fix 500 on source photo upload finalize (SourcePhoto missing from upload_finalize handlers)

Issue: [1066-fix-500-on-source-photo-upload-finalize--sourcephoto-missing-from-upload-finalize-handlers.md](../../issues/1066-fix-500-on-source-photo-upload-finalize--sourcephoto-missing-from-upload-finalize-handlers.md)

## Overview
`SourcePhoto` was never registered in `_PHOTO_HANDLERS` inside `backend/games/views/upload_finalize.py`, so finalizing a source photo upload fell through to the default `game`-assuming handler and crashed with an `AttributeError` → 500. The fix has already been implemented, tested, and committed on branch `issue-1066-aux` (commit `4b1ecef8`), pushed to origin, ahead of this plan being written. This plan is therefore a cherry-pick, not a fresh implementation.

## Context
`upload_finalize.py` dispatches its permission check and "mark ready" behavior per content-object type via a `_PHOTO_HANDLERS` dict, with a `game`-assuming fallback for anything unregistered. `SourcePhoto` (the photo model for `miniatures.Source`) was missing from that registry. `Source` has no owning-game concept — its init endpoint (`source_photo_upload.py`) already gates on `require_staff`, so the finalize step should apply the same rule, and always replace `source.photo` on completion (mirroring the existing `TreasurePhoto`/`StlModelPhoto` "always replace" handlers), since a `Source` has at most one photo.

## Implementation Steps

### Step 1 — Cherry-pick the existing fix
On branch `issue-1066` (already checked out for this issue), cherry-pick commit `4b1ecef8` from `issue-1066-aux`:

```bash
git cherry-pick 4b1ecef8
```

This brings in both files below verbatim — no conflicts expected, since `issue-1066` was branched from the same `main` commit as `issue-1066-aux` and nothing else has touched `upload_finalize.py` since.

### Step 2 — Verify
Run the existing and new tests to confirm the fix behaves as expected (staff-only 200/403/401, `ready` flag set, `source.photo` always replaced):

```bash
poetry run pytest games/tests/views/upload_finalize_source_test.py games/tests/views/upload_finalize_stl_model_test.py games/tests/views/upload_finalize_test.py -q
poetry run ruff check games/views/upload_finalize.py games/tests/views/upload_finalize_source_test.py
```

Already run once during exploration (95 passed, ruff clean) — re-run after the cherry-pick to confirm nothing regressed in transit.

## Files to Change
- `backend/games/views/upload_finalize.py` — register `SourcePhoto` in `_PHOTO_HANDLERS` with `_source_photo_permission` (staff-only) and `_set_source_photo` (always-replace `mark_ready`).
- `backend/games/tests/views/upload_finalize_source_test.py` — new test file covering unauthenticated/non-staff/staff/superuser finalize requests, the `ready` flag, and the always-replace `source.photo` behavior.

## CI Checks
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`)
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes
- This is intentionally scoped to just the bug fix. The issue's original broader ask (extract photo/file upload into its own module; rethink authorization via YAML) was split out into issue #1067, since a generic YAML-driven permission engine already exists in `backend/permissions/` and the remaining work is a structural module-extraction, not an authorization redesign.
- No migration, serializer, or URL changes — `SourcePhoto` and the `/uploads/image/:id.json` endpoint already exist; this only adds a missing registry entry.
