# Issue: Unify list page patterns (PCs, NPCs, Treasures)

## Description
Prepare the app's list pages (PCs, NPCs, Admin Treasures, PC/NPC treasures, PC/NPC photos) for future unification by introducing shared abstractions on top of what already exists: a generic index-list component, a per-type mapping object, and a per-entity wrapper object. This issue is about laying the groundwork, not merging the pages' code yet.

As part of this preparation, also make a small, independent UI fix: move the "hidden" text off the treasure hidden badge on the admin treasures page into a tooltip.

## Problem
- List pages already share some code per resource type (e.g. `GameCharactersHelper` for PCs/NPCs; `CharacterTreasures`/`CharacterPhotos` with base controllers shared between PC and NPC variants), but there is no cross-resource, data-driven pattern. Adding a new list type today means duplicating data-fetching, pagination wiring, and per-item rendering rather than reusing one generic component.
- On the admin treasures page (`/#/games/:game_slug/treasures`), the hidden badge shows an icon **and** the visible text "hidden" next to it, unlike other status badges in the app (e.g. NPC status badges) which use a hover tooltip instead of inline text.

## Expected Behavior
- A new shared "index list" component owns data fetching and pagination, and accepts a `type` to select per-type configuration.
- A mapping object defines, per type: endpoint(s), texts, filters, actionbar/infobar components, whether caption text appears under the photo, and click behavior.
- A wrapper object per entity type (Treasure, NPC, PC) normalizes each list entry (photo url, display text, any needed transformation) and exposes what Infobar/Actionbar need.
- Existing Infobar and Actionbar continue to appear as they do today on every affected page — this issue does not redesign them, only prepares the surrounding structure.
- Infobar/Actionbar items that are conditional carry their own gating logic, so Infobar/Actionbar don't need to know the conditions themselves.
- On the treasures page, the hidden badge shows only the icon; the word "hidden" appears as a tooltip on hover instead of inline text (NPCs already show their hidden badge this way via `TooltipBadge`, since #547 — no change needed there).

## Solution
- Introduce a shared index-list component responsible for: fetching data, pagination, and delegating per-type behavior to a mapping object based on a `type` prop.
- Introduce a mapping object as a **plain object literal keyed by type** (e.g. `LIST_TYPE_CONFIG = { pcs: {...}, npcs: {...}, treasures: {...} }`), matching the existing `PHOTO_COMPONENTS = { avatar: CardAvatar, treasure: CardTreasureImage }` precedent in `ActionsOverlay.jsx`. Each entry supplies: endpoint(s) (including an authorized/admin-visible variant where applicable), display texts, filters, actionbar components, infobar components, whether caption text is shown under the photo, and click behavior. Pure config, no behavior.
- Introduce a wrapper object as a **base class extended per entity type** (e.g. `BaseListItem` extended by `TreasureListItem`, `PcListItem`, `NpcListItem`), matching the existing `BaseCharacterTreasuresController` → `PcCharacterTreasuresController`/`NpcCharacterTreasuresController` precedent. The base class holds shared methods (photo url, display text); subclasses override/add what's specific to that entity (e.g. treasure value transformation, or whatever Infobar/Actionbar need for that type).
- Give conditionally-shown Infobar/Actionbar items their own internal gate-logic (as part of the component/class for that item), instead of centralizing those checks in Infobar/Actionbar.
- On `TreasureCardHelper`'s hidden badge, replace the plain `Badge` (icon + visible text) with `TooltipBadge` (icon + hover tooltip), matching the pattern already used for NPC status badges.

### Affected pages
- PCs list page `/#/games/:game_slug/pcs`
- NPCs list page `/#/games/:game_slug/npcs`
- Admin treasures page `/#/treasures`
- PCs treasures list page `/#/games/:game_slug/pcs/:id/treasures`
- NPCs treasures list page `/#/games/:game_slug/npcs/:id/treasures`
- PCs photos list page `/#/games/:game_slug/pcs/:id/photos`
- NPCs photos list page `/#/games/:game_slug/npcs/:id/photos`

### Limited scope
This issue is about adjusting shared patterns in preparation for unification — it does not merge the pages' code yet.

## Benefits
Establishes a common, data-driven pattern (shared list component + mapping object + wrapper object) so that new list pages can be built by adding configuration rather than duplicating page logic, and existing list pages can be migrated onto it incrementally later.
