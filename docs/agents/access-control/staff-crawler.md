# Staff Crawler (crawler debug harness)

**[Staff resource](principles.md#resource-categories).** A temporary, staff-only debug harness
for browsing raw crawler emissions ahead of #1262's real import endpoint — see the
[Crawler Test Harness spec](../specs/crawler-test-harness.md) for the full wire contract
(cursor pagination, retention cap, request/response shapes). Both `POST` and `GET` enforce
**Staff-or-superuser** inline (via `require_staff`), matching every other `staff/*` endpoint.
Both responses set `X-Skip-Cache: true` per the
[`X-Skip-Cache` rule](principles.md#x-skip-cache-rule).

| Action | Who can |
|--------|---------|
| Record a new crawler emission (`POST /staff/crawler.json`) | **Staff-or-superuser** |
| List recorded emissions, cursor-paginated (`GET /staff/crawler.json`) | **Staff-or-superuser** |

**Behavior**: backed by the `CrawlerDebugEmission` model, a temporary debug-harness table —
it is not part of the miniatures catalog and is not exposed by any other serializer/API. The
model, migration, and these endpoints are all deleted once #1262's real import endpoint is
trusted end-to-end (see the spec's "Removal plan").
