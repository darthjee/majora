# Docs: spec and access-control page

- Update `docs/agents/specs/access-statistics/data-model.md` "`Visit` is the activity" to the
  final design (drop the "as proposed / decided in #1478's plan" wording): exact `hits`
  counting **uncached backend requests, not page views**; `Session.last_seen_at` throttled
  (~60s, configurable) instead of throttled Visit writes; login is a visit boundary (visit not
  moved, the next request opens a visit on the rotated session); no backfill — visit data
  starts at deploy; indexes. Also fix the "`Session` is the visitor" paragraph, which says
  `last_seen_at` is bumped on every request. Update
  `shared-infrastructure.md`'s "write cost … handled in #1478" line if it no longer matches.
- Create `docs/agents/access-control/statistics.md` covering `statistics.Session` and
  `statistics.Visit`: no API endpoints, writes only from `StatisticsSessionMiddleware`,
  readable only through the Django admin (read-only), nothing exposed to players or DMs.
  Link it from `docs/agents/access-control.md` under "Models / resources".

## Files to Change

- `docs/agents/specs/access-statistics/data-model.md` — final Visit design
- `docs/agents/specs/access-statistics/shared-infrastructure.md` — write-cost line, if needed
- `docs/agents/access-control/statistics.md` — new
- `docs/agents/access-control.md` — link the new page
