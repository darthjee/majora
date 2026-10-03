# Sync the shared-infrastructure page

Keep `shared-infrastructure.md` consistent with the Users decisions, as #1487 did for Domains:

- In the validation table or right after it, note that tabs may add their own params, and
  point to the Users tab's `sort` / `invalid_sort` rule.
- In URL query state, note that `sort` (Users tab only) is, like `page` / `per_page`, not
  part of `FILTER_KEYS` and not carried across tabs.
- Confirm the "Paginated endpoints (Visit list, Users ranking)" paragraph still matches
  (plain array, headers, no envelope), adjusting only if the Users page needs it.

Only touch the lines that need it. Do not restructure the page.

## Files to Change

- `docs/agents/specs/access-statistics/shared-infrastructure.md` — tab-specific `sort`
  param notes
