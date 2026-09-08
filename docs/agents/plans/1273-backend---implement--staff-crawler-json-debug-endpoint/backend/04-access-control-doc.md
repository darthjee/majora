# Access control doc

Add a new access-control entry documenting `staff/crawler.json`'s access rule, following
`docs/agents/access-control/staff-cache.md`'s shape exactly: a **[Staff resource]**
classification, a table of action → who-can-access (both `POST` and `GET` are
staff-or-superuser via inline `require_staff`), and a note that both responses set
`X-Skip-Cache: true` per the `X-Skip-Cache` rule (from `@restricted`).

Also note this is a temporary debug-harness table (not part of the miniatures catalog,
no other serializer/API exposes it), and link to the spec doc
(`docs/agents/specs/crawler-test-harness.md`) for the full wire contract instead of
duplicating pagination details here.

Link the new doc from `docs/agents/access-control.md`'s index, next to the existing
`Staff Cache` entry.

## Files to Change

- `docs/agents/access-control/staff-crawler.md` — new
- `docs/agents/access-control.md` — add an index entry linking to the new doc
