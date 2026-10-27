# Write the index

Create `docs/agents/specs/statistics_dashboard.md`, the entrypoint of the spec.

Sections, in order:

1. `# Statistics Dashboard`, followed by a short overview. A staff-only card on
   `/#/staff/dashboard` shows the **unique visitors** for a rolling period (`day` = today,
   `week` = the last 7 days, `month` = the last 30 days), with **Reload**, **Clear** (wipes every
   `statistics.Visit` and `statistics.Session` and resets their IDs to 1, behind a typed `CLEAR`
   confirmation), and a link to `/#/staff/statistics`. The feature is **permanent** (not a debug
   harness). The spec itself is temporary and is removed by #1686. Epic: #1678.
2. `## Aspect pages`: links to `statistics_dashboard/count-endpoint.md`, `clear-endpoint.md`,
   `tracking-race.md` and `dashboard-card.md`, one line each with a short description, in the
   style of `loot-crawling.md`.
3. `## Open questions`: one bullet per question, each linking to its issue:
   - batched clear (batch size, order, per-batch commits, locking, rows inserted while it runs, the
     AUTO_INCREMENT reset step, request duration, sync or async), concurrent clears by two staff
     users, and partial-failure behaviour → #1680;
   - the audit log for Clear (fields, level, destination, persisted or not, retention, behaviour
     when logging fails, IP sensitivity) → #1681;
   - any new question found while writing → its new sub-issue of #1678.
4. `## Sub-issues`: a table with the columns `#`, `Title`, `Agent(s)` and `Depends on`, for
   #1679–#1686, copied from the Epic #1678's *Split* table.

## Files to Change

- `docs/agents/specs/statistics_dashboard.md` — new: the index.
