# Create and record the implementation sub-issues

Create two GitHub issues as sub-issues of #1477 (same shape as #1519 / #1520), each
referencing `docs/agents/specs/access-statistics/visit-list.md`:

- **Implementation: Visit list endpoint (`visit-list.json`)** — backend: view, URL, sort
  validation (shared `invalid_sort`), query / serialization, pagination, tests,
  access-control row; needs #1498.
- **Implementation: Visit list tab (paginated visit table)** — frontend: page, controller,
  table element, sort helper, pagination, user / profile links, states, `visitList`
  quantity type, translations; needs #1499 and the endpoint issue.

Then:

- fill the spec page's "Implementation sub-issues" table with the two numbers and the
  sections each implements;
- append both rows to the hub's sub-issue map (`Created by #1489; needs ...`).

## Files to Change
- `docs/agents/specs/access-statistics/visit-list.md` — implementation sub-issues table.
- `docs/agents/specs/access-statistics.md` — two new rows in the sub-issue map.
