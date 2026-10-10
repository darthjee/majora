# Agent review and lint

Before opening the PR, dispatch the agents listed in the issue's "Agent consultation" section on
the written pages, fold their findings in, and record any unresolved disagreement as an open
question in the relevant page:

- `product-owner` — `copied_from`, cross-domain staff scope.
- `data-access` — new endpoints/fields, `access-control/staff-copy.md`.
- `security` — link path validation, renew token/`user` reassignment, no server paths to the
  client, the narrowed uploads matcher.
- `proxy` — link handler, `StaffAccessGuard`, matcher change.
- `cache` — cross-domain cache invalidation, `X-Skip-Cache`, Navi config impact.
- `backend` — `Upload` extension, `CopyLinkFinalizer`, `GenericRelation`s, migrations.
- `frontend` — `staffCopy` page structure.

Then run markdownlint and fix any findings.

## Files to Change

- Any of the pages from steps 01–05, as the reviews require.
