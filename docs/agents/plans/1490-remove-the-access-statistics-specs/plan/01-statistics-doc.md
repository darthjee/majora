# Write the statistics feature doc

Create `docs/agents/statistics.md`, a permanent feature doc in the style of `crawler.md` and
`cache-warmer.md`, for the staff access statistics page (`/staff/statistics`). Check every
fact against the shipped code. Suggested sections:

1. **Overview**: purpose, the staff menu entry, the seven tabs (Overview, Visits, Visitors,
   Duration, Domains, Users, Visit list) and their routes.
2. **Data model**, from `specs/access-statistics/data-model.md`:
   - `Session` is the visitor (device/browser) identity;
   - `Visit` is the activity: `started_at`, `last_seen_at`, `hits`, and the 30-minute
     inactivity window;
   - the visitor key: `user_id` when the session has a user, otherwise the session id;
   - counting rules and caveats.

   Drop "Assumption on #1480": #1480 is fixed.
3. **Metrics**: one short subsection per tab with its metric definitions, ordering rules
   (Users, Visit list) and edge-case behaviour, from each tab page's "Metrics", "Ordering"
   and "Edge cases" sections.
4. **Filters and URL state**: the shared filter bar (date range, user, domain, audience,
   granularity), the URL query keys, and the granularity and range cap rules.
5. **API conventions**: `staff/statistics/*.json` endpoints, query params, validation,
   response envelope, the Python aggregator (bucketing in Python with `zoneinfo` and the
   browser time zone, zero-filled buckets, no rollups) and the `RequestStore`. Include a
   table of every endpoint and the tab it serves.
6. **Client IP caveat**: stored IPs are best effort, because `X-Forwarded-For` is trusted
   as-is until #1501 is fixed. Remove this note when #1501 lands.
7. **Related docs**: links to `access-control/statistics.md`,
   `access-control/staff-statistics.md` and `frontend/charts.md`.

Register the doc in `docs/agents/index.md` (under "Conventions", next to "Crawler Agent",
or in a new "Features" section) and add a summary entry in `docs/agents/summary.md`.

## Files to Change

- `docs/agents/statistics.md` — new permanent feature doc.
- `docs/agents/index.md` — link the new doc.
- `docs/agents/summary.md` — add its abstract.
