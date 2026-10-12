# Plan: Remove the game content copy specs

Issue: [1558-remove-the-game-content-copy-specs.md](../../issues/1558-remove-the-game-content-copy-specs.md)

## Overview

Every implementation issue of epic #1550 is merged, so the temporary design specs under
`docs/agents/specs/game-content-copy*` are now a stale second source of truth. The architect
moves the knowledge as it was implemented into permanent docs: a feature doc
`docs/agents/game-content-copy.md` plus one page per tab under `docs/agents/game-content-copy/`,
the proxy link handler in `architecture/proxy.md`, and stale wording fixed in access-control.
Then the architect deletes the specs and their hub entry. Backend docstrings and proxy rule
comments that point into the spec files are repointed to the new docs.

## Agents involved

- [architect](architect.md)
- [backend](backend.md)
- [proxy](proxy.md)

## Shared contracts

The new permanent doc paths and anchors that the code comments point to. The architect must
create exactly these. Backend and proxy only reference them:

| Path | Required anchors |
|------|------------------|
| `docs/agents/game-content-copy.md` | `## Cache` (`#cache`) |
| `docs/agents/game-content-copy/items.md` | `## Cache` |
| `docs/agents/game-content-copy/common-items.md` | `## Cache` |
| `docs/agents/game-content-copy/recipes.md` | `## Common item` (`#common-item`), `## Cache` |
| `docs/agents/game-content-copy/documents.md` | `## Cache` |
| `docs/agents/game-content-copy/factions.md` | `## Names` (`#names`), `## Cache` |
| `docs/agents/game-content-copy/possessions.md` | `## Cache` |

After this issue, no file in the repo (code or docs, excluding `docs/agents/issues/` and
`docs/agents/plans/`) contains the string `specs/game-content-copy`.
