# Index: aspect page, sub-issue table without status

Update `docs/agents/specs/statistics-bug.md`:

- **Intro:** mention the tracking columns among what these pages contract.
- **Aspect pages:** add `[Tracking columns](statistics-bug/tracking-columns.md): the session and
  visit tracking columns (#1712–#1714), creation reasons and path values.` after the export
  endpoint entry.
- **Sub-issues table:**
  - replace "This table is the only place that tracks status. Aspect pages link back here."
    with "Status lives on GitHub: see Epic #1696's sub-issues. This table maps each sub-issue
    to the spec pages it follows.";
  - drop the `Status` column (it went stale: the PRs of #1698–#1700 did not update it);
    columns become *Issue | Title | Page(s)*;
  - #1699: title/pages unchanged, but it no longer covers scoped device authorization;
  - add #1708 *Scoped tokens through device authorization (backend)* → Export endpoint;
  - #1701: title becomes *Bump version to release the `statistics:read` scope and the session
    tracking columns*; pages add Tracking columns;
  - #1702, #1703: add Tracking columns to their pages;
  - add #1711 *Specs for the session tracking columns* → Tracking columns and the pages it
    updates; #1712 *Store creation path, reason and logged state (backend)* → Tracking
    columns; #1713 *Session tracking columns in the staff statistics API (backend)* → Tracking
    columns, Export endpoint; #1714 *Session tracking columns on the staff visits page
    (frontend)* → Tracking columns;
  - keep rows ordered by issue number;
  - rule becomes "When a sub-issue is added or dropped, update this table."
- **Lifecycle:** the removal step's "move durable knowledge into permanent docs" already holds;
  add that the tracking columns need no migration (their permanent docs are written by
  #1712–#1714).

## Files to Change

- `docs/agents/specs/statistics-bug.md` — aspect pages, sub-issue table, lifecycle note.
