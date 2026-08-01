# Plan: Improve docs token usage

Issue: [934-imrpove-docs-token-usage.md](../../issues/934-imrpove-docs-token-usage.md)

## Overview

Reduce the token/context cost of working in this repo for AI agents, in three
independent tracks: add short summary headers to the handful of large
`docs/agents/` files, replace duplicated permission-role prose in the
access-control docs with references to the existing YAML permission config,
and reduce test-fixture duplication on both backend and frontend. The first
two tracks are pure documentation and are handled directly here (architect);
the third is split by stack.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

None. The backend and frontend tracks touch independent test-fixture files
(`backend/games/tests/factories.py` vs `frontend/specs/support/factories.js`)
with no interface between them.

## Documentation Steps (architect)

### Step 1 — Add "Agent Summary" headers to large docs

Add a short (2-4 sentence) `> **Agent Summary:** ...` blockquote at the top of
each of the following files, right after the `# Title` heading, summarizing
what the file covers and when an agent needs to read past the summary:

- `docs/agents/access-control/principles.md` (200 lines)
- `docs/agents/access-control/character.md` (166 lines)
- `docs/agents/product/entities/ownership-and-roles.md` (165 lines)
- `docs/agents/access-control/common-rules.md` (152 lines)
- `docs/agents/external/HOW_TO_USE_NAVI.md` (429 lines)
- `docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md` (837 lines)

Do not add headers to any other file under `docs/agents/` — the rest are
already short enough (median ~30 lines) that a header would add overhead
rather than save tokens. Do not create a new global index file — `AGENTS.md`'s
table plus the existing per-folder index files (`access-control.md`,
`frontend/index.md`, `security-guidelines.md`, `product.md`) already form a
2-level TOC.

### Step 2 — Point access-control docs at the permission YAML config

`backend/games/permissions/config/<resource>/{endpoints,ui}.yml` is the
authoritative, machine-readable list of which roles satisfy each named
permission class (e.g. `create_item: [staff, player]` in `game/ui.yml`).
Several per-resource docs under `docs/agents/access-control/` restate these
role lists in prose (e.g. `game.md`'s "`can_create_item` —
**GameItemCreatePermission**: dm, admin, or staff").

For each `docs/agents/access-control/<resource>.md` file that has a matching
folder under `backend/games/permissions/config/` (map by resource name —
`game` -> `game/`, `game-item` -> `game_item/`, `treasure` -> `treasure/`,
etc.), replace inline role lists with a reference to the corresponding YAML
file(s), e.g.:

> Roles: see [`game/ui.yml`](../../../backend/games/permissions/config/game/ui.yml).

Keep in prose only what the YAML can't express: the permission class *name*,
the endpoint it guards, and any rationale/edge case (e.g. why `Create`
deviates from the default CRUD pattern in `game.md`). Also check
`docs/agents/access-control.md`, `principles.md`, and `common-rules.md` for
role lists that belong in the YAML instead.

Affected resource folders to check against `backend/games/permissions/config/`:
`game`, `game_document`, `game_item`, `game_npc`, `game_npc_item`, `game_pc`,
`game_pc_item`, `game_session`, `game_task`, `player`, `poll`, `poll_vote`,
`session_message`, `treasure`.

## Files to Change

- `docs/agents/access-control/principles.md`, `character.md`,
  `docs/agents/product/entities/ownership-and-roles.md`, `common-rules.md`,
  `docs/agents/external/HOW_TO_USE_NAVI.md`, `HOW_TO_USE_DARTHJEE-TENT.md` —
  add Agent Summary headers
- `docs/agents/access-control.md` and the per-resource files under
  `docs/agents/access-control/` listed above — replace duplicated role-list
  prose with YAML references

## Notes

- No code behavior changes in this track — documentation only.
- When editing access-control docs, do not change the actual permission
  semantics — only how the role lists are expressed (reference vs. inline
  prose).
