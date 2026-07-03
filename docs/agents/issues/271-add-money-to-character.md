# Issue: Add money to character

## Description
A `Character` should track its money as a single integer field representing the total value held in copper coins (the smallest denomination). The frontend converts that raw copper total into a breakdown of coin denominations for display, following the rules and worked examples below.

## Problem
Characters currently have no way to track in-game wealth. There is no `money` field on the `Character` model, no way to view or edit it, and no display logic to convert a raw copper total into the platinum/gold/silver/copper/gems breakdown players expect from a D&D-style coinage system.

## Expected Behavior
### Model
- `Character` gets a new non-negative integer field `money`, representing the total amount of copper pieces (CP) the character holds. Default `0`. Negative values are rejected (model/serializer validation), similar to how `Link`/`Upload` already use non-negative integer fields elsewhere in the codebase.
- `money` is visible to anyone who can view the character (same visibility as `public_description`/photos — no restriction).
- `money` is editable by the same users who can already edit the character (its player or a DM of the game), via the existing character edit form.

### Coin denominations
There are 4 coin types plus gems, all expressed in terms of copper:
- platinum (PP) — worth 10 gold
- gold (GP) — worth 10 silver
- silver (SP) — worth 10 copper
- copper (CP) — base unit
- gems — special overflow value, shown as "<N> GP in gems"

### Displaying values
On the character show page, money is rendered by a dedicated component (not as a raw number). The raw copper total is transformed so that no coin type (other than gems) ever shows a quantity of 30 or more — any excess above 29 of a denomination cascades up into the next denomination, and any excess left over after platinum is converted into gems (expressed as "GP in gems").

Denominations with a quantity of 0 are omitted from the display (see examples below).

#### Transformation algorithm
Per-denomination step (applied first for copper, then silver, then gold):
```javascript
money  = character.money
if (money > 29) {
  copper = money % 10 + 20
  money = Math.floor(money / 10) - 2
} else {
  copper = money
  money = 0
}
```
After the platinum step, any remaining `money` (still in "next denomination above platinum" units) is converted directly into gems, worth `money * 100` GP in gems (no 29-cap applied to gems).

#### Examples of transformation
| `money` | Display |
|---|---|
| 1 | 1 CP |
| 10 | 10 CP |
| 30 | 20 CP \| 1 SP |
| 310 | 20 CP \| 29 SP |
| 320 | 20 CP \| 20 SP \| 1 GP |
| 332 | 22 CP \| 21 SP \| 1 GP |
| 32220 | 20 CP \| 20 SP \| 20 GP \| 20 PP \| 100 GP in gems |
| 32221 | 21 CP \| 20 SP \| 20 GP \| 20 PP \| 100 GP in gems |

### Location
The money component is displayed on the left side of the character show page (`CharacterHelper.jsx`), alongside the existing photo/name/links column (the `col-md-4` column), not the role/description column.

### Editing
The character edit form (`CharacterEdit.jsx` / `BaseCharacterEditHelper.jsx`, shared by NPC and PC edit pages) gets a new numeric input for `money`, following the same `FormField`/`fieldErrors` pattern as the other fields, wired through `CharacterUpdateSerializer`.

### Translations
Coin names need English and Portuguese translations, added to `frontend/assets/i18n/en.yaml` and `pt.yaml`:

| Key | English | Portuguese |
|---|---|---|
| platinum coin(s) | platinum coin(s) | moeda(s) de platina |
| gold coin(s) | gold coin(s) | moeda(s) de ouro |
| silver coin(s) | silver coin(s) | moeda(s) de prata |
| copper coin(s) | copper coin(s) | moeda(s) de cobre |
| platinum piece(s) | platinum piece(s) | peça(s) de platina |
| gold piece(s) | gold piece(s) | peça(s) de ouro |
| silver piece(s) | silver piece(s) | peça(s) de prata |
| copper piece(s) | copper piece(s) | peça(s) de cobre |
| gems | gems | gemas |
| GP in gems | GP in gems | PO em gemas |
| PP (abbreviation) | PP | PL |
| GP (abbreviation) | GP | PO |
| SP (abbreviation) | SP | PP |
| CP (abbreviation) | CP | PC |

## Solution
- Add a non-negative `money` integer field to the `Character` model (default `0`), with a migration.
- Expose `money` (read) on `CharacterDetailSerializer`/`CharacterFullSerializer` and (write) on `CharacterUpdateSerializer`.
- Add a frontend transformation utility/class implementing the cascading coin-denomination algorithm above.
- Add a new dedicated component to render the coin breakdown, wired into `CharacterHelper.jsx` on the left side of the character show page (alongside photo/name/links).
- Add a numeric `money` input to `BaseCharacterEditHelper.jsx` (shared NPC/PC edit form), following the existing `FormField`/`fieldErrors` pattern.
- Add the coin name/abbreviation translation keys to `en.yaml` and `pt.yaml`.

## Benefits
- Characters can track in-game wealth consistently with standard D&D-style coinage (platinum/gold/silver/copper + gems overflow).
- Players and DMs get an at-a-glance, human-friendly breakdown instead of a raw copper count.
