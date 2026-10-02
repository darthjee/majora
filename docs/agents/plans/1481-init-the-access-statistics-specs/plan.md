# Plan: Init the access statistics specs

Issue: [1481-init-the-access-statistics-specs.md](../../issues/1481-init-the-access-statistics-specs.md)

## Overview

Create the access statistics spec for #1477: a thin hub, `docs/agents/specs/access-statistics.md`,
and ten pages under `docs/agents/specs/access-statistics/`:

- two foundation pages written in full;
- a partly filled `shared-infrastructure.md`;
- seven tab stubs following a fixed template.

Then register the spec in `docs/agents/specs.md`. This is documentation only: it transcribes
decisions already made in #1477 and makes none of its own.

## Context

- Precedent: `docs/agents/specs/loot-crawling.md` (14-line hub) plus
  `docs/agents/specs/loot-crawling/*.md` aspect pages. Foundation pages are prose, in the style
  of `loot-crawling/model-changes.md`.
- Source material:
  - the live body of **#1477** (`gh issue view 1477`), in its Tabs, Scope, Edge cases,
    Permissions, Filters and charting, and Performance & security sections;
  - the live bodies of **#1482 to #1489**, whose "What to define" checklists become the stubs'
    "To define" items;
  - **#1478** (the `Visit` design) and **#1480** (the ghost-session bug).
- If #1478 has already been merged when this runs, describe `Visit` from the merged code
  (`backend/statistics/models.py`, `middleware.py`) instead of the proposal.
- All Markdown must follow `docs/agents/documentation.md`: blank lines around headings and
  lists. This matters for the stub template, which appears in the issue as a compact fenced
  block.

## Steps

- [01 — Hub and registration](plan/01-hub-and-registration.md)
- [02 — Data model foundation page](plan/02-data-model.md)
- [03 — Access and security foundation page](plan/03-access-and-security.md)
- [04 — Shared infrastructure page](plan/04-shared-infrastructure.md)
- [05 — Tab stubs](plan/05-tab-stubs.md)
- [06 — Verify](plan/06-verify.md)

## CI Checks

- Markdown: `docker-compose run --rm markdownlint yarn lint_md` (CI job: `markdownlint`)

## Notes

- **No new decisions.** Anything not settled in #1477 goes under "To define" or "Open
  questions" on the relevant page, never answered.
- **No code changes,** and no edits to `docs/agents/index.md` / `summary.md`. Specs are
  registered only in `specs.md`.
- Nothing to do on GitHub: #1477 already carries the source-of-truth note.
- #1480 is described **by outcome only** ("no ghost anonymous `Session` rows"), not by
  mechanism.
