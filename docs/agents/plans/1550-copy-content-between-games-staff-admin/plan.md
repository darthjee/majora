# Plan: Copy content between games (staff/admin)

Issue: [1550-copy-content-between-games-staff-admin.md](../../issues/1550-copy-content-between-games-staff-admin.md)

## Overview

#1550 is an Epic. Its spec phase is done (#1551–#1557, #1565), and the design now lives in
`docs/agents/specs/game-content-copy.md` and `docs/agents/specs/game-content-copy/`. This plan
covers the remaining coordination work on the Epic itself: turning the Phase 2 breakdown into real
GitHub sub-issues, tracking them on the Epic, and gating the cleanup issue #1558. No product code
is written under this issue; each sub-issue gets its own plan and PR through the usual
`discuss-issue` → `plan-issue`/`auto-plan-issue` → `auto-fix-issue` pipeline.

## Context

- The specs are the source of truth. Each sub-issue body names the spec pages it implements and
  does not copy their content, so there is only one place to keep up to date.
- Phase 2 breakdown (from the Epic): A backend foundation, B `Upload` copy origin, C proxy link
  handler, D frontend page shell, E Items tab (reference), F Common items, G Recipes, H
  Possessions, I Factions, J Documents.
- Sequencing: A → B → C/D in parallel → E → F, H, I, J in parallel; G after F.
- #1558 (remove the specs) stays last, blocked until every Phase 2 sub-issue is merged and its
  knowledge has moved into the permanent docs.

## Steps

- [01 — Create the Phase 2 sub-issues](plan/01-create-phase-2-sub-issues.md)
- [02 — Record sub-issue numbers and dependencies on the Epic](plan/02-record-sub-issues-on-epic.md)
- [03 — Gate and prepare the cleanup issue #1558](plan/03-gate-cleanup-issue.md)

## Notes

- Creating the sub-issues is best done with `/arcanum-split-issue 1550`, which links each one as a
  native GitHub sub-issue of #1550. Every sub-issue still needs a `discuss-issue` refinement before
  it is planned.
- Every issue that adds endpoints runs the `data-access` and `security` reviewers. The `cache`
  agent confirms that no Navi resource is needed, since every `staff/copies*` endpoint sends
  `X-Skip-Cache`.
- Risk: specs may drift during implementation. When a sub-issue's implementation departs from its
  spec, the same PR updates the spec page so #1558 moves accurate knowledge into the permanent docs.
