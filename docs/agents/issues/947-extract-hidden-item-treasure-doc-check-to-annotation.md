# Issue: Extract hidden item/treasure/Doc check to annotation

## Description
Several endpoints resolve a path-scoped entity — Character/NPC, GameItem, GameTreasure, or GameDocument — that may be hidden, and must 404 when it is (e.g. `GET /games/:game_slug/npcs/:character_id/items.json` 404s if the NPC is hidden). This check is currently duplicated and inconsistently implemented across the codebase: partially unified for `Character` via the `@check_hidden` decorator (issue #946), but reimplemented separately for `GameTreasure`, and handled ad hoc/inline for `GameItem` and `GameDocument`.

## Problem
- `@check_hidden` (`backend/games/views/game/_decorators.py`) only handles `Character`; ~36 call sites still thread a `check_hidden` kwarg through `_character_shared.py` and related view-building code.
- `GameTreasure` reimplements its own `_hidden_gate_response` in `games/game_treasure_detail.py`, duplicating the character version's logic for a different model.
- `GameItem` hidden-gating happens ad hoc inside `_find_game_item` (`_item_exchange.py`), not via a shared decorator.
- `GameDocument` hidden-gating is inline, not through the decorator either.
- Bug: `character_item_acquire` (`_item_exchange.py:60-84`) resolves the NPC via `_get_character_or_404`, which only checks existence — it never gates on `character.hidden`. Only the `GameItem` is gated. So acquiring an item from a hidden NPC currently succeeds as long as the item itself isn't hidden, inconsistent with every other NPC-scoped endpoint. No test covers this hidden-NPC case.

## Expected Behavior
- A hidden-gate check for any of `Character`, `GameItem`, `GameTreasure`, `GameDocument` resolved from a URL path segment behaves consistently: 404 (preserving the existing `X-Skip-Cache` header behavior) when the entity is hidden and the requester cannot edit it.
- `items/acquire.json` gates on both the NPC and the GameItem being non-hidden (fixing the current bug).

## Solution
- Generalize `@check_hidden` (`backend/games/views/game/_decorators.py`) to be parameterized per entity kind, e.g. `@check_hidden('character')`, `@check_hidden('item')`, `@check_hidden('treasure')`, `@check_hidden('document')`, each resolving its entity from the relevant URL kwarg(s) and applying the existing hidden-gate response logic.
- Decorators compose by stacking: view functions that need multiple entities gated (like `character_item_acquire`) stack one decorator per entity kind instead of requiring a new multi-entity mechanism.
- Replace the duplicated/ad-hoc implementations with the shared decorator:
  - `GameTreasure`'s hand-rolled `_hidden_gate_response` in `games/game_treasure_detail.py`.
  - `GameItem`'s ad hoc check inside `_find_game_item` (`_item_exchange.py`).
  - `GameDocument`'s inline `check_hidden`-gated checks.
- Fix `character_item_acquire` to gate on NPC hidden state as well as item hidden state, by stacking both decorators.
- Add a test covering the hidden-NPC 404 case for `items/acquire.json` (existing coverage only tests the hidden-item case).

## Benefits
- Removes duplicated/ad-hoc hidden-check logic across Character/GameItem/GameTreasure/GameDocument endpoints (~36 call sites plus 2 hand-rolled reimplementations), reducing code volume and the amount of context an AI agent needs to read and reason about when working on these views.
- Fixes an inconsistency where hidden NPCs could still have items acquired from them.
- Establishes one consistent, reusable pattern for any future path-scoped entity that needs the same hidden-check behavior.
