# Plan: Client spec: improve cli.md

Issue: [1599-client-spec-improve-cli-md.md](../../issues/1599-client-spec-improve-cli-md.md)

## Overview

Documentation-only change. Rewrite `docs/agents/specs/client/cli.md` with the CLI design agreed
in the issue's **Solution** section, close the page's open questions, and update `library.md`
and the hub `client.md` so they point at the settled design. No code changes. #1610 implements
the result.

## Context

`cli.md` was written by #1593 with five open questions (command grammar, output, flags, exit
codes, executable name and argument parser). #1598 settled the library and left two hand-offs:
the `--game 3` example must use a game slug, and the CLI's resources follow the scope families.
`library.md` also leaves the internal layout of `src/cli/` to #1599. The issue's **Solution**
section, agreed with the user, answers all of these.

## Steps

- [01 — Rewrite cli.md](plan/01-rewrite-cli-md.md)
- [02 — Update library.md hand-offs](plan/02-update-library-md.md)
- [03 — Update the hub client.md](plan/03-update-hub-client-md.md)

## CI Checks

- Markdown: `yarn lint_md` (`markdownlint-cli2`, CI job: `markdownlint`). Run it through
  docker-compose, never on the host.

## Notes

- The issue's **Solution** section is the source of truth. Copy its decisions faithfully; do not
  add new ones.
- Follow the spec page template from the hub (**Overview**, **Decisions**, **Open questions**,
  **Affected code**), and the writing style of the sibling pages (`library.md`, `scopes.md`):
  bold lead-ins on bullets, explicit **Rejected:** bullets, tables for flags and exit codes.
- `docs/agents/documentation.md` says there is no markdownlint CI job, but
  `.circleci/config.yml` has one (`markdownlint`). This plan does not fix that doc; it is a
  separate, tangential inaccuracy.
