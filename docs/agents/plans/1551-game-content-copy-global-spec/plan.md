# Plan: Game content copy: global spec

Issue: [1551-game-content-copy-global-spec.md](../../issues/1551-game-content-copy-global-spec.md)

## Overview

Docs-only change writing the global spec of the "copy content between games" feature (epic
#1550): a spec index registered in the `docs/agents/specs.md` hub, a one-time `AGENTS.md` link to
that hub, four global aspect pages under `docs/agents/specs/game-content-copy/`, and an
access-control page for the planned staff-copy endpoints. The pages record every decision in the
issue; the specialist agents review them before the PR is opened.

## Context

The issue's `## Solution` section is the source of truth for the content of each page (specs
hub, page, copy flow, hard links, API baseline, `Upload` extension, permissions, decided edge
cases, agent consultation). No code changes. The per-tab specs (#1552–#1557) are separate issues
that reference these pages, so page names and anchors written here become their link targets.

## Steps

- [01 — Specs hub and index](plan/01-specs-hub-and-index.md)
- [02 — Write `page.md`](plan/02-page.md)
- [03 — Write `copy-flow.md`](plan/03-copy-flow.md)
- [04 — Write `hard-links.md`](plan/04-hard-links.md)
- [05 — Write `permissions.md` and `access-control/staff-copy.md`](plan/05-permissions.md)
- [06 — Agent review and lint](plan/06-agent-review-and-lint.md)

## CI Checks

- Markdown: `docker-compose run --rm markdownlint` (runs `yarn install && yarn lint_md`; CI job: `markdownlint`)

## Notes

- Keep the per-tab content out: the global pages describe shared contracts only; each tab page
  (#1552–#1557) adds its own type's specifics.
- `access-control/staff-copy.md` documents endpoints that don't exist yet: mark the page clearly
  as **planned** (pointing to the spec) so readers don't take it for implemented behavior; the
  implementation issues flip it to current.
- The cross-domain cache invalidation question stays open unless the `cache` review settles it;
  record the outcome (or the open question) in `permissions.md`.
- Line length and heading rules follow the repo's markdownlint config; tables with escaped pipes
  (`image\|file`) are expected.
