# Index page and hub registration

Create `docs/agents/specs/common-items-filters.md`, modelled on `docs/agents/specs/statistics-bug.md`:

- Title and a short intro: Epic #1766 adds `category`, `min_price` and `max_price` (alongside the existing `name`) to both common items indexes, plus a filter bar on the common items page. These pages are the shared contract for the Epic's sub-issues.
- **Aspect pages:** one bullet per page (`api-contract.md`, `backend.md`, `frontend.md`, `testing.md`) with a one-line summary.
- **Sub-issues:** the table from the issue's *Expected Behavior* (#1769 to #1772 and their pages), with the note that status lives on GitHub under Epic #1766.
- **Non-goals:** ordering by price, multi-select category, detail-page filters, other resources' filter bars, a `?hidden=` filter.
- **Lifecycle:** during the Epic, a sub-issue that has to deviate updates the relevant page in the same PR. On removal (#1772), move the durable rules and rationale into `docs/agents/access-control/game-common-item.md` (and the helper location into the views docs if relevant), unregister from `docs/agents/specs.md`, and delete the index and the folder. Permanent docs must not link into the folder.

Then add `- [Common Items Filters](specs/common-items-filters.md)` under *Active specs* in `docs/agents/specs.md`.

## Files to Change

- `docs/agents/specs/common-items-filters.md`: new index page.
- `docs/agents/specs.md`: register the new spec.
