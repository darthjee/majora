# Documentation

- New `docs/agents/access-control/staff-photo.md`, modelled on `staff-cache.md`: Staff resource, "Who can" table (staff-or-superuser for all five endpoints), endpoint behaviours and status codes (201/204/404/409/422), `X-Skip-Cache: true`, the registry slugs, note that DM/game admin without staff get 403.
- `docs/agents/access-control/endpoints.md`: index rows for the five endpoints.
- `docs/agents/access-control/upload.md`: `Upload.origin`, the finalize staff branch (`require_staff`, skipped `mark_ready` handlers, `previous_path`, `404 {cleanup_path}`).
- Any index linking access-control docs (e.g. `docs/agents/access-control.md`) — add `staff-photo.md`.
- Env var `MAJORA_PHOTO_MAX_DIMENSION` wherever `MAJORA_*` settings are documented.
- Must pass `yarn lint_md`.

## Files to Change
- `docs/agents/access-control/staff-photo.md` — new.
- `docs/agents/access-control/endpoints.md`, `docs/agents/access-control/upload.md`, `docs/agents/access-control.md` — updates.
