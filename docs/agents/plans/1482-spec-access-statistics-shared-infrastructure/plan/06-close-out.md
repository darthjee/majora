# Close out: status, sub-issues, hub

- Move the resolved items from "To define" into the page's decided content, leave "Open
  questions" empty or listing only genuinely open items, and set the page status to
  `specced`.
- Create three implementation sub-issues under #1477 (native sub-issue link), each pointing
  to the page sections it implements:
  1. **Backend:** aggregator, shared params validation, API conventions, URL registration
     pattern, `staff-statistics.md` kept in sync.
  2. **Frontend shell:** staff menu entry, tab shell, routes, gates, filter bar, URL query
     state (allowlist keys), `staffStatistics` RequestStore config, translations.
  3. **Recharts setup:** add `recharts` via `docker-compose run --rm majora_fe yarn add`,
     lazy-loaded chunk, sizing / `ResizeObserver` test setup, CSS color variables.
- List them under the page's "Implementation sub-issues" and append them to the hub's
  sub-issue map; update the hub's page status for shared infrastructure to `specced`.

## Files to Change
- `docs/agents/specs/access-statistics/shared-infrastructure.md` — status, "To define", "Implementation sub-issues".
- `docs/agents/specs/access-statistics.md` — page status and sub-issue map.
