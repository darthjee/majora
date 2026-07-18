# Plan: Enhance character money and treasure visual

Issue: [646-enhance-character-money-and-treasure-visual.md](../../issues/646-enhance-character-money-and-treasure-visual.md)

## Overview

This is a pure frontend visual fix, entirely within the `frontend` agent's scope — no backend, proxy, or infra changes. Two independent tweaks to the character money/treasure display:

1. Swap the `coin-icon` (coins.svg mask) for the Bootstrap `bi-gem` icon on the two treasure variants only (`CharacterMoneyTreasureBoxHelper` for D&D, `CharacterMoneyTreasureBillHelper` for Deadlands), leaving the plain money boxes/bill on the coins icon.
2. Make sibling money/treasure boxes share one uniform width per game type, instead of each sizing independently to its own `fit-content` text.

## Context

- D&D renders a stack of `CharacterMoneyCoinBox` (CP/SP/GP/PP) followed by `CharacterMoneyTreasureBox`, all inside a single `.character-money-coins` wrapper (`CharacterMoneyCoinsHelper.jsx`).
- Deadlands renders `CharacterMoneyBill`'s money div followed by `CharacterMoneyTreasureBill`, currently as two siblings inside a bare React Fragment with **no shared wrapper div** (`CharacterMoneyBillHelper.jsx`).
- All of these boxes currently use `<span className="coin-icon" aria-hidden="true"></span>` (CSS mask-image icon, `main.scss:154-168`) and size via `width: fit-content` (`.coin-box` at `main.scss:177-186`, `.character-money-bill` at `main.scss:216-228`), which is why sibling boxes end up different widths — width simply follows each box's own text length.
- The app already has a Bootstrap gem icon convention: `Icons.gem` (`bi-gem`, `frontend/assets/js/utils/ui/Icons.js:8`), rendered elsewhere as `<i className={\`bi ${icon}\`} aria-hidden="true"></i>` (see `SeeAllCardHelper.jsx`).
- Per discussion: keep all existing colors/borders/backgrounds unchanged (red D&D treasure text, gold-background/white-text Deadlands treasure) — only the icon glyph and the width behavior change.

## Implementation Steps

### Step 1 — Swap the treasure icon to `bi-gem`

In both `CharacterMoneyTreasureBoxHelper.jsx` and `CharacterMoneyTreasureBillHelper.jsx`:
- Import `Icons` from `../../../../../../utils/ui/Icons.js`.
- Replace `<span className="coin-icon" aria-hidden="true"></span>` with `<i className={\`bi ${Icons.gem}\`} aria-hidden="true"></i>`.

Do **not** touch the plain money icon spans in `CharacterMoneyCoinBox` (or its helper) or `CharacterMoneyBillHelper.jsx` — those keep the coins icon.

### Step 2 — Size the gem icon to match the coin icon

Bootstrap icons are font-glyph based (sized via `font-size`), while `.coin-icon` is a fixed `1em` mask box — so the existing `.coin-box .coin-icon { font-size: 1.1rem }` / `.character-money-bill .coin-icon { font-size: 1.1rem }` rules (`main.scss:188-190`, `230-232`) won't target the new `<i>` element. Add equivalent sizing selectors targeting the gem icon specifically, e.g.:

```scss
.coin-box-treasure .bi-gem {
  font-size: 1.1rem;
}

.character-money-bill-treasure .bi-gem {
  font-size: 1.1rem;
}
```

Verify visually (or via existing spec snapshot expectations) that the gem glyph reads at the same visual weight as the coin icon did.

### Step 3 — Equalize widths for the D&D coin stack

Change `.character-money-coins` (`main.scss:170-175`) from `display: flex; flex-direction: column` to a single-column CSS grid, which auto-sizes the (implicit) column to the widest child and stretches all children to that width by default:

```scss
.character-money-coins {
  display: grid;
  grid-template-columns: max-content;
  gap: 0.35rem;
  margin-bottom: 1rem;
}
```

Remove `width: fit-content` from `.coin-box` (`main.scss:177-186`) so the box stretches to fill its grid column instead of shrinking to its own content. `align-items: center` and the other flex properties on `.coin-box` itself stay — `.coin-box` remains a flex row internally for its icon+text, it's just no longer flex-column-sized by its grid parent.

This makes all four `CharacterMoneyCoinBox` instances and the trailing `CharacterMoneyTreasureBox` share one width — the widest among them (typically the treasure box, due to the "in gems" suffix).

### Step 4 — Add a wrapper and equalize widths for the Deadlands bill pair

`CharacterMoneyBillHelper.render` (`CharacterMoneyBillHelper.jsx:24-33`) currently returns a bare Fragment with two sibling divs — there's no shared container to apply the same grid trick to. Wrap both in a new container div with a dedicated class:

```jsx
return (
  <div className="character-money-bill-group">
    <div className="character-money-bill">
      ...
    </div>
    <CharacterMoneyTreasureBill treasureValue={treasureValue} />
  </div>
);
```

Add the matching CSS, mirroring Step 3:

```scss
.character-money-bill-group {
  display: grid;
  grid-template-columns: max-content;
}
```

Remove `width: fit-content` from `.character-money-bill` (`main.scss:216-228`) so both the money bill and the treasure bill stretch to the shared column width. Keep `margin-bottom: 1rem` — move it from `.character-money-bill` to `.character-money-bill-group` if needed so the outer spacing after the pair is preserved (currently `.character-money-bill` alone carries `margin-bottom: 1rem`, but with two stacked bills that margin should apply once, after the pair, not between them).

### Step 5 — Update/extend specs

- `CharacterMoneyTreasureBoxHelperSpec.js` / `CharacterMoneyTreasureBillHelperSpec.js`: these currently assert the `coin-icon` class is reused — update both to assert the `bi-gem` icon (via `Icons.gem`) is rendered instead, and that `coin-icon` is no longer present on the treasure variant.
- `CharacterMoneyBillHelperSpec.js` / `CharacterMoneyBillSpec.js`: update to expect the new `.character-money-bill-group` wrapper div around the money + treasure bill pair.
- `CharacterMoneyCoinsHelperSpec.js` / `CharacterMoneyCoinsSpec.js`: verify these still pass — the DOM structure inside `.character-money-coins` is unchanged (same children, only CSS display mode changes), so likely no assertion changes needed there, but re-run to confirm.
- Confirm no spec asserts on the now-removed `width: fit-content` styling directly (unlikely, since Jasmine specs here test rendered markup/classes, not computed CSS).

## Files to Change

- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyTreasureBoxHelper.jsx` — swap icon to `bi-gem`.
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyTreasureBillHelper.jsx` — swap icon to `bi-gem`.
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyBillHelper.jsx` — wrap money bill + treasure bill in a new `.character-money-bill-group` container div.
- `frontend/assets/css/main.scss` — icon sizing for `.bi-gem` in both treasure variants; `.character-money-coins` and `.coin-box` width/display changes; new `.character-money-bill-group` rule and `.character-money-bill` width/margin changes.
- `frontend/specs/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyTreasureBoxHelperSpec.js` — update icon assertion.
- `frontend/specs/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyTreasureBillHelperSpec.js` — update icon assertion.
- `frontend/specs/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyBillHelperSpec.js` — update wrapper assertion.
- `frontend/specs/assets/js/components/resources/character/pages/elements/CharacterMoneyBillSpec.js` — update wrapper assertion if it asserts on the returned tree shape.

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes

- No product/access-control implications — purely visual, no new entities, endpoints, or permission logic. `product-owner`/`security`/`data-access` review is not needed for this issue.
- The CSS grid single-column trick (`grid-template-columns: max-content` + default `justify-items: stretch`) is what makes width-matching work without JS measurement; double check there isn't a simpler existing utility/pattern already used elsewhere in `main.scss` for equal-width stacked elements before introducing a new one.
- Verify in-browser (or via the `run`/`verify` skill) that both D&D and Deadlands character show/edit pages render the aligned widths and the gem icon correctly, for characters with and without treasure (treasure boxes render `null` when `treasureValue` is `0` — confirm the grid column width still resolves sanely when only the money box/bill is present).
