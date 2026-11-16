# Plan: Backend tests speed: remove the specs and publish the testing policy

Issue: [1795-backend-tests-speed-remove-the-specs-and-publish-the-testing-policy.md](../../issues/1795-backend-tests-speed-remove-the-specs-and-publish-the-testing-policy.md)

## Overview

Close out Epic #1785. Move the lasting knowledge from the `pytest-all-long-test` spec into a new permanent `docs/agents/testing.md`, repoint every link to it, delete the spec in the same commit, and post the Epic's final before and after runtimes on #1785. Docs only: no test, CI or application change. Owner: `architect` (cross-cutting docs and agent instruction files).

## Context

- Every other sub-issue (#1786–#1794, #1798, #1802) has merged. The planned module conversion sub-issues were never created and are dropped from the Epic.
- The spec's Lifecycle section lists the removal steps. The issue widens what moves: the isolation policy plus condensed edge cases, check-script rules, local commands and a short CI section.
- Links into the spec today: `.claude/agents/backend.md:95`, `.github/agents/backend.agent.md:15`, `.claude/agents/infra.md:125` and `docs/agents/specs.md:16`.

## Steps

- [01 — Write docs/agents/testing.md](plan/01-write-testing-md.md)
- [02 — Repoint links and delete the spec](plan/02-repoint-links-and-delete-spec.md)
- [03 — Post the final numbers on the Epic](plan/03-post-final-numbers.md)

## CI Checks

- Docs: Codacy markdown checks on the PR (blank lines around headings and lists, see `docs/agents/documentation.md`); no local equivalent.
- `checks` CI job (`poetry run python bin/check_test_policy.py`) must stay green; this PR changes no Python, so it is unaffected.

## Notes

- Steps 01 and 02 land in the same commit, so no link ever points at a deleted file.
- Keep `testing.md` focused on rules and how-to; do not copy timing tables, cost drivers, hypotheses or conversion counts (git history keeps them).
- Step 03 needs CircleCI timings from the latest `main` pipeline and a local run on the #1794 machine (Apple M4 Pro). If the local machine differs, state it in the comment rather than skipping the number.
