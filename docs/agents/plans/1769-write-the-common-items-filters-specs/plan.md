# Plan: Write the common items filters specs

Issue: [1769-write-the-common-items-filters-specs.md](../../issues/1769-write-the-common-items-filters-specs.md)

## Overview

Docs-only task: write the common items filters specs for Epic #1766 under `docs/agents/specs/`.
That means an index page plus four aspect pages (`api-contract`, `backend`, `frontend`, `testing`),
and registering the index in the specs hub. Every decision is already in the issue's *Decisions*
section, so the work is to record them, each rule with its rationale. No code changes.

## Context

The backend (#1770) and frontend (#1771) sub-issues implement against these pages, and #1772
deletes them at the end. Follow the layout and tone of `docs/agents/specs/statistics-bug.md` and
its aspect pages. Permanent docs must not link into `docs/agents/specs/common-items-filters/`;
links only go from the spec pages outward.

## Steps

- [01 — Index page and hub registration](plan/01-index-page.md)
- [02 — API contract page](plan/02-api-contract.md)
- [03 — Backend page](plan/03-backend.md)
- [04 — Frontend page](plan/04-frontend.md)
- [05 — Testing page](plan/05-testing.md)

## CI Checks

- Markdown: `yarn lint_md` (CI job: `markdownlint`); run it through docker-compose, never on the
  host. Also check by eye per `docs/agents/documentation.md`: blank line after every heading,
  around lists and tables.

## Notes

- Nothing is left to decide. If writing surfaces a gap, record the most conservative option
  consistent with the issue's decisions and flag it in the PR description.
- Reference issues by number (#1766, #1769 to #1772) and code by repo-relative path.
