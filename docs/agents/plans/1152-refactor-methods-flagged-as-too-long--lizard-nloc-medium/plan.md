# Plan: Refactor methods flagged as too long (Lizard nloc-medium)

Issue: [1152-refactor-methods-flagged-as-too-long--lizard-nloc-medium.md](../../issues/1152-refactor-methods-flagged-as-too-long--lizard-nloc-medium.md)

## Overview

This issue is now the umbrella/tracking issue: the actual per-file method refactors were split off into three sub-issues, one per specialist domain — [#1166](https://github.com/darthjee/majora/issues/1166) (backend), [#1167](https://github.com/darthjee/majora/issues/1167) (frontend), and [#1168](https://github.com/darthjee/majora/issues/1168) (proxy) — each to be planned and implemented separately. What remains for #1152 itself is a single, purely documentation change: strengthening `docs/agents/contributing.md`'s Definition of Done so it no longer blanket-exempts specs/tests from the class/method-responsibility requirement.

This is a root-level, cross-cutting doc (not owned by any single specialist agent's scope — `backend`, `frontend`, and `proxy` each own only their own directory), so this plan is unsplit and owned directly by the architect.

## Context

`docs/agents/contributing.md`'s Definition of Done already requires focused responsibilities and small methods, but currently says:

> This requirement applies primarily to source code. For specs/tests, refactor only if there is excessive duplication.

Most of the 33 originally-flagged occurrences (now distributed across #1166/#1167/#1168) are test/spec files flagged purely for length, not duplication — a case the current wording doesn't clearly cover. The user confirmed during discussion: refactor the tests too, and narrow this exemption rather than leaving it as-is, following the project's existing pattern of splitting test files and extracting shared setup helpers.

## Implementation Steps

### Step 1 — Narrow the specs/tests exemption in the Definition of Done

In `docs/agents/contributing.md`, under `## Definition of Done for PRs`, replace the last bullet of the "Code is not overly complex" group:

> This requirement applies primarily to source code. For specs/tests, refactor only if there is excessive duplication.

with wording that also triggers a refactor when a spec/test method is simply too long/low-cohesion (mixing multiple fixtures, scenarios, or setup blocks in one method) — not only when there's literal duplication — while still not mandating changes to short, single-purpose tests. For example (adjust wording to match the doc's existing voice):

> This requirement applies to source code and to specs/tests alike: refactor a spec/test method when it has excessive duplication, or when it has grown long/low-cohesion by mixing multiple fixtures, scenarios, or setup blocks — e.g. extracting per-fixture helper methods out of a `setUpTestData`, or shared setup/assertion helpers out of a spec file. Short, single-purpose tests do not need to be restructured just to hit a line count.

### Step 2 — Proofread in context

Re-read the full "Definition of Done for PRs" section after the edit to make sure the new wording reads consistently with the surrounding bullets and doesn't contradict the "Separate Refactoring" commit guideline earlier in the file.

## Files to Change

- `docs/agents/contributing.md` — narrow the specs/tests exemption in the Definition of Done's "Code is not overly complex" bullet group.

## CI Checks

- (repo root, docs-only change): `yarn lint_md` (CI job: `markdownlint`)

## Notes

- No code changes are needed for #1152 itself — the per-file refactors live in #1166, #1167, and #1168, each of which needs its own `auto-plan-issue` pass (dispatched to `backend`, `frontend`, and `proxy` respectively) once this doc change lands, since their plans should be written against the updated Definition of Done.
- Sub-issues were linked as native GitHub sub-issues of #1152 and also cross-referenced via comments (see `spawn_issue.sh`'s behavior).
