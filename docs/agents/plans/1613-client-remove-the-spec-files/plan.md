# Plan: Client: remove the spec files

Issue: [1613-client-remove-the-spec-files.md](../../issues/1613-client-remove-the-spec-files.md)

## Overview

Delete the temporary client spec (`docs/agents/specs/client.md` and its 7 aspect pages), remove it
from the specs hub, and repoint the two backend docstrings that still reference spec pages to the
permanent access-control docs added by #1612.

## Context

#1612 moved every long-lived fact from the spec into permanent docs
(`docs/agents/client.md` + `docs/agents/client/`, `docs/agents/access-control/api-token.md`,
`docs/agents/access-control/token-scopes.md`, `docs/guides/client.md`, the proxy/cache and
security-guidelines pages) and into the bodies of the open wrapper issues #1621, #1622 and #1623.
A repo-wide grep for `specs/client` now only matches the spec files themselves, the
`docs/agents/specs.md` entry, two backend module docstrings, and historical, non-link mentions.

## Implementation Steps

### Step 1 — Remove the spec files and unregister them (architect)

- `git rm -r docs/agents/specs/client.md docs/agents/specs/client/` (removes `client.md` plus
  `cli.md`, `library.md`, `packaging.md`, `scopes.md`, `token-api.md`, `token-ui.md`, `tokens.md`).
- In `docs/agents/specs.md`, delete the `- [Client](specs/client.md)` line under "Active specs".
  The other two entries (Loot Crawling, Crawler Test Harness) stay.

### Step 2 — Repoint the backend docstrings (backend)

Docstring-only change; no behaviour change, no tests needed.

- `backend/accounts/scopes.py` line 1: replace `docs/agents/specs/client/scopes.md` with
  `docs/agents/access-control/token-scopes.md`.
- `backend/accounts/api_tokens.py` line 1: replace `docs/agents/specs/client/token-api.md` with
  `docs/agents/access-control/api-token.md`. The resulting line is exactly 100 characters, which
  is within ruff's limit. If ruff complains, wrap the docstring summary onto two lines instead
  of shortening the path.

## Files to Change

- `docs/agents/specs/client.md` — deleted.
- `docs/agents/specs/client/` (7 files) — deleted.
- `docs/agents/specs.md` — remove the Client entry.
- `backend/accounts/scopes.py` — repoint module docstring to `access-control/token-scopes.md`.
- `backend/accounts/api_tokens.py` — repoint module docstring to `access-control/api-token.md`.

## CI Checks

- `docs/`: `yarn lint_md` (CI job: `markdownlint`)
- `backend/`: `poetry run ruff check .`, run through docker-compose (CI job: `checks`)

## Notes

- Verification: `git grep -n "specs/client"` should only match historical, non-link mentions:
  old issue/plan files under `docs/agents/issues/` and `docs/agents/plans/` (including this
  plan and the #1613 issue file). Also check that no relative link inside `docs/agents/` targets
  the removed pages, for example `../specs/client.md`.
- Out of scope: git-ignored `.claude/state/` files, the epic #1592 body, and the
  "Moved here from the client spec" notes in #1621–#1623 stay as they are.
- Epic #1592 stays open until #1621–#1623 land. Do not close it from this PR.
