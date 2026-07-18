# Issue: Enhance character money and treasure visual

## Description
On Character (PC/NPC) show and edit pages, the money and treasure value are each rendered through a dedicated per-game-type component pair on the character detail column:
- D&D: a stack of coin boxes (CP/SP/GP/PP, rendered by `CharacterMoneyCoinsHelper`) followed by the treasure box (`CharacterMoneyTreasureBox` / `CharacterMoneyTreasureBoxHelper`).
- Deadlands: a single dollar bill (`CharacterMoneyBillHelper`) followed by the treasure bill (`CharacterMoneyTreasureBill` / `CharacterMoneyTreasureBillHelper`).

All of these boxes/bills currently reuse the same `coin-icon` CSS class (a coins.svg mask icon) for their leading icon, and size themselves with `width: fit-content`, so each box's rendered width simply follows its own text content length, independent of its siblings.

## Problem
### For D&D
- The CP/SP/GP/PP coin boxes and the treasure box below them all end up with different widths (the treasure box is typically the widest, since it appends the "in gems" label), so the stack looks visually misaligned.
- The treasure box's icon is the same coins icon used by the money boxes, when it should be a Bootstrap gem icon instead.

### For Deadlands
- The dollar bill and the treasure bill below it end up with different widths, for the same reason as D&D.
- The treasure bill's icon is the same coins icon used by the money bill, when it should be a Bootstrap gem icon instead.

## Expected Behavior
- The treasure box (D&D) and treasure bill (Deadlands) use the Bootstrap gem icon (`bi-gem`, already mapped in `Icons.js` and already used for treasures elsewhere, e.g. `CharacterTreasuresPreviewHelper`) instead of the coins icon. The plain money boxes/bill keep their current coins icon. No other styling changes (colors, borders, backgrounds) for either variant.
- D&D: the CP/SP/GP/PP coin boxes and the treasure box are all rendered at one uniform width — the widest among that character's own coin boxes and treasure box — so the whole stack's edges align.
- Deadlands: the money bill and the treasure bill are rendered at one uniform width — the wider of the two — so their edges align.
