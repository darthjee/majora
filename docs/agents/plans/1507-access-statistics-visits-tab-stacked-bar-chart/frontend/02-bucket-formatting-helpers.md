# Bucket formatting helpers

Add the pure formatting helpers shared with the later time-series tabs (Visitors, Duration) in
`pages/helpers/StatisticsBucketFormatter.js`, a class of static methods like `StatisticsQuery`:

- `label(start, granularity, locale)`: the X-axis label from a bucket's `start` (`YYYY-MM-DD`).
  `day` and `week` give day and month (`{ day: 'numeric', month: 'short' }`, e.g. "5 Jan"; a week
  is labeled by its clipped start). `month` gives month and year (`{ month: 'short', year: 'numeric' }`,
  e.g. "Jan 2026").
- `range(start, end, locale)`: the tooltip's range. A single date
  (`{ day: 'numeric', month: 'short', year: 'numeric' }`) when `start === end`, otherwise
  `"<start> – <end>"` (or `Intl.DateTimeFormat#formatRange` when available).
- `count(value, locale)`: `Intl.NumberFormat` integer formatting for the totals line and tooltip.
- `percent(share, locale)`: a whole-number percentage from a 0..1 share
  (`Intl.NumberFormat` with `style: 'percent', maximumFractionDigits: 0`).

Parse dates as `new Date(\`${value}T00:00:00Z\`)` and always pass `timeZone: 'UTC'` so the
displayed date never shifts by a day. `locale` defaults to `undefined` (the browser locale).

## Files to Change

- `frontend/assets/js/components/resources/staff_statistics/pages/helpers/StatisticsBucketFormatter.js`
  — new helper class.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/helpers/StatisticsBucketFormatterSpec.js`
  — full coverage with an explicit locale: day, week and month labels, a single-day and a
  multi-day range, a clipped first/last bucket, a year boundary (Dec–Jan), `count` with thousands
  separators and `0`, and `percent` for 0, a fraction that rounds, and 1.
