# Issue: Add acquire treasure

## Description
Characters can currently only view the game's treasure catalog; they have no way to own treasure. We need a character-treasure ownership connection with a quantity, plus UI for players/DMs to acquire (buy) and sell treasure, exchanging money for it (per #311's GP breakdown for value display).

## Problem
- There is no model connecting a `Character` to a `Treasure` with an owned quantity.
- The character detail page has no section showing owned treasures.
- There is no dedicated full-list page for a character's treasures.
- There is no way for a player/DM to spend a character's money to acquire treasure, or convert owned treasure back into money.

## Expected Behavior
- A character can own zero or more units of any game treasure (a `CharacterTreasure`-style connection with a quantity).
- **Character detail page**: shows the first 6 owned treasures (quantity > 0). Each is rendered like a treasure card, with an overlay in the top-right corner showing `x<quantity>` when quantity is greater than 1 (omitted when quantity is 1), and the value of a single unit shown at the bottom (using the #311 GP breakdown). A link below leads to the full list.
- **Full treasure list page**: reachable at `/#/games/:game_slug/pcs/:character_id/treasures` (PC) or `/#/games/:game_slug/npcs/:character_id/treasures` (NPC), following the same routing convention as the existing character photos pages. Shows all owned treasures using the same card style (quantity overlay + unit value) as the character page section.
- **Visibility**: PC treasure lists are visible to anyone. NPC treasure lists follow the same hidden-NPC gate already used for NPC photos/details — visible to anyone unless the NPC is hidden, in which case only the game's GameMasters or a superuser can see it.
- **Acquiring/selling rights**: only users who can already edit the character — its owning player, any GameMaster of the game, or a superuser (`Character.can_be_edited_by`) — may open the add-treasure modal and acquire or sell treasure. Anyone permitted to view the list can view it.
- **Add treasure button**: shown on the full list page (to users with the rights above), opening a modal with two tabs:
  - **Acquire tab**: a paginated browser (pagination does not change the page URL) of the game's treasures, limited to treasures the character can afford at least one unit of (`treasure.value <= character.money`). Selecting a treasure shows a larger image on the left, its name and value, how many the character already owns, and a quantity input (default 1). Confirming adds the quantity to the owned amount (creating the ownership record if this is the first unit) and deducts `quantity × value` from the character's money.
  - **Sell tab**: a paginated browser, limited to treasures the character currently owns (quantity > 0). Selecting one shows the same detail view plus a quantity-to-sell input (default 1, capped at the owned quantity). Confirming subtracts the quantity from the owned amount and adds `quantity × value` back to the character's money.
- **Zeroed-out ownership**: when quantity reaches 0 (selling all units), the `CharacterTreasure` record is **kept**, not deleted — it just no longer appears in any list, since every list (character page section, full list page, sell tab) filters on `quantity > 0`. This preserves history and avoids recreating the row from scratch if the character re-acquires the same treasure later.

## Solution
- Add a `CharacterTreasure` model: FKs to `Character` and `Treasure`, a positive-integer `quantity`, unique together on (character, treasure).
- Add serializers/views/routes for: listing a character's owned treasures (used by both the character page section and the full list page), and for acquiring/selling (quantity delta + money transfer in one atomic operation, re-validating affordability / owned quantity server-side regardless of what the frontend filtered).
- Reuse the existing PC/NPC route-and-visibility pattern (as used for character photos) for the new `.../treasures` routes, including the hidden-NPC gate.
- Reuse the existing paginated-list pattern (as used by `game_treasures`) for both the full list page and the two modal tabs.
- Frontend: new character-page section, new PcCharacterTreasures/NpcCharacterTreasures pages (mirroring PcCharacterPhotos/NpcCharacterPhotos), and a new two-tab acquire/sell modal.
- Value displayed anywhere in this feature uses the #311 GP/SP/CP breakdown, not a raw number.

## Benefits
- Players and DMs can track and manage the treasure a character owns, not just the game's treasure catalog.
- Money and treasure become interchangeable in-game currency, enabling looting and trading gameplay.
