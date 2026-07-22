# Issue: Extract common page layout component

## Description
For list/index pages (like `/#/games`, `/#/games/:game_slug/pcs`, etc.), a common `ListPage` component already exists (`frontend/assets/js/components/common/list_page/`), driven by a per-resource-type config registry (`listTypeConfig`). Each type config declares things like the fetch function, card wrapper class, filters component, photo type, and builders for action-bar/info-bar content — the page itself only wires up `<ListPage type="..." basePath="..." />`.

We want to apply the same pattern to show (detail) pages, so that show pages share one layout component and configuration mechanism instead of each hand-rolling its own left/right layout. Today this sharing is done only partially and ad hoc: `CharacterDetail`/`CharacterHelper` is shared between `PcCharacter` and `NpcCharacter`, `PlayerDetail` mirrors that same plumbing for the player page, and `ItemDetailHelper` shares rendering (but not the page/controller shell) across `GameItem`, `PcCharacterItem`, and `NpcCharacterItem`. There is no generic `type`-keyed config registry for show pages the way `listTypeConfig` exists for list pages.

## Problem
We want the same "shared layout + per-type configuration" approach used for list pages, in order to have more concise code and a consistent feel between show pages.

## Expected Behavior
Similar to list pages, a per-type configuration should tell the shared show-page component:
- URL for the base data — both the full (privileged) and public URLs
- Submit URLs (full and regular), where applicable
- Info badge components to show in the info bar
- Action buttons to show in the action bar
- Any other per-resource visual behavior, such as the transparency (dimming) applied to hidden characters' photos
- Components to add to the left side
- Components to add to the right side
- Components to add to the bottom (such as the character photos preview shown at the end of the character show page)

The same configuration mechanism covers "new" and "edit" pages, not just read-only show pages. Each slot (left, right, bottom) can declare either a read (display) component or a field (form input) component, so pages like `/#/games/new` or `/#/games/:game_slug/npcs/new` plug into the same shared layout/config instead of hand-rolling their own form layout, even where today they are a plain single-column form (e.g. games, treasures) or already use a left/right split with field components (e.g. NPC creation).

### Layout
Show, new, and edit pages are split into a left and right side, with the left side narrower:

- **Left**: photo (or photo field) component on top, followed by components defined by configuration (e.g. info badges, action buttons on show pages), then any other left-side components from configuration.
- **Right**: all other components defined by configuration for the right side.
- **Bottom**: components defined by configuration render below the left/right split (e.g. `CharacterPhotosPreview`).

Each configured component is responsible for its own show/hide logic (whether it renders at all); a wrapper component can be used for this if needed. Pages with no natural left/right content (e.g. a simple single-field form) can configure an empty/absent side.

## Solution
Introduce a generic `ShowPage` component plus a `showTypeConfig` registry, mirroring the existing `ListPage` / `listTypeConfig` pattern, so each affected page only wires up `<ShowPage type="..." .../>` instead of hand-rolling its own left/right layout. This mechanism covers show, new, and edit pages for each resource type.

This generalizes work that already exists in a narrower form:
- `CharacterDetail` / `CharacterHelper` (shared between `PcCharacter` and `NpcCharacter`)
- `PlayerDetail` (mirrors the same loading/error/effect/back-link plumbing for the player page)
- `ItemDetailHelper` (shares rendering across `GameItem`, `PcCharacterItem`, `NpcCharacterItem`, but without a shared page/controller shell)
- `GameNpcNewHelper` (already voluntarily uses the same left/right split as the show page, with field components instead of read-only display components)

As part of this work, fix an existing inconsistency: today `characterListTypes.js` sets both `grayscale` (slain) and `dimmed` (hidden) when building NPC action-bar props for the list page, but the NPC/PC show page (`CharacterAvatarHelper.render`) only passes `grayscale` — hidden NPCs are not currently dimmed on their own show page. The shared show-page config should apply `dimmed` consistently wherever a hidden character's photo is rendered (show, new, and edit).

All pages/routes listed below are migrated to the shared `ShowPage` component and `showTypeConfig` registry as part of this issue.

### Affected Pages
- `/#/games/new`
- `/#/games/:game_slug`
- `/#/games/:game_slug/edit`
- `/#/games/:game_slug/treasures/new`
- `/#/games/:game_slug/treasures/:id`
- `/#/games/:game_slug/treasures/:id/edit`
- `/#/games/:game_slug/items/new`
- `/#/games/:game_slug/items/:id`
- `/#/games/:game_slug/items/:id/edit`
- `/#/games/:game_slug/pcs/:id`
- `/#/games/:game_slug/pcs/:id/edit`
- `/#/games/:game_slug/npcs/new`
- `/#/games/:game_slug/npcs/:id`
- `/#/games/:game_slug/npcs/:id/edit`
- `/#/games/:game_slug/pcs/:character_id/items/new`
- `/#/games/:game_slug/pcs/:character_id/items/:id`
- `/#/games/:game_slug/pcs/:character_id/items/:id/edit`
- `/#/games/:game_slug/npcs/:character_id/items/new`
- `/#/games/:game_slug/npcs/:character_id/items/:id`
- `/#/games/:game_slug/npcs/:character_id/items/:id/edit`

### Permissions
No change in permissions.

### Frontend Only
This is a pure frontend refactor / standardization; no changes to endpoints, backend, or proxy.

## Benefits
- Concise, consistent code and feel across all show, new, and edit pages, matching the pattern already used for list pages
- Fixes an existing inconsistency where hidden NPCs are dimmed on the list page but not on their own show/new/edit pages
- Reduces per-page boilerplate for wiring up loading/error state, layout, and action/info bars
