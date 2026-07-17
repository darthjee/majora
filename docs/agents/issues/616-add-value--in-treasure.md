# Issue: Add value "in treasure"

## Description
Character (PC and NPC) show and edit pages already display `money` via the shared Money component. The API now also exposes `treasure_value` on PC/NPC endpoints, and this value should be surfaced alongside money on the same pages.

## Expected Behavior
### Pages affected
- `/#/games/:game_slug/pcs/:id`
- `/#/games/:game_slug/pcs/:id/edit`
- `/#/games/:game_slug/npcs/:id`
- `/#/games/:game_slug/npcs/:id/edit`

### General rules
- `treasure_value` is added to the existing Money component (no new page section) as a **read-only** display — this issue does not add an edit affordance for it.
- When `treasure_value` is `0`, nothing is rendered for it (no box, no line) — same "hide at zero" behavior the component already uses elsewhere for cascading breakdowns.
- Label text: English `"in Gems"`, Portuguese `"em Gemas"` — new i18n keys, distinct from the existing `money.gp_in_gems` key (which is unrelated: it already labels GP-overflow "gems" entries in the generic cascading money breakdown for non-dnd/deadlands game types).

### D&D
- Rendered as an additional coin-style box alongside the existing CP/SP/GP/PP stack, colored bright red.
- Content follows the same cascading breakdown already used for the Treasure resource's own value (`DndMoneyModel`'s `treasure` context: CP -> SP -> GP, cascading at a max of 10 per denomination, with GP absorbing all remaining value). Only denominations with a non-zero quantity are shown, joined with `" | "`, followed by the `"in Gems"` label.
  - `treasure_value: 2000` -> `20 GP in Gems`
  - `treasure_value: 2020` -> `2 SP | 20 GP in Gems`

### Deadlands
- Rendered in a separate box below the current money box: gold background (instead of the money box's dark green), white text.
- Content: `$ <dollars>,<cents>` computed from `treasure_value` (same cents/dollars split already used by the existing money bill box), followed by the `"in Gems"` label.

## Solution
- Thread `treasure_value` from the PC/NPC API response (already serialized backend-side via `resolve_treasure_value` in `character_detail.py`/`character_list.py`) through `CharacterDetail.jsx`/`CharacterEdit.jsx` into `CharacterMoney`.
- Extend `CharacterMoneyHelper` and its per-game-type renderers (`CharacterMoneyCoins`/`CharacterMoneyBill` or new sibling components) to render the new treasure box per game type, reusing `DndMoneyModel.transform(value, { context: "treasure" })` for the D&D breakdown and `DeadlandsMoneyModel.transformDense` for the Deadlands dollar split.
- Add new `money.*` i18n keys for the `"in Gems"`/`"em Gemas"` label in `en.yaml`/`pt.yaml`, separate from the existing `gp_in_gems` key.
- Add new CSS classes for the bright-red D&D treasure coin box and the gold-background/white-text Deadlands treasure box, as siblings of the existing `.coin-box-*` and `.character-money-bill` classes.
