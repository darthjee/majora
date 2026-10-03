# Create the implementation sub-issues

Create two GitHub issues as sub-issues of #1477, matching the sibling pairs
(#1506/#1507, #1513/#1514), with `spawn_issue.sh <REPO_PATH> 1477 "<title>" <body_file>
--as-subissue` (or the same `gh` flow the sibling spec issues used), each body pointing to
the sections of `domains.md` it implements:

- **Backend:** "Implementation: Domains summary endpoint (`domains/summary.json`)":
  Metrics, API (`DomainsSummary`, view, URL, tests, access-control row in
  `docs/agents/access-control/staff-statistics.md`); needs #1498.
- **Frontend:** "Implementation: Domains tab (domain bar chart and table)": Filters,
  Chart and layout (chart, table, sorting, row click, states), `domainsSummary` quantity
  type, translations; needs #1499, #1500 and the backend issue.

Write the bodies in scratch files outside the repo; do not commit them.

## Files to Change
- None in the repo (GitHub issues only).
