# Issue: Client: remove the spec files

## Description
Part of epic #1592 (Majora client for automations, with fine-grained API tokens). This is the epic's final cleanup step: remove the temporary client spec now that #1612 has moved every long-lived fact into permanent docs (`docs/agents/client.md` and `docs/agents/client/`, `docs/agents/access-control/api-token.md` and `token-scopes.md`, `docs/guides/client.md`, and others) and into the bodies of the open wrapper issues #1621, #1622 and #1623.

## Problem
- `docs/agents/specs/client.md` and its 7 aspect pages under `docs/agents/specs/client/` are still in the repo and listed under "Active specs" in `docs/agents/specs.md`, even though specs are meant to be removed once the feature is implemented and documented.
- Two backend module docstrings still point at spec pages:
  - `backend/accounts/scopes.py` → `docs/agents/specs/client/scopes.md`
  - `backend/accounts/api_tokens.py` → `docs/agents/specs/client/token-api.md`

## Expected Behavior
- `docs/agents/specs/client.md` and `docs/agents/specs/client/` no longer exist.
- `docs/agents/specs.md` no longer lists the Client spec.
- No live link or path reference in docs, agent definitions (`.claude/agents/`), READMEs or code points to `docs/agents/specs/client*`, and the docs have no broken links.

## Solution
- **Docs (architect):** delete `docs/agents/specs/client.md` and `docs/agents/specs/client/`, and remove the `- [Client](specs/client.md)` entry from `docs/agents/specs.md`.
- **Backend (backend agent):** repoint the module docstrings:
  - `backend/accounts/scopes.py` → `docs/agents/access-control/token-scopes.md`
  - `backend/accounts/api_tokens.py` → `docs/agents/access-control/api-token.md`
- **Verification:** grep the repo for `specs/client` and run the markdown linter. The only remaining matches should be historical, non-link mentions.
- **Out of scope:** historical mentions stay as they are: old issue/plan files under `docs/agents/issues/` and `docs/agents/plans/`, git-ignored `.claude/state/` files, the epic #1592 body and the "Moved here from the client spec" notes in #1621, #1622 and #1623. The epic stays open until those wrapper issues land.

## Benefits
- No stale design doc that could contradict the implemented behavior.
- Code and docs point at permanent docs only, so future agents read the real source of truth.
