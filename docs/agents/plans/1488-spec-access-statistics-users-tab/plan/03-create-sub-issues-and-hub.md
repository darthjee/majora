# Create the implementation sub-issues and update the hub

1. Create two GitHub issues under #1477 as native sub-issues, matching the Domains pair
   (#1516 / #1517):
   - **Backend:** "Implementation: Users ranking endpoint (`users.json`)": Metrics,
     ordering (`sort`), Filters, API (`UsersRanking`, view, tests, access-control row);
     needs #1498.
   - **Frontend:** "Implementation: Users tab (ranking table)": Filters, Chart and
     layout (sortable headers, pagination, row click, profile link, states), quantity type,
     translations; needs #1499 and the backend issue (#1500 is not needed: no chart).
   Each body links to `docs/agents/specs/access-statistics/users.md` and lists the
   sections it implements.
2. Fill in the "Implementation sub-issues" table in `users.md` with the new numbers.
3. In `docs/agents/specs/access-statistics.md`: set the Users page status to
   `specced (#1488)` and append both issues to the sub-issue map (role + "Created by #1488;
   needs …"), before the #1490 row like the previous tabs.

## Files to Change

- `docs/agents/specs/access-statistics/users.md` — implementation sub-issues table
- `docs/agents/specs/access-statistics.md` — Users status and sub-issue map rows
