# Issue: Add Access to Dungeon Master

## Description
A Dungeon Master (DM) should have edit access to the characters (both PCs and NPCs) that belong to a game they are managing. Currently, only the player linked to a character (or a superuser) can edit it. DMs need equivalent access to all characters in their games.

## Problem
- A user who is a DM of a game cannot edit the PCs or NPCs belonging to that game.
- The `can_be_edited_by` logic on `Character` only checks if the requesting user is the character's player or a superuser — it has no awareness of the DM role.

## Expected Behavior
- A DM of a game should be able to edit all PCs belonging to that game.
- A DM of a game should be able to edit all NPCs belonging to that game.
- Characters should have a queryable interface that lists which users can edit them (excluding superusers, who always have implicit access).
- The `can_be_edited_by` validation should check this list (or superuser status).

## Solution
- Extend `Character.can_be_edited_by` to also return `True` if the requesting user is a `GameMaster` of the character's game.
- Introduce a `Character.editors` property (or method) that returns the set of users who have explicit edit access — i.e. the character's player's user (if any) plus all DMs of the character's game. Superusers are intentionally excluded from this list, as their access is implicit and always granted separately.

## Benefits
- DMs can manage all characters in their games without needing superuser privileges.
- Lays groundwork for a future UI that shows editors per character.
- Keeps authorization logic centralized in the model rather than scattered across views.

---
See issue for details: https://github.com/darthjee/majora/issues/116
