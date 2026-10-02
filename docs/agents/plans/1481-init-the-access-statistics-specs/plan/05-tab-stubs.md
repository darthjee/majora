# Tab stubs

Create the seven tab stubs, each following the template from #1481's Solution section, with
blank lines added after every heading per `docs/agents/documentation.md`:

| File | Tab | Route | Owner |
|------|-----|-------|-------|
| `overview.md` | Overview (landing) | `/staff/statistics` | #1483 |
| `visits.md` | Visits | `/staff/statistics/visits` | #1484 |
| `visitors.md` | Visitors | `/staff/statistics/visitors` | #1485 |
| `duration.md` | Duration | `/staff/statistics/duration` | #1486 |
| `domains.md` | Domains | `/staff/statistics/domains` | #1487 |
| `users.md` | Users | `/staff/statistics/users` | #1488 |
| `visit-list.md` | Visit list | `/staff/statistics/visit-list` | #1489 |

Each stub has these sections:

- a status line: `stub`, the owner and the route;
- **Purpose:** the tab's row from #1477's Tabs table;
- **Decided:** what #1477 says about this tab, e.g. "implemented first" for Visits,
  "implemented last" for Overview, the anonymous/logged-in split, the "unknown" domain bucket,
  and IPs visible in the Visit list;
- **Metrics, Filters, Chart and layout, API, Edge cases:** each starts with
  `_To define (#14xx):_` and the matching items from the owner's live "What to define"
  checklist (`gh issue view <owner>`);
- **Open questions:** checklist items that don't fit the sections above;
- **Implementation sub-issues:** `_Created by #14xx._`

Each stub links to `data-model.md` and `shared-infrastructure.md` instead of repeating them.
Every "To define" item must come from the owning issue. Add nothing new.

## Files to Change

- `docs/agents/specs/access-statistics/overview.md`: new stub.
- `docs/agents/specs/access-statistics/visits.md`: new stub.
- `docs/agents/specs/access-statistics/visitors.md`: new stub.
- `docs/agents/specs/access-statistics/duration.md`: new stub.
- `docs/agents/specs/access-statistics/domains.md`: new stub.
- `docs/agents/specs/access-statistics/users.md`: new stub.
- `docs/agents/specs/access-statistics/visit-list.md`: new stub.
