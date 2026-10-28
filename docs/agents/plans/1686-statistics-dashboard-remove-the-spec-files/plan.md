# Plan: Statistics dashboard: remove the spec files

Issue: [1686-statistics-dashboard-remove-the-spec-files.md](../../issues/1686-statistics-dashboard-remove-the-spec-files.md)

## Overview

Docs-only cleanup that closes Epic #1678, owned by the `architect`. Move the lasting knowledge
from the temporary Statistics Dashboard spec into `docs/agents/statistics.md`, checked against
the merged code. Then repoint or remove every link to the spec and delete the spec files.

## Context

- All implementation sub-issues (#1679–#1685) are merged.
- The spec lives in `docs/agents/specs/statistics_dashboard.md` and
  `docs/agents/specs/statistics_dashboard/` (`count-endpoint.md`, `clear-endpoint.md`,
  `tracking-race.md`, `dashboard-card.md`).
- `docs/agents/access-control/staff-statistics.md` already covers the summary and Clear
  endpoints' permissions. It links to `../specs/statistics_dashboard/clear-endpoint.md#audit-log`.
- `docs/agents/statistics.md` does not mention the card, the summary endpoint, Clear, the ID
  reset, the batched clear, the audit log or the tracking race.
- `docs/agents/specs.md` lists the spec under *Active specs*.
- Historic files under `docs/agents/issues/` and `docs/agents/plans/` keep their references.

## Steps

- [01 — Add the permanent sections to statistics.md](plan/01-add-permanent-sections.md)
- [02 — Repoint links and unregister the spec](plan/02-repoint-links.md)
- [03 — Delete the spec files and check for dangling links](plan/03-delete-spec-files.md)

## CI Checks

- repo root: `yarn lint_md` (`markdownlint-cli2`), run through the project's node container
  (CI job: `markdownlint`)

## Notes

- Describe what was merged, not what the spec planned. Where the code differs from the spec,
  document the code.
- Do not duplicate permissions from `access-control/staff-statistics.md`. Link to it instead.
- Do not move the spec-only material: sub-issue tables, *Open questions*, *Tests* and
  *Implemented by* sections.
