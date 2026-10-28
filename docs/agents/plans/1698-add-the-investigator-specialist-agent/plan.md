# Plan: Add the investigator specialist agent

Issue: [1698-add-the-investigator-specialist-agent.md](../../issues/1698-add-the-investigator-specialist-agent.md)

## Overview

Add a permanent, generic `investigator` specialist agent that owns temporary
`investigations/<topic>/` folders, with written safety rules for production data and the public
repo. Documentation-only change, owned by the architect; it follows the `client` agent precedent
(#1601): agent file, docs page, roster and index entries.

## Context

Epic #1696 needs scripts that read production statistics data (read-only, via a user-approved
scoped token) and emulate navigation against the local stack. The tooling fits no existing agent
and introduces a new top-level folder, `investigations/`, scaffolded later by #1702. The agent
may read any application code for reviews (#1704) but never edits it.

## Steps

- [01 — Agent file](plan/01-agent-file.md)
- [02 — Docs page](plan/02-docs-page.md)
- [03 — Roster and index entries](plan/03-roster-and-indexes.md)
- [04 — Lint and review](plan/04-lint-and-review.md)

## CI Checks

- Markdown: `make` / docker-compose run of `yarn lint_md` (`markdownlint-cli2`, config
  `.markdownlint-cli2.jsonc`) (CI job: markdownlint)

## Notes

- `investigations/` does not exist yet; this issue only documents it. #1702 creates it.
- No Makefile targets and no root docker-compose service: investigations run with
  `docker-compose -f investigations/<topic>/docker-compose.yml ...`.
- The repo is public: no real identifiers in any example in the docs.
