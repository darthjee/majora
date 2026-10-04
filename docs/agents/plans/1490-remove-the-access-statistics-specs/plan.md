# Plan: Remove the access statistics specs

Issue: [1490-remove-the-access-statistics-specs.md](../../issues/1490-remove-the-access-statistics-specs.md)

## Overview

Retire the access statistics spec (`docs/agents/specs/access-statistics.md` plus the ten
pages under `docs/agents/specs/access-statistics/`, ~2,800 lines). Its lasting knowledge
moves into two new permanent docs:

- `docs/agents/statistics.md`: feature semantics and API conventions;
- `docs/agents/frontend/charts.md`: generic Recharts conventions.

Then repoint the access-control docs, delete the spec, and remove its "Active specs" entry.
This is documentation only and owned by the architect. It changes no code.

## Context

- Final sub-issue of #1477. It is blocked by every implementation sub-issue: #1498, #1499,
  #1500, #1503, #1504, #1506, #1507, #1509, #1510, #1513, #1514, #1516, #1517, #1519,
  #1520, #1522, #1523. #1501 (client IP integrity) is **not** a blocker. Its caveat moves
  into the permanent docs.
- **The code is the source of truth.** The implementation may have diverged from the spec,
  so verify each fact against `backend/statistics/` and
  `frontend/.../staff_statistics/` before migrating it. Document what shipped, not what
  was planned.
- Migrate **lasting** knowledge only: semantics, metric definitions, counting caveats, API
  conventions and edge-case behaviour. Drop the "Decided" and "Open questions" sections,
  rejected alternatives, chart/layout mock-ups, "Implementation sub-issues" tables, the
  sub-issue map and the "Production topology check" narrative (keep only its outcome, the
  #1501 caveat).
- Existing links into the spec:
  - `docs/agents/access-control/statistics.md` links to
    `specs/access-statistics/data-model.md`;
  - `docs/agents/access-control/staff-statistics.md` links to
    `specs/access-statistics/shared-infrastructure.md#api-conventions` and has a
    "Status: planned" note;
  - `docs/agents/specs.md` lists the spec under "Active specs".

## Steps

- [01 — Write the statistics feature doc](plan/01-statistics-doc.md)
- [02 — Write the frontend charts doc](plan/02-charts-doc.md)
- [03 — Update the access-control docs](plan/03-access-control-docs.md)
- [04 — Delete the spec and check links](plan/04-delete-spec.md)

## CI Checks

- Markdown: `docker-compose run --rm markdownlint` (CI job: `markdownlint`, runs
  `yarn lint_md` with `.markdownlint-cli2.jsonc`).

## Notes

- Do not start until every blocking sub-issue is merged. If any one is still open, stop:
  its behaviour is not final yet.
- Ignore references to the spec under `docs/agents/issues/` and `docs/agents/plans/`. They
  are historical records and stay unchanged.
- Keep `statistics.md` concise and organised by concept (model, metrics, API, tabs), not as
  a merge of the ten spec pages.
