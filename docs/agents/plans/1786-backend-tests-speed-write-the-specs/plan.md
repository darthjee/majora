# Plan: Backend tests speed: write the specs

Issue: [1786-backend-tests-speed-write-the-specs.md](../../issues/1786-backend-tests-speed-write-the-specs.md)

## Overview

Docs-only first sub-issue of Epic #1785. Write the spec hub `docs/agents/specs/pytest-all-long-test.md` and its seven aspect pages from the content of #1785, record the test-style counts once, register the spec in `docs/agents/specs.md`, and replace the backend agent's test instructions so new tests stop using the slow pattern. No code, test, CI or configuration change, and no test run.

## Context

- Epic #1785 holds all the source content: baseline (pipeline 5881), cost drivers, hypotheses, option D isolation policy, edge cases, backward compatibility, testing strategy and the sub-issue table (#1786 to #1795).
- Precedent: `docs/agents/specs/statistics-bug.md` and `docs/agents/specs/statistics-bug/*.md` (hub with aspect-page list, sub-issue table, lifecycle section; each page opens with "Part of the [...](../<hub>.md) specs (Epic #...)").
- `docs/agents/specs.md` is the single registry of active specs.
- `.claude/agents/backend.md` "Tests (pytest + pytest-django)" section currently prescribes `@pytest.mark.django_db` + `setup_method`. `.github/agents/backend.agent.md` has no test-style rule.
- No agent other than the architect owns `docs/agents/` or `.claude/agents/`/`.github/agents/`, so this plan has no specialist split.

## Steps

- [01 — Write the hub and register it](plan/01-hub-and-registration.md)
- [02 — Write the measurement pages](plan/02-measurement-pages.md)
- [03 — Write the policy pages](plan/03-policy-pages.md)
- [04 — Count test styles and write conversions.md](plan/04-conversions-page.md)
- [05 — Update the backend agent instructions](plan/05-agent-instructions.md)

## CI Checks

- `markdownlint` CI job: runs `markdownlint-cli2` with `.markdownlint-cli2.jsonc`, which enables only MD012 (no multiple blank lines), MD022 (blank lines around headings) and MD032 (blank lines around lists). Check new and changed files against these rules; do not install linters on the host.
- No backend, frontend or CI job is affected: no code changes.

## Notes

- Relative links: from a page in `docs/agents/specs/pytest-all-long-test/`, the hub is `../pytest-all-long-test.md` and other docs are `../../<doc>.md`. From `.claude/agents/backend.md` the policy page is `../../docs/agents/specs/pytest-all-long-test/isolation-policy.md`. Verify every link resolves.
- The Statistics Bug lifecycle says permanent docs must not link into the spec. The backend agent instructions linking to `isolation-policy.md` is a deliberate, temporary exception agreed in #1786: #1795 repoints that link at `docs/agents/testing.md` in the same change that deletes the spec. State this in the hub's lifecycle section.
- Use real issue numbers everywhere (#1786 to #1795), never positions.
- Write only facts already established in #1785 and #1786; do not invent target numbers (numeric targets are set after #1787's durations report).
