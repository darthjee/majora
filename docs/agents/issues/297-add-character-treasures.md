# Add character treasures

## Context

There is currently no relationship between `Character` and `Treasure` — a character has no way to hold treasures with a quantity. There is also no precedent in the codebase for a through-model with a quantity field (the only existing `Game` <-> `Treasure` link is a plain many-to-many with no extra attributes), so this needs a new model and new endpoints.

## What needs to be done

- Backend: add a new `CharacterTreasure` through model (`character` FK, `treasure` FK, `quantity` non-negative integer field, default 0). Add read endpoints mirroring the existing nested PC/NPC pattern in `source/games/urls.py` (e.g. `games/<slug>/pcs/<id>/treasures.json` and `games/<slug>/npcs/<id>/treasures.json`) returning the character's treasures with quantity (and value for the full-list variant). Reuse existing character-visibility permission checks for these endpoints — no new permission logic.
- Frontend: add a treasure preview section to the character detail page (`CharacterHelper.jsx`), mirroring `CharacterPreviewSectionHelper.jsx`'s slice-and-"see all"-link pattern (new limit constant of 12, since the existing `MAX_PREVIEW_CHARACTERS` constant is a different, unrelated limit of 6 used for a different preview). Add a new full-list page/route (`/#/games/:game_slug/pcs/:character_id/treasures` and NPC equivalent) mirroring the existing `GameTreasures.jsx` paginated list pattern, showing name, quantity, and value.
- This issue covers the data model and read-only display only. Creating, editing, or removing a character's treasure assignments is out of scope here and will be handled by a future issue (e.g. via Django admin for now).

## Acceptance criteria

- [ ] A character can be linked to any number of treasures, each with its own non-negative integer quantity (zero is a valid, storable quantity), via a new `CharacterTreasure` through model.
- [ ] The character page (`/#/games/:game_slug/pcs/:character_id` and the NPC equivalent) shows a short preview list of up to 12 of the character's treasures, each showing name and quantity, mirroring the existing PC/NPC preview-list-with-"see all"-link pattern used on the game page.
- [ ] The preview list includes a link to a full list page showing all of the character's treasures, each showing name, quantity, and value.
- [ ] Visibility of a character's treasures (in both the preview and full list) follows the same rules as viewing the character itself — no additional restriction.
- [ ] Creating, editing, or removing a character's treasure assignments is out of scope for this issue.

---
tags: :shipit:
