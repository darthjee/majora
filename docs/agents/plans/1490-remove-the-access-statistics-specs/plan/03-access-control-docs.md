# Update the access-control docs

- `docs/agents/access-control/statistics.md`: replace the link to
  `../specs/access-statistics/data-model.md` with `../statistics.md#data-model` (or the
  matching anchor).
- `docs/agents/access-control/staff-statistics.md`:
  - remove the "Status: planned" block;
  - repoint the shared-conventions link to `../statistics.md#api-conventions` (or the
    matching anchor);
  - make sure the table has a row for every shipped endpoint (domains, overview, visits,
    visitors, duration, domains summary, users, visit list), matching the routes in
    `backend/`.
- Fold in anything lasting from `specs/access-statistics/access-and-security.md`
  (input validation, data visibility, frontend route guard) that is not there yet.

## Files to Change

- `docs/agents/access-control/statistics.md` — repoint the spec link.
- `docs/agents/access-control/staff-statistics.md` — remove the status note, repoint the
  link, complete the endpoint table.
