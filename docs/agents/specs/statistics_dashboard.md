# Statistics Dashboard

Design notes for the staff dashboard **visits summary card** (Epic #1678).

A staff-only card on `/#/staff/dashboard` shows the number of **unique visitors** for a rolling
period ending today (`day` = today, `week` = the last 7 days, `month` = the last 30 days), picked
with a period select. Below it:

- **Reload** fetches the number again for the current period.
- **Clear** wipes every `statistics.Visit` and `statistics.Session` row and resets their IDs, so
  the next rows start at id `1` again. It sits behind a typed `CLEAR` confirmation.
- A link goes to the full statistics page, `/#/staff/statistics`.

The feature is **permanent**: it is not a debug harness, and no sub-issue removes the card or its
Clear action. This spec itself is temporary and is removed by #1686 once the feature is
implemented.

## Aspect pages

Each page maps 1:1 to its implementation issue and uses the same template: Purpose, Contract,
Behaviour, Permissions & caching, Edge cases, Tests, Open questions, Implemented by.

- [Count endpoint](statistics_dashboard/count-endpoint.md) — `GET
  staff/statistics/summary.json`, the unique-visitors count for a rolling period (#1682).
- [Clear endpoint](statistics_dashboard/clear-endpoint.md) — `DELETE staff/statistics.json`,
  the `statistics/reset.py` helper and the ID reset (#1684). Clear deletes in small,
  separately committed batches; see its [Batched clear](statistics_dashboard/clear-endpoint.md#batched-clear)
  section.
- [Tracking race](statistics_dashboard/tracking-race.md) — visit tracking and user attachment
  tolerating a session deleted mid-request (#1683).
- [Dashboard card](statistics_dashboard/dashboard-card.md) — the frontend card, its typed
  `CLEAR` confirmation and i18n (#1685).

## Open questions

These points are **not** settled by this spec. The topic pages state them as pending and link
back here; each is settled by its own issue, which then updates the pages.

- **Audit log for Clear** → #1681: which fields are recorded, the log level, the destination,
  whether it is persisted or only a server log, retention, the behaviour when logging fails, and
  whether the caller IP is recorded.

## Sub-issues

From the Epic #1678 *Split* table.

| # | Title | Agent(s) | Depends on |
|---|---|---|---|
| #1679 | Statistics dashboard: write the specs | architect | — |
| #1680 | Statistics dashboard: discuss and enhance specs for the batched clear | architect (+ backend input) | #1679 |
| #1681 | Statistics dashboard: discuss and enhance specs for the clear audit log | architect (+ backend, security) | #1679 |
| #1682 | Statistics dashboard: unique-visitors count endpoint | backend (review: cache, data-access, security) | #1679 |
| #1683 | Statistics: tolerate a session deleted mid-request in visit tracking | backend | #1679 |
| #1684 | Statistics dashboard: clear statistics endpoint with ID reset | backend (review: security, cache) | #1680, #1681, #1683 |
| #1685 | Statistics dashboard: visits summary card on the staff dashboard | frontend, translator | #1679 (end-to-end needs #1682 and #1684) |
| #1686 | Statistics dashboard: remove the spec files | architect | all |
