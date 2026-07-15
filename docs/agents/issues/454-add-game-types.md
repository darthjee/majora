# Issue: Add game types

## Description
Games currently have no way to record which tabletop system/ruleset they use. We are adding a `game_type` field so games can be categorized, starting with D&D and Deadlands.

## Problem
There is no field on `Game` to distinguish which tabletop system a game belongs to. As support for more systems is added (starting with Deadlands), there is nowhere to record this choice.

## Expected Behavior
- The game creation form includes a dropdown to select the game type.
- Dropdown options and their stored values:

| database value | value in the UI |
| ---------------- | ---------------- |
| dnd | D&D |
| deadlands | Deadlands |

- The UI labels are not translated.
- The game type is chosen only on the game creation form; it is fixed once the game is created (no edit form/UI to change it afterwards).
- The game type is not shown anywhere in the UI besides the creation form, but is included in the game detail API response for other consumers.
- Existing games are migrated with a default value of `dnd`.

## Solution
- Add a `game_type` field to the `Game` model (CharField, max_length=16, with choices), following the existing choices-field convention used by `Character.allegiance` (backend/games/models/character/character.py).
- Migration adds the field with default `dnd` so existing rows are backfilled.
- Update `GameCreateSerializer` to accept `game_type`.
- Update `GameDetailSerializer` to include `game_type` in its output. `GameUpdateSerializer` and `GameListSerializer` are left unchanged, since the type is fixed at creation and not shown in list views.
- Add a dropdown/select to the game creation form (GameNewHelper.jsx / GameNewController.js), with untranslated option labels.

## Benefits
- Lets the app categorize games by tabletop system.
- Lays the groundwork for supporting additional systems beyond D&D and Deadlands in the future.
