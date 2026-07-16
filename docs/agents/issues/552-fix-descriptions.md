# Issue: Fix descriptions

## Description
Description-type fields are displayed and edited inconsistently across the app. `pc`/`npc` `public_description` and `private_description` already share components (`CharacterDescriptionHelper`, `CharacterDmNotesHelper`) that render a bordered, `text-pre-wrap` box on show pages, and a shared `TextareaField` component on edit pages. `game.description`, however, is the outlier: on the show page it renders as a bespoke `<p className="text-pre-wrap">` (no box), and on the New/Edit game forms it renders as a single-line `FormField type="text"` input instead of a multi-line textarea.

This issue aligns all five fields — `game.description`, `pc.public_description`, `npc.public_description`, `pc.private_description`, `npc.private_description` — behind one shared show component and one shared edit component, and adds a max-height/expand affordance to the show component that doesn't exist anywhere in the codebase yet.

## Problem
- `game.description` show page (`GameHelper.jsx`) renders as a plain `<p>`, not the bordered box used by `pc`/`npc` descriptions (`CharacterDescriptionHelper.jsx`, `CharacterDmNotesHelper.jsx`).
- `game.description` New/Edit pages (`GameNewHelper.jsx`, `GameEditHelper.jsx`) use `FormField type="text"` (single-line input), while `pc`/`npc` description fields already use the shared multi-line `TextareaField` component. Long game descriptions can't be edited comfortably and lose line breaks.
- No show page has a "max size + expand" affordance for long descriptions — everything currently renders at full height.

## Expected Behavior
### Show pages (`/#/games/:game_slug`, `/#/games/:game_slug/pcs/:id`, `/#/games/:game_slug/npcs/:id`)
- `game.description`, `pc.public_description`, `npc.public_description`, `pc.private_description`, `npc.private_description` all render through one shared "description box" component: bordered box (`p-3 border rounded bg-light`), line breaks preserved via `text-pre-wrap` (matching the current PC private-description pattern).
- The box has a max height. When content overflows, a "Show more" / "Show less" button toggles between the truncated and full view (CSS max-height + overflow, toggled via a Collapse-like mechanism).
- `private_description` continues to render only for users who can already see it today (gated at fetch time via `CharacterController.loadFullCharacter`'s existing `can_edit` check) — no new permission component needed.

### New and Edit pages (`/#/games/:game_slug/edit`, `/#/games/new`, PC/NPC new and edit pages)
- All five fields render as a bootstrap multi-line textarea via the existing shared `TextareaField` component.
- `game.description` on `GameNewHelper.jsx`/`GameEditHelper.jsx` switches from `FormField type="text"` to `TextareaField`, matching how `pc`/`npc` description fields already work.

## Solution
1. Extract a shared show-page "description box" component (bordered box + `text-pre-wrap` + max-height/expand) from the existing `CharacterDescriptionHelper`/`CharacterDmNotesHelper` pattern, and reuse it for `game.description`, replacing `GameHelper.jsx`'s bespoke `<p>`.
2. Add the max-height + "Show more"/"Show less" expand behavior to that shared component (no existing pattern in the codebase to reuse — new UI).
3. Update `GameNewHelper.jsx` and `GameEditHelper.jsx` to render `description` via the existing `TextareaField` component instead of `FormField type="text"`.
4. No changes needed to `pc`/`npc` edit forms (`CharacterDescriptionFieldHelper.jsx`, `CharacterDmNotesFieldHelper.jsx`) — they already use `TextareaField`.
5. No changes to permission gating — reuse the existing fetch-level `can_edit` gating and `ConditionalComponent` pattern as-is; this issue is not about changing permissions.

## Benefits
- Consistent look and behavior for every description field in the app, show and edit alike.
- Long descriptions become readable (multi-line editing) and don't overwhelm show pages (collapsible box).
- Reduces duplicated show-page markup by consolidating on one shared component.
