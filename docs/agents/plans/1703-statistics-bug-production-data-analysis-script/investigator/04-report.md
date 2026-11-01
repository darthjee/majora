# Report

Write the analysis as JSON and text in `reports/`, which is git-ignored, as
`analyse-<UTC stamp>.json` / `.txt`. The writer is the same as `emulate.py`'s.

## Contents

**Run:**

- `tool`, `issue: 1703`, `started_at` / `finished_at`, and the range (`from`, `to`, `tz`,
  `domain`);
- target kind (`local` / `production`). Never the production URL itself.

**Counts:**

- totals: sessions, visitor groups and extras, split into high and low confidence;
- self sessions removed;
- ID-reset warnings.

**Breakdowns** (counts):

- per cause and per `creation_reason`;
- per domain;
- anonymous vs. logged in (`user_id`), and per `first_seen_logged`;
- the top 10 `first_path` values per `creation_reason`.

**Details:**

- disagreements between the heuristic and `creation_reason`;
- the pre-columns bucket;
- sample groups: up to 5 per cause, each listing its sessions with visit `first_path` /
  `last_path`.

## Privacy

- The JSON and text reports keep raw values: they are local and git-ignored.
- **Console output** prints only counts and breakdowns, never IPs, user ids, session ids or
  sample groups.
- Add a `--anonymised` text summary printed at the end, safe to paste into #1704 or a PR:
  - IPs masked to `a.b.c.x`;
  - user ids and session ids replaced by per-run aliases (`user-1`, `s-1`, …);
  - paths shown only as aggregated counts.
- The token is never in any output.

## Files to Change

- `investigations/statistics-bug/analyse.py`: report builder, text formatter, writer,
  anonymised summary.
