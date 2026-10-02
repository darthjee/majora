# Hub and registration

Create the thin hub (about 30 to 40 lines) and register the spec.

The hub `docs/agents/specs/access-statistics.md` contains:

1. **Title and intro** (2 to 3 lines): a staff-only access statistics page, with a staff menu
   entry and seven tabs under `/staff/statistics`, built on `statistics.Session` (the visitor)
   and `statistics.Visit` (the activity).
2. **Source-of-truth note:** this spec supersedes #1477's body, and #1477 remains the tracking
   issue.
3. **Pages**, grouped, each with a status:
   - *Foundations*: `data-model.md` (decided), `access-and-security.md` (decided);
   - *Shared*: `shared-infrastructure.md` (stub);
   - *Tabs*: `overview.md`, `visits.md`, `visitors.md`, `duration.md`, `domains.md`,
     `users.md`, `visit-list.md` (all stub).

   Status values are `decided`, `stub` and `specced`.
4. **Sub-issue map** table (issue, role, status or owner):
   - #1478: track visits per session (prerequisite; keeps `data-model.md` in sync);
   - #1480: ghost anonymous sessions (independent bug, assumed fixed);
   - #1481: init specs (this issue);
   - #1482: shared-infrastructure spec;
   - #1483 to #1489: Overview, Visits, Visitors, Duration, Domains, Users and Visit list tab
     specs;
   - #1490: remove the specs.

   Add a line saying that #1482 to #1489 append the implementation sub-issues they create.

Registration: add `- [Access Statistics](specs/access-statistics.md)` under "Active specs" in
`docs/agents/specs.md`.

## Files to Change

- `docs/agents/specs/access-statistics.md`: new hub.
- `docs/agents/specs.md`: add the "Active specs" entry.
