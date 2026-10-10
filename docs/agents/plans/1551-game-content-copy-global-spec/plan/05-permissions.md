# Write `permissions.md` and `access-control/staff-copy.md`

Record the access rules, from the issue's `permissions.md` section.

- `permissions.md`: the staff-photos pattern (`@restricted` + `AllowAny` + `require_staff`;
  `staffCopy` config with `permission: null`, no resolver entry, `ensureStaffOrSuperUser()`, and
  the exception note to add in `RequestPermissionResolvers.js` at implementation time); proxy +
  backend gate on the link step; any game across domains; the cross-domain cache invalidation
  open question; security notes.
- `docs/agents/access-control/staff-copy.md` (marked **planned**, linking to the spec): one row
  per new endpoint (backend and proxy) with role scope, `X-Skip-Cache`, and the copy-origin
  `Upload` rules; mirror the shape of `access-control/staff-photo.md`.
- Link it from `docs/agents/access-control.md` next to "Staff Photos".

## Files to Change

- `docs/agents/specs/game-content-copy/permissions.md` — new.
- `docs/agents/access-control/staff-copy.md` — new.
- `docs/agents/access-control.md` — add the link.
