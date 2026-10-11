# Update access-control/upload.md

`docs/agents/access-control/staff-copy.md` requires the implementation issue to update `docs/agents/access-control/upload.md`. Make these changes:

- **Fields**: add `source_path`, `is_cover`, `error`, the `copy` origin and the `failed` status. Note the copy-origin exceptions to "token is only returned by init" and "status/file_path are never returned":
  - renew returns a fresh `token`;
  - `links.json` exposes `status` and `error`;
  - `PATCH ... status=uploading` returns `source_path` next to `file_path`.
- **Read row** of the endpoint summary: reflect the above.
- New section **"Copy-origin uploads"**, alongside "Staff-origin uploads":
  - `require_staff` replaces the per-type check inside the uniform-`403` group;
  - the transitions (`pending` → `uploading` → `uploaded`, and `pending`/`uploading` → `failed`, with no `PATCH` after `failed` until renew);
  - the `400` cases;
  - `CopyLinkFinalizer` (ready, cover FK, handlers skipped, `X-Cache-Clear`);
  - the `pre_delete` cleanup and why there is no `GenericRelation`;
  - a link to `staff-copy.md` for renew and `links.json`.

Keep the wording consistent with `staff-copy.md`, and run markdownlint.

## Files to Change
- `docs/agents/access-control/upload.md` — Fields, Read row, and the new "Copy-origin uploads" section.
