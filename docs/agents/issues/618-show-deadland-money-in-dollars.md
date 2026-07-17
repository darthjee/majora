# Issue: Show deadland money in dollars

## Problem
D&D character pages already show money through a dedicated coin-box display (`CharacterMoneyCoins`). Deadlands character pages currently fall back to the generic cascading breakdown text instead of having an equivalent dedicated display.

This only affects the character money display on character/NPC pages — not treasure or treasure acquisition — and is a display-only change; the underlying money value and its cents/dollars breakdown logic are unchanged.

## Expected Behavior
Render a dark-green, dollar-bill-styled box showing, in order: the coins icon, a `$` sign, and the dollar/cent composition separated by a comma, with cents zero-padded to two digits.

Examples (money stored as total cents):
- `10002` → `$ 100,02`
- `10000` → `$ 100,00`
- `10010` → `$ 100,10`

Unlike the generic breakdown (which renders nothing at 0), this box always renders, even when money is `0` (shown as `$ 0,00`) — matching the D&D coin boxes, which always show all four denominations including zeros.

No specific color/hex was mandated; a reasonable dark green, styled as a simple bordered rectangle similar in spirit to the existing coin-box style, is acceptable.

Affected pages:
- `/#/games/:game_slug/pcs/:id`
- `/#/games/:game_slug/pcs/:id/edit`
- `/#/games/:game_slug/npcs/:id`
- `/#/games/:game_slug/npcs/:id/edit`

## Solution
Create a dedicated component for the Deadlands character money display (parallel to the existing `CharacterMoneyCoins` component used for `dnd`), and wire it into `CharacterMoneyHelper.render` (`frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyHelper.jsx`) for `gameType === 'deadlands'`, replacing the generic breakdown fallback currently used for that game type.

The component should reuse the existing `coins.svg` icon (already available via the `.coin-icon` CSS class).
