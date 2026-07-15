# Issue: Add hidden Npc feature

## Description
The `Character` model already has a `hidden` boolean field (default `false`) in the database, but there is no complete way for a DM/admin to manage it: the Edit NPC form has no control for it at all, the New NPC form has an unstyled checkbox for it (not the requested switch), no read endpoint currently returns its value, and there is no UI indicator anywhere showing that a character is hidden.

## Problem
- The Edit NPC form (`/#/games/:game_slug/npcs/:id/edit`) has no control to view or change the `hidden` field.
- The New NPC form (`/#/games/:game_slug/npcs/new`) has a plain checkbox for `hidden`, not the bootstrap switch requested by this issue, and it is not necessarily positioned below the character portrait.
- No read serializer (detail, list, full, full-list) currently returns the `hidden` field, so a DM/admin has no way to see its current value (e.g. to pre-fill the edit form, or to see it in the "all NPCs" DM view).
- There is no `hidden` query filter on the DM/admin "all NPCs" endpoint.
- There is no UI indicator (info bar icon/tooltip, form preview transparency, list transparency) showing that a character is hidden.

## Expected Behavior
- A DM/admin can toggle "Hidden Character" via a bootstrap switch on both the New and Edit NPC forms.
- Only a DM/admin can see and use that switch.
- A DM/admin can read the current `hidden` value back (edit form pre-fill, and the "all NPCs" DM view) and filter the "all NPCs" list by `hidden`.
- Public-facing NPC endpoints (list and single detail) keep excluding hidden characters and never expose the `hidden` field, exactly as they do today.
- Wherever a character's info bar/tooltip is shown (game page NPC list, NPC list page, NPC detail page), a hidden character shows an "eye-slash-fill" icon with the text "Hidden".
- The character photo dims slightly (~20% transparency) in the form when the switch is on, and hidden characters appear with a slight transparency in character list cards.

## Solution

### Form
- Add a bootstrap switch (`form-switch`/`role="switch"`) labeled "Hidden Character" below the character portrait in both the New NPC form (`/#/games/:game_slug/npcs/new`) and the Edit NPC form (`/#/games/:game_slug/npcs/:id/edit`).
- Restyle/reposition the New NPC form's existing plain checkbox into this switch so both forms are consistent.
- The switch is only rendered/available for DM or admin.
- This is **NPC-only**: even though the Edit form's NPC page reuses a shared `BaseCharacterEditHelper` also used for player characters, the switch must only render for NPCs — never on player character edit forms.

### Endpoints
- `POST /games/:game_slug/npcs.json` — already DM/admin-only (`GameEditPermission` → `Game.can_be_edited_by`) and already accepts `hidden` via `CharacterCreateSerializer`. No change needed.
- `PATCH /games/:game_slug/npcs/:id/full.json` — already DM/admin-only (`CharacterEditPermission` → `Character.can_be_edited_by_roles`) and already accepts `hidden` via `CharacterUpdateSerializer`. No change needed.
- `PATCH /games/:game_slug/npcs/:id.json` — correctly does not accept `hidden` (`NpcPlayerUpdateSerializer`). No change needed.
- `GET /games/:game_slug/npcs.json` — already excludes hidden characters and never returns the field (`CharacterListSerializer`). No change needed.
- `GET /games/:game_slug/npcs/all.json` — already includes hidden characters, but needs `hidden` added to `CharacterFullListSerializer` so the field is actually returned.
- `GET /games/:game_slug/npcs/:id.json` — already excludes hidden characters and never returns the field (`CharacterDetailSerializer`). No change needed.
- `GET /games/:game_slug/npcs/:id/full.json` — already DM/admin-only, but needs `hidden` added to `CharacterFullSerializer` so the field is actually returned.

### Filters
- Add a `hidden` query filter to the shared `_filter_characters` helper, applied only from `GET /games/:game_slug/npcs/all.json` (DM/admin-only "all NPCs" list), following the same pattern as the existing `slain`/`allegiance` filters.

### UI indicators
- Add a new `eye-slash-fill` bootstrap icon to the icon registry, and a new "hidden" badge to the existing `CharacterStatusBadges`/`InfoBarRules`/`TooltipBadge` mechanism, so it renders wherever the info bar already does today (game page NPC list, NPC list page, NPC detail page): icon "eye-slash-fill", text "Hidden". Since the existing `TooltipBadge`/`InfoBadgeList` components only support Bootstrap's predefined text-color variants, extend them to support an exact custom color so this badge can render at `#dedede`.
- In the form, apply ~20% transparency to the character photo preview when the switch is toggled on, following the existing `.photo-grayscale`/`ActionsOverlay` conditional-class pattern.
- In the DM/admin "all NPCs" list view (the only list where hidden NPCs are ever visible, since public NPC lists filter them out server-side), apply a slight transparency to hidden characters' photos, following the same pattern.

## Benefits
- DMs/admins can fully manage hidden NPCs (create, edit, filter, and see the current value) without needing direct database access.
- Players and DMs get a clear visual signal wherever a hidden NPC appears in DM/admin views, avoiding confusion.
