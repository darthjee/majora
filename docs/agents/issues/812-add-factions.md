# Issue: Add factions

## Description

We are adding a new concept, **Faction** — something a character can belong to, like a group. A character may belong to 0 or multiple factions.

## Solution

### Routes

- `/#/game/:game_slug/factions` — list page; faction creation happens here via a modal
- `/#/game/:game_slug/factions/:id` — show page
- `/#/game/:game_slug/factions/:id/edit` — edit page

### Data Model

- **Scope**: A Faction belongs to a single Game (FK to `Game`), matching the `/#/game/:game_slug/factions` routes. This differs from `miniatures.Source`, which is a global, deduplicated entity — Factions are not shared/deduplicated across games.
- **Fields**: `name` and a single `photo` (following the `Source`/`SourcePhoto` pattern). No other fields (e.g. no description/lore field) for this issue.
- **Uniqueness**: `name` must be unique per game (two factions in the same game can't share a name; different games can reuse the same faction name).
- **Character relationship**: `Character.factions` is a many-to-many field to `Faction` (a character belongs to 0 or many factions), following the same pattern as `StlModel.sources` (`ManyToManyField`, `related_name='characters'` on the `Faction` side).

### CRUD Scope

- **Create**: via modal from the factions list page, following the `SourceNewModal`/`SourceNewController` pattern.
- **Show**: read-only detail page.
- **Edit**: dedicated edit page. Both `name` and `photo` are editable there.
- **Delete**: not included in this issue, matching `Source`, which has no update/delete endpoint at all. Can be a follow-up issue if needed later.

### Photo Upload

- **Optional**: a faction can be created without a photo, same as `Source`'s nullable `photo` FK.
- **Flow**: follows `Source`'s deferred-upload pattern — the faction record is created first, then the photo is uploaded via the same `UploadClient`/`PhotoUploadSaga`/`PhotoUploadModal` plumbing, initiated from within the creation modal right after the faction is created.
- **Re-upload**: available from both the show page and the edit page.

### Navigation & Listing

- **Nav placement**: add a "Factions" link to the existing "Game" nav dropdown (`HeaderNavHelper.jsx`'s `renderGameNavLinks`), alongside PCs, NPCs, Treasures, Items, and Documents.
- **List page**: reuse the shared `ListPage`/`listTypeConfig` abstraction (the same one backing the NPC/PC list pages) rather than a bespoke page — a grid of factions with standard numbered pagination, plus a name search box. No extra filter dropdowns (e.g. status/allegiance), since factions don't have analogous fields.

### Permissions

Follows the same `EndpointPermission`/YAML-config pattern used for `game_pc_item`/`game_npc_item`:

- **View** (list/show): open to any game participant — no restriction.
- **Create/edit/photo-upload**: "regular" tier — staff and any player of the game (not DM-only), matching Items. Factions has no PC/NPC split, so there's a single permission config (no separate "restricted"/DM-only tier needed).

### Out of Scope

- **Character↔Faction association UI**: how a character actually gets assigned to (or removed from) factions in the UI is deferred to a future issue. This issue only covers Faction CRUD (create/show/edit) and the `Character.factions` model field itself.
- **Delete**: no delete capability for this issue.

## Benefits

Lets players organize characters into meaningful groups, laying the groundwork for faction-based mechanics (alliances, rivalries, faction-scoped content) in future issues.
