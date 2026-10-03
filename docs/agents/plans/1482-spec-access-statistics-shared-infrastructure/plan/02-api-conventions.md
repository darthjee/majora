# API conventions, granularity and range cap

Define the contract shared by every `staff/statistics/...json` endpoint:

- **Pattern:** `@restricted`, `@api_view(['GET'])`, `AllowAny` + inline `require_staff`, as in
  `backend/staff/views/staff_cache_summary.py`; URLs registered next to the other `staff/` routes.
- **Query params:** `from` / `to` (ISO dates, inclusive, interpreted as local days in `tz`),
  `tz` (IANA, required or defaulted), `granularity` (`auto|day|week|month`), `user` (id),
  `domain` (id or `unknown`), `audience` (`all|anonymous|logged_in`), with defaults.
- **Validation:** 400 with a field-keyed error body (match the project's existing 400 shape)
  for bad dates, `from > to`, unknown `tz` (not in `zoneinfo.available_timezones()`), bad
  enum values, a range over the cap. Decide whether an unknown `user` / `domain` id is 400
  or an empty result.
- **Granularity:** confirm the auto thresholds (≤31 days → day, ≤ ~6 months → ISO week,
  beyond → month) with exact day counts, and how an explicit override that yields too many
  buckets is handled.
- **Range cap:** choose the value and justify it (Visit volume, bucket counts at month
  granularity, the 12-month preset).
- **Response envelope:** e.g. a `filters` echo (resolved `from`, `to`, `tz`, `granularity`)
  plus the tab's payload (`buckets`, `totals`, …), with bucket keys/labels defined.

## Files to Change
- `docs/agents/specs/access-statistics/shared-infrastructure.md` — Granularity and API conventions sections.
