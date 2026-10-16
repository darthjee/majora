# Plan: Client spec: improve token-api.md

Issue: [1596-client-spec-improve-token-api-md.md](../../issues/1596-client-spec-improve-token-api-md.md)

## Overview

This is a docs-only change. Rewrite `docs/agents/specs/client/token-api.md` so it records every
decision settled in #1596 and has no open questions left. Amend `tokens.md` with the two
authentication changes the refinement produced, and keep the hub `client.md` consistent. No code
changes: the implementation happens in #1604 (endpoints, proxy, backend middleware) and #1602
(Bearer authentication).

## Context

The issue's *Solution* section is the source of truth. It covers:

- proxy and Navi handling of Bearer requests (with the shared Bearer detection rule);
- URL shapes, payloads, error codes;
- session-only enforcement;
- the access-control documentation plan;
- edge cases, review outcomes (reachable game, secret handling, staff audit, CSRF);
- the testing strategy for #1604.

The access-control pages themselves are **not** written here. They ship with #1604, following
`access-control.md`'s "same PR" rule. `token-api.md` only records the plan for them. The
project-wide CSRF posture is tracked separately in #1618.

## Steps

- [01 — Rewrite token-api.md](plan/01-rewrite-token-api.md)
- [02 — Amend tokens.md](plan/02-amend-tokens.md)
- [03 — Update the hub and check consistency](plan/03-update-hub-and-check.md)

## CI Checks

- Repository root: `yarn lint_md`, run through docker-compose/make as `AGENTS.md` describes
  (CI job: `markdownlint`).

## Notes

- Follow the docs style already used by `tokens.md` and `scopes.md`:
  - `## Overview`, then `## Decisions` with `###` subsections;
  - each subsection gives the chosen option, then a `Rejected:` line for each alternative;
  - then `### Testing strategy`, `## Open questions` ("None. Every open question was settled by
    #1596 and recorded under Decisions."), and `## Affected code`.
- Keep the page readable: carry the decisions over, not the dialogue's *Findings* prose. Keep
  only the one-line rationale each decision needs.
- `scopes.md` already lists token management under "Never reachable with a scoped token". It
  needs no change.
