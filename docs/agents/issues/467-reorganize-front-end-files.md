# Issue: Reorganize front-end files

## Description
Front-end components under `frontend/assets/js/components/` are currently organized **by type** (`elements/`, `pages/`, each with their own `controllers/` and `helpers/` subfolders), rather than by the resource they belong to. This means files relating to a single resource (e.g. `Game`) are spread across many top-level folders, and components/controllers/helpers used by only one page live far away from that page.

We want to reorganize into a **resource-first** structure, so that all the files relevant to a resource (pages, the elements those pages use, and their controllers/helpers) are colocated under a single `resources/<resource>/` folder. Shared/common elements (used across multiple resources) and generic utilities stay in dedicated `common/` and `utils/` folders.

## Problem
- Type-first folders (`elements/`, `pages/`) force anyone (human or AI) working on a single resource (e.g. "games") to jump between unrelated top-level directories to find all the relevant files.
- Components, controllers, and helpers used by only one page currently live in a shared `elements/` bucket alongside unrelated resources' components, with no indication of which page(s) actually use them.
- As the app grows, the flat `elements/` and `pages/` folders keep growing indefinitely instead of scaling per-resource.

## Expected Behavior
`frontend/assets/js/components/` is split into per-resource folders under `frontend/assets/js/components/resources/`, one per resource:

- `game`
- `character` (covers both NPC and PC pages/controllers)
- `treasure`
- `game_session`
- `staff_user`
- `account` (my-account, register, recover-password)

Within each resource folder, pages live under `pages/`, and any element/controller/helper used only by that resource's pages is colocated under that same resource folder (e.g. `resources/game/pages/elements/`, `resources/game/pages/elements/controllers/`, `resources/game/pages/elements/helpers/`), following the nesting style already shown in the issue's example.

Elements, controllers, or helpers genuinely shared across more than one resource stay under `frontend/assets/js/components/common/` (with its own `controllers/` and `helpers/` subfolders). Generic utility classes stay under `frontend/assets/js/components/utils/`.

The mirrored spec files under `frontend/specs/assets/js/components/` are reorganized to match the same resource-based structure, so each spec sits alongside the equivalent source file's new location.

## Solution
1. Define the final target tree under `frontend/assets/js/components/resources/` for each of the six resources listed above, deciding per-file whether it's resource-specific (moves under `resources/<resource>/...`) or genuinely shared (stays under `common/`).
2. Execute the migration **incrementally, one resource at a time**, so each move is small and reviewable:
   - Move the resource's pages, then the elements/controllers/helpers used only by those pages.
   - Update all import paths referencing the moved files (within `frontend/assets/js/components/` and from routing/App wiring).
   - Move the matching spec files under `frontend/specs/assets/js/components/` and update their import paths.
   - Run the front-end test suite and linter after each resource's move before moving to the next.
3. Once all resources are migrated, confirm `elements/` and `pages/` (the old type-first top-level folders) are empty and remove them, leaving only `resources/`, `common/`, and `utils/` under `components/`.

## Benefits
- AI agents and developers can focus on a single resource folder instead of hunting across `elements/` and `pages/`.
- Components/controllers/helpers live next to the page(s) that actually use them, making ownership and blast radius obvious.
- The structure scales per-resource instead of growing two ever-larger flat folders.
