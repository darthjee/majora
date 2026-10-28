# Plan: Statistics bug: write the investigation specs

Issue: [1697-statistics-bug-write-the-investigation-specs.md](../../issues/1697-statistics-bug-write-the-investigation-specs.md)

## Overview

Documentation-only. Write the investigation specs for Epic #1696 (a visitor already tracked by a
statistics `Session` gets a new one while navigating): an index at
`docs/agents/specs/statistics-bug.md`, registered in `docs/agents/specs.md`, plus eight aspect
pages under `docs/agents/specs/statistics-bug/`. No code changes.

## Context

- Precedent for shape: `docs/agents/specs/loot-crawling.md` (short index + aspect pages) and the
  `docs/agents/specs.md` hub (every spec registers there only, never in `AGENTS.md`).
- Source material: `backend/statistics/` (`middleware.py`, `session_attachment.py`,
  `cookies.py`, `visit_tracking.py`, `settings.py`), `backend/common/client_ip.py`,
  `backend/games/views/common.py` (`require_staff`), `backend/accounts/authentication.py`
  (`InvalidApiToken`, `ApiTokenForbidden` family), `backend/accounts/scopes.py`,
  `backend/accounts/urls/authorization_requests.py`, and `docs/agents/statistics.md`
  (*Client IP integrity*, *Tracking race*, *Login is a visit boundary*).
- Sub-issues the pages serve: #1698 (investigator agent), #1699 (scope + export endpoint),
  #1700 (frontend scope UI), #1701 (version bump), #1702 (`emulate.py`), #1703 (`analyse.py`),
  #1704 (code review & findings), #1705 (create the fix issue).
- The repo is **public**: no real IPs / user ids / session ids / token values / secret values;
  examples use RFC 5737 IPs and made-up ids.

## Steps

- [01 — Index and hub registration](plan/01-index-and-registration.md)
- [02 — Investigation plan and symptom pages](plan/02-plan-and-symptom.md)
- [03 — Hypotheses page](plan/03-hypotheses.md)
- [04 — Export endpoint and scope page](plan/04-export-endpoint.md)
- [05 — Scripts page](plan/05-scripts.md)
- [06 — Environments, privacy and findings pages](plan/06-environments-privacy-findings.md)
- [07 — Lint and review](plan/07-lint-and-review.md)

## CI Checks

- Markdown: `yarn lint_md` (`markdownlint-cli2`, config `.markdownlint-cli2.jsonc`), run through
  the project's docker-compose tooling, never on the host (CI job: `markdownlint`).

## Notes

- Pages describing things that do not exist yet are marked *planned by #<id>*.
- Permanent docs must not link into `docs/agents/specs/statistics-bug/` (it is removed by the fix
  work); links only go from the specs outward.
- Do not restate the investigator agent's rules — link to #1698's docs instead.
- Security-sensitive hypotheses (e.g. cache replaying another visitor's `Set-Cookie`) are stated
  as what to verify, never as step-by-step exploitation.
- The `data-access` and `security` agents review the PR (read-only).
