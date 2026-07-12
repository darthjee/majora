# Issue: Break docs down

## Description
Docs under `docs/agents/` are large monolithic files that agents must read in full even when only a small part is relevant, wasting context. `access-control.md` alone is 1241 lines (83KB) covering every model and endpoint in the project, and two files documenting third-party tools (Tent, Navi) sit alongside internal architecture docs at the top level, blurring the line between core project reference and external tool reference.

## Problem
- `access-control.md` mixes access rules for every resource (Game, Character, Treasure, Task, GameSession, Link, User, etc.) into one file, so an agent working on a single resource (e.g. `data-access` reviewing a Treasure endpoint) must load the whole 1241-line file to find the relevant rules.
- `docs/agents/HOW_TO_USE_DARTHJEE-TENT.md` and `docs/agents/HOW_TO_USE_NAVI.md` document external tools (Tent proxy, Navi cache warmer) but live at the same top level as internal docs like `architecture.md` and `product.md`, making it harder to tell what's project-specific vs third-party reference.
- There's no documented folder structure convention for `docs/agents/` to guide where new docs should go as the project grows.

## Solution
1. **Split `access-control.md` by resource** into a new `docs/agents/access-control/` folder, one file per top-level resource/section currently in the file (e.g. `game.md`, `character.md`, `character-photo.md`, `character-treasure.md`, `game-treasure.md`, `link.md`, `character-link.md`, `treasure.md`, `game-session.md`, `task.md`, `user.md`, `game-master.md`, `player.md`, plus a file for the standalone endpoints section (access-route config, health check, authentication) and one for `versioning`/historical records). Keep `access-control.md` itself as a short index: a table of contents linking to each per-resource file, plus the 'Adding a new model' guidance (process guidance, not a resource, stays there).
2. **Move external tool docs** `HOW_TO_USE_DARTHJEE-TENT.md` and `HOW_TO_USE_NAVI.md` into a new `docs/agents/external/` folder.
3. **Document the new folder structure** in `docs/agents/folder-structure.md`, covering `access-control/` and `external/`. Other existing top-level docs (`product.md`, `pagination.md`, `i18n.md`, `security-guidelines.md`, `views-organization.md`, `frontend.md`, `cache-warmer.md`, `contributing.md`, `architecture.md`) stay at the top level of `docs/agents/` — this reorg only introduces the two new subfolders named above, it does not regroup everything else.
4. **Update every reference** to the moved/split content so links stay correct: `AGENTS.md`, `.claude/agents/architect.md`, `.claude/agents/data-access.md`, `.claude/agents/infra.md`, `docs/agents/architecture.md`, `docs/agents/cache-warmer.md`, `docs/agents/product.md`.

## Benefits
- Agents only load the access-control rules for the resource they're actually touching, instead of the entire 1241-line file.
- Clear separation between internal project reference docs and third-party tool reference docs.
- A documented folder structure convention makes it obvious where future docs should live.

---

Tags: :shipit:
