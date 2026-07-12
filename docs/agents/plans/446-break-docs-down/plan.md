# Plan: Break docs down

Issue: [446-break-docs-down.md](../issues/446-break-docs-down.md)

## Overview
Split the monolithic `docs/agents/access-control.md` (1241 lines) into one file per resource under a new `docs/agents/access-control/` folder, keeping `access-control.md` itself as a short index. Move the two external-tool docs (`HOW_TO_USE_DARTHJEE-TENT.md`, `HOW_TO_USE_NAVI.md`) into a new `docs/agents/external/` folder. Update `folder-structure.md` and every file that links to the moved/split content so no reference breaks. This is a pure docs reorganization — no application code changes.

## Context
Agents load whole docs even when only a fraction is relevant. `access-control.md` covers every model/endpoint in one file, and the two external-tool references sit at the top level of `docs/agents/` alongside internal docs, blurring the internal-vs-third-party distinction. Per the discussion on the issue: only `access-control/` and `external/` are introduced as new subfolders — all other existing top-level docs (`product.md`, `pagination.md`, `i18n.md`, `security-guidelines.md`, `views-organization.md`, `frontend.md`, `cache-warmer.md`, `contributing.md`, `architecture.md`) stay where they are.

## Implementation Steps

### Step 1 — Split `access-control.md` into `docs/agents/access-control/`

Current file has 21 top-level `##` sections (see exact line ranges in "Files to Change" below). Create `docs/agents/access-control/` and move each section's content verbatim into its own file, keeping the same heading levels shifted down by one (the section's `## Heading` becomes the new file's `# Heading`):

| New file | Source section (current heading) |
|---|---|
| `user-roles.md` | User Roles |
| `game.md` | Game |
| `game-photo.md` | GamePhoto |
| `upload.md` | Upload (covers Game/Character/Treasure photo upload init endpoints + Character slain fields write-path history) |
| `character.md` | Character (PC and NPC) |
| `game-master.md` | GameMaster |
| `player.md` | Player |
| `user.md` | User (Staff Management) |
| `character-photo.md` | CharacterPhoto |
| `character-treasure.md` | CharacterTreasure |
| `game-treasure.md` | GameTreasure |
| `link.md` | Link |
| `character-link.md` | CharacterLink |
| `endpoints.md` | Access-route config endpoint, Health check endpoint, Authentication endpoints (three small standalone-endpoint sections grouped into one file) |
| `treasure.md` | Treasure |
| `game-session.md` | GameSession |
| `task.md` | Task |
| `versioning.md` | Historical records (`versioning` app) |

`Adding a new model` is process guidance, not a resource — it stays in `access-control.md` itself (see Step 2), not split out.

Preserve all internal cross-references between sections (e.g. `Character` section links to `CharacterPhoto`) by rewriting them as relative links between the new files.

### Step 2 — Shrink `access-control.md` to an index

Replace the body of `access-control.md` with:
- A one-paragraph description of what this doc set covers.
- A table of contents linking to every file created in Step 1, grouped sensibly (models vs. standalone endpoints vs. versioning).
- The full, unmodified `Adding a new model` section (currently the last section of the file), since it's guidance about the doc set as a whole rather than a single resource.

### Step 3 — Move external tool docs

Create `docs/agents/external/` and `git mv`:
- `docs/agents/HOW_TO_USE_DARTHJEE-TENT.md` → `docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md`
- `docs/agents/HOW_TO_USE_NAVI.md` → `docs/agents/external/HOW_TO_USE_NAVI.md`

No content changes to these files beyond the move.

### Step 4 — Document the new folder structure

Update `docs/agents/folder-structure.md` to describe the two new subfolders (`access-control/` per-resource files, `external/` third-party tool docs) alongside the existing top-level layout. Keep the rest of the existing structure description as-is — this is additive, not a full rewrite.

### Step 5 — Update every reference to the moved/split paths

Update links/mentions in:
- `AGENTS.md` — table entries pointing at `docs/agents/access-control.md`, `docs/agents/HOW_TO_USE_NAVI.md`.
- `.claude/agents/architect.md` — table entries for `access-control.md`, `folder-structure.md`, `HOW_TO_USE_NAVI.md`.
- `.claude/agents/data-access.md` — references to `access-control.md` as "the authoritative source of truth"; keep pointing at the index file (`access-control.md` still exists, just shrunk), no path change needed there, but verify wording still makes sense now that detail lives in per-resource files.
- `.claude/agents/infra.md` — link to `docs/agents/HOW_TO_USE_DARTHJEE-TENT.md` and `docs/agents/HOW_TO_USE_NAVI.md` → update to `docs/agents/external/...`.
- `docs/agents/architecture.md` — any mention of these paths.
- `docs/agents/cache-warmer.md` — mention of `HOW_TO_USE_NAVI.md`.
- `docs/agents/product.md` — mention of `access-control.md`.

Grep for `access-control.md`, `HOW_TO_USE_DARTHJEE-TENT`, and `HOW_TO_USE_NAVI` repo-wide after editing to confirm no stale path remains (excluding `docs/agents/issues/` and `docs/agents/plans/`, which are historical records and should not be rewritten).

## Files to Change
- `docs/agents/access-control.md` — shrink to index + "Adding a new model" section (was 1241 lines: User Roles L12, Game L29, GamePhoto L102, Upload L135, Character L274, GameMaster L589, Player L601, User L609, CharacterPhoto L644, CharacterTreasure L690, GameTreasure L781, Link L822, CharacterLink L836, Access-route config L899, Health check L926, Authentication L938, Treasure L957, GameSession L1100, Task L1141, Historical records L1204, Adding a new model L1235).
- `docs/agents/access-control/user-roles.md` (new)
- `docs/agents/access-control/game.md` (new)
- `docs/agents/access-control/game-photo.md` (new)
- `docs/agents/access-control/upload.md` (new)
- `docs/agents/access-control/character.md` (new)
- `docs/agents/access-control/game-master.md` (new)
- `docs/agents/access-control/player.md` (new)
- `docs/agents/access-control/user.md` (new)
- `docs/agents/access-control/character-photo.md` (new)
- `docs/agents/access-control/character-treasure.md` (new)
- `docs/agents/access-control/game-treasure.md` (new)
- `docs/agents/access-control/link.md` (new)
- `docs/agents/access-control/character-link.md` (new)
- `docs/agents/access-control/endpoints.md` (new)
- `docs/agents/access-control/treasure.md` (new)
- `docs/agents/access-control/game-session.md` (new)
- `docs/agents/access-control/task.md` (new)
- `docs/agents/access-control/versioning.md` (new)
- `docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md` (moved from `docs/agents/HOW_TO_USE_DARTHJEE-TENT.md`)
- `docs/agents/external/HOW_TO_USE_NAVI.md` (moved from `docs/agents/HOW_TO_USE_NAVI.md`)
- `docs/agents/folder-structure.md` — document the two new subfolders
- `AGENTS.md` — update paths
- `.claude/agents/architect.md` — update paths
- `.claude/agents/data-access.md` — verify wording after split
- `.claude/agents/infra.md` — update paths
- `docs/agents/architecture.md` — update paths if present
- `docs/agents/cache-warmer.md` — update paths
- `docs/agents/product.md` — update paths

## Notes
- Pure documentation change; no application code, tests, or CI jobs are affected.
- Preserve every "(added in issue #NNN)" annotation verbatim when moving content — these are historical markers other docs/agents rely on.
- Do a final repo-wide grep for the three old paths (excluding `docs/agents/issues/` and `docs/agents/plans/`) before considering this done.
