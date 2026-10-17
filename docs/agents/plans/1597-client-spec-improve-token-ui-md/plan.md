# Plan: Client spec: improve token-ui.md

Issue: [1597-client-spec-improve-token-ui-md.md](../../issues/1597-client-spec-improve-token-ui-md.md)

## Overview

Docs-only change, owned by the architect. Rewrite `docs/agents/specs/client/token-ui.md` so it
records every decision settled in the issue and has no open questions left, amend
`docs/agents/specs/client/token-api.md` for the reachable-game definition and the new
`options.json` endpoint, and update the hub `docs/agents/specs/client.md` (and the one
cross-reference in `scopes.md`) to match.

## Context

`token-ui.md` (written in #1593) left its open questions unsettled, and reading it against
`token-api.md` (#1596, merged) and `scopes.md` (#1595, merged) showed cross-page gaps: an
inconsistent "reachable game" definition, no way for the UI to get the scope catalogue, and
UI obligations stated elsewhere (superuser warning, "games joined later" copy, expired status)
missing from the page. The issue's Solution section is the source of truth for the content;
this plan only says where each part goes. #1604 (backend), #1605 and #1606 (frontend) are still
open, so amending `token-api.md` here is safe.

## Steps

- [01 — Rewrite token-ui.md](plan/01-rewrite-token-ui.md)
- [02 — Amend token-api.md and scopes.md](plan/02-amend-token-api.md)
- [03 — Update the client hub](plan/03-update-hub.md)

## CI Checks

- Markdown: `docker-compose run --rm markdownlint` — run through
  `docker-compose`/`make` per AGENTS.md, never on the host (CI job: `markdownlint`).

## Notes

- Keep the aspect-page template from the hub: **Overview**, **Decisions**, **Open questions**,
  **Affected code**. The Open questions section becomes "None." with a pointer to #1597.
- Follow the writing style of the merged `token-api.md` / `scopes.md` (short bullets, bold lead
  phrases, explicit "Rejected:" lines).
- Do not touch code; every code change belongs to #1604, #1605 or #1606.
- The issue's "Components, boundaries, testing and security" section was agreed during
  `/discuss-issue`, so it is recorded as decisions, not as open points.
