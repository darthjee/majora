# Issue: Refactor small lists in show pages

## Description
Show pages that use the common `ShowPageLayout` component (game, pc, npc) each have small right-side "shortlist" preview sections — e.g. pcs/npcs on the game show page, treasures/items/documents on the character (pc/npc) show pages. Today each of these lists has its own dedicated preview card, helper, and controller/fetch logic, and clicking a card behaves differently depending on the resource type. This issue extracts a single, common shortlist component, driven by the page's show type configuration, that owns its own data fetching (via `RequestStore`) and click behavior.

## Problem
- Preview lists (game page's pc/npc lists; character page's treasure/item/document lists) are implemented separately per resource type instead of sharing one component.
- Which shortlists appear on a page, in what order, and with what per-list configuration (resource type, item count) is not driven by the page's show type configuration (`showTypeConfig.js` and the per-resource configs under `show_types/configs/`).
- Data fetching for each shortlist currently lives in the page/controller (e.g. `GameController`, `CharacterListsController`) instead of being owned by the shortlist component itself through `RequestStore`.
- Click behavior on preview cards is inconsistent: pc/npc/treasure cards navigate to the resource's own show page; item/document cards currently have no click action at all (only a hover tooltip), even though items and documents each have their own show page to navigate to.

## Expected Behavior
- A common shortlist component renders every right-side preview list on the game, pc, and npc show pages (`/#/games/:game_slug`, `/#/games/:game_slug/pcs/:id`, `/#/games/:game_slug/npcs/:id`), replacing the current per-resource preview components (`GamePreviewSections`, `CharacterPreviewSectionsSlot` and their per-resource cards/helpers).
- Each show type's configuration declares which shortlists appear on that page, in what order, and per-list settings: resource type, item count limit (default 5, overridable), and click action.
- The shortlist component fetches its own items through `RequestStore`, using the resource type and item count limit from its configuration, instead of the parent page/controller fetching on its behalf.
- Clicking a card triggers the action configured for that shortlist:
  - `none`: no behavior (default for resource types with no action defined yet).
  - `navigate`: goes to the clicked resource's own show page (e.g. clicking an item inside a PC's shortlist navigates to `/#/games/:game_slug/pcs/:id/items/:id`).
  - `show picture`: opens the existing photo-modal (same pattern already used for character photos). This action type is defined by this issue but not wired to any shortlist yet — no resource in scope currently needs it.
- All shortlists get `navigate` in this refactor: pcs/npcs (already navigate today), treasures (already navigates today), and items/documents (currently have no click action, despite having their own show pages — this issue adds `navigate` for them too).
- Out of scope: shortlists at the bottom of show pages (e.g. character photos on PC/NPC show pages) are not touched by this issue.
- No change in permissions.

## Solution
- Add a common shortlist component under `frontend/assets/js/components/common/` that takes a resource type, item count limit, and click-action configuration, and internally fetches its items via `RequestStore` and renders them (reusing the existing generic `PreviewSection` rendering shell where practical).
- Extend `showTypeConfig.js` and the `game`/`pc`/`npc` configs under `show_types/configs/` to declare their shortlists (resource type, order, count limit, click action) instead of hardcoding `GamePreviewSections`/`CharacterPreviewSectionsSlot`.
- Remove the now-redundant per-resource preview fetch logic from `GameController`/`CharacterListsController` and the per-resource preview card/helper components once the common component covers their behavior.
- Configure `navigate` for every shortlist resource type (pcs, npcs, treasures, items, documents), building each target show page URL from the current page's route and the clicked resource's id/type; leave the `show picture` action defined but unassigned to any shortlist for now.

## Benefits
- One implementation to maintain for all show-page shortlists instead of one per resource type.
- Adding a shortlist to a new show page becomes a configuration change instead of new code.
- Click behavior becomes consistent and explicit per resource type, instead of being implicitly baked into separate components.
