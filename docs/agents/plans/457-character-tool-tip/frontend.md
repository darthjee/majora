# Frontend Plan: Character tool tip

Main plan: [plan.md](plan.md)

## Shared contracts

Call `Translator.t('character_status_badges.<key>')` for each status item's label text, using the keys listed in [plan.md](plan.md)'s "Shared contracts" section (`slain`, `alive`, `public_slain`, `public_alive`, `enemy`, `ally`, `neutral`, `public_enemy`, `public_ally`, `public_neutral`). Do not hardcode the English strings — `translator` owns adding them to `en.yaml`; missing keys safely fall back to the key itself in the meantime.

## Implementation Steps

### Step 1 — Icons

Add the following constants to `frontend/assets/js/utils/Icons.js` (all standard Bootstrap Icons glyphs, no custom SVG needed, unlike `skull`/`skull-fill`):

```js
infoCircleFill: 'bi-info-circle-fill',
emojiAngry: 'bi-emoji-angry',
emojiAngryFill: 'bi-emoji-angry-fill',
emojiSmile: 'bi-emoji-smile',
emojiSmileFill: 'bi-emoji-smile-fill',
emojiExpressionless: 'bi-emoji-expressionless',
emojiExpressionlessFill: 'bi-emoji-expressionless-fill',
```

Reuse the existing `heart`/`heartOutline`/`skull`/`skullFill` constants for the Slain/Alive items.

### Step 2 — Status item rules class

Add `frontend/assets/js/components/elements/helpers/CharacterStatusBadges.js`, a static class (JSDoc'd, parallel to `SlainSecondaryButtons.js`) with a `build(character)` method returning an ordered `{icon, text, variant}[]` list:

1. Slain (`character.slain`, both PC/NPC): `true` → `{icon: Icons.skullFill, text: Translator.t('character_status_badges.slain'), variant: 'danger'}`; `false` → `{icon: Icons.heart, text: Translator.t('character_status_badges.alive'), variant: 'success'}`. Omit when `character.slain` is `null`/`undefined`.
2. Public Slain (`character.public_slain`, both PC/NPC): same shape using `Icons.skull`/`Icons.heartOutline` and the `public_slain`/`public_alive` keys. Omit when null/missing.
3. Allegiance (`character.allegiance`, **NPC only** — gate explicitly on `!character.is_pc`, matching the current frontend scoping where allegiance is not read for PCs): `enemy` → `{icon: Icons.emojiAngryFill, text: t('...enemy'), variant: 'danger'}`; `ally` → `{icon: Icons.emojiSmileFill, text: t('...ally'), variant: 'success'}`; `neutral` → `{icon: Icons.emojiExpressionlessFill, text: t('...neutral'), variant: null}` (no color). Omit for PCs or when the field is null/missing.
4. Public Allegiance (`character.public_allegiance`, NPC only): same shape using the non-`Fill` emoji icons and the `public_enemy`/`public_ally`/`public_neutral` keys.

Confirm during implementation (via the existing character serializers/specs, or a quick check against `CharacterDetailSerializer`/`CharacterFullSerializer` in `source/games/serializers/`) whether a given viewer role ever actually receives one of these keys as genuinely absent (vs. always-present with an aliased value) — the "omit when null/missing" rule should hold regardless, but knowing which roles see which keys clarifies what to cover in specs.

### Step 3 — Item-list component

Add `frontend/assets/js/components/elements/InfoBadgeList.jsx` — the "items themselves" component required by the issue. Renders the `{icon, text, variant}[]` list from Step 2 as rows (icon + colored text each, using `text-{variant}` or similar Bootstrap color utility when `variant` is set, default/muted styling when not).

### Step 4 — Tooltip badge component

Add `frontend/assets/js/components/elements/TooltipBadge.jsx` — the "tooltip" component required by the issue. Renders a small badge/pill showing just an icon (used here with `Icons.infoCircleFill`), wrapped in `react-bootstrap`'s `OverlayTrigger` + `Tooltip` (first use of either in this codebase — confirm `import { OverlayTrigger, Tooltip } from 'react-bootstrap'` resolves cleanly, since only `react-bootstrap` in general has been a dependency, not necessarily exercised yet), showing `<InfoBadgeList items={...} />` as the tooltip content on hover/focus.

Consider whether a minimal shared `Badge.jsx` primitive (icon-or-text pill, optional `variant`) is worth factoring out now, since Step 6 needs an equivalent plain badge for the treasure quantity — reuse it as `TooltipBadge`'s visible trigger element if so; if it does not clean up either call site, a small amount of duplication between the two is fine.

### Step 5 — Wire into the character info bar

Update `InfoBarRules.build(character)` (added in #456, `frontend/assets/js/components/elements/helpers/InfoBarRules.js`, currently always returns `[]`) to return `[<TooltipBadge key="status" icon={Icons.infoCircleFill} items={CharacterStatusBadges.build(character)} />]` when `CharacterStatusBadges.build(character)` is non-empty, else `[]`. No changes needed at the `CharacterHelper.jsx`/`CharacterCardHelper.jsx` call sites — they already thread `InfoBarRules.build(character)` into `ActionsOverlay`'s `infoBarItems` prop per #456's plan.

### Step 6 — Migrate the treasure quantity badge

In `frontend/assets/js/components/elements/helpers/TreasureCardHelper.jsx`, replace `#renderQuantityBadge`'s independent `<span className="badge bg-secondary position-absolute top-0 end-0 m-2">` (lines 66-76) with an equivalent badge element (reusing `Badge.jsx` from Step 4 if it was extracted, otherwise an inline `<span className="badge bg-secondary">×{quantity}</span>`) passed through the `infoBarItems` prop of the existing `ActionsOverlay` call (`TreasureCardHelper.jsx:40-46`, added by #456), instead of being rendered as an independent sibling. Preserve the exact visible behavior: shown only when `quantity > 1`, `×{quantity}` text, no icon, no tooltip. Adjust/remove the now-redundant `position-absolute top-0 end-0 m-2` utility classes if the info bar's own CSS (from #456) already positions its contents at the top of the photo.

### Step 7 — Tests

- Add `frontend/specs/assets/js/components/elements/helpers/CharacterStatusBadgesSpec.js` covering every branch in Step 2 (each field true/false/enemy/ally/neutral/null/missing, and the PC-gating on allegiance).
- Add specs for `InfoBadgeList.jsx` and `TooltipBadge.jsx` (new spec folders under `frontend/specs/assets/js/components/elements/`), covering empty vs. populated item lists and (for `TooltipBadge`) that the tooltip content renders the given items.
- Update `frontend/specs/assets/js/components/elements/helpers/InfoBarRulesSpec.js` (added in #456) to cover the new non-empty-output branches.
- Update `TreasureCardHelper`'s existing quantity-badge spec(s) to assert the badge now flows through `infoBarItems` while keeping the same `quantity > 1` visibility rule.

### Step 8 — Verify

Run lint and the full Jasmine suite through the containerized toolchain (never invoke `yarn`/`npm` directly on the host).

## Files to Change

- `frontend/assets/js/utils/Icons.js` — add `infoCircleFill`/`emojiAngry*`/`emojiExpressionless*`/`emojiSmile*` constants.
- `frontend/assets/js/components/elements/helpers/CharacterStatusBadges.js` (new) — status item rules class.
- `frontend/assets/js/components/elements/InfoBadgeList.jsx` (new) — item-list component.
- `frontend/assets/js/components/elements/TooltipBadge.jsx` (new) — badge + tooltip component.
- `frontend/assets/js/components/elements/Badge.jsx` (new, optional — see Step 4) — shared plain badge primitive.
- `frontend/assets/js/components/elements/helpers/InfoBarRules.js` — populate the previously-empty status badge output (from #456).
- `frontend/assets/js/components/elements/helpers/TreasureCardHelper.jsx` — migrate the quantity badge onto `infoBarItems`.
- `frontend/specs/assets/js/components/elements/helpers/CharacterStatusBadgesSpec.js` (new), `InfoBadgeList/**` (new), `TooltipBadge/**` (new) — new specs.
- `frontend/specs/assets/js/components/elements/helpers/InfoBarRulesSpec.js`, `TreasureCardHelper` specs — updated.

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

Run through the containerized toolchain (e.g. `docker-compose run frontend npm run lint` / `npm run coverage`), never `npm`/`yarn` directly on the host.

## Notes

- Depends on #456 landing first (`ActionsOverlay`'s `infoBarItems` prop, `InfoBar.jsx`, `InfoBarRules.js` must already exist) — confirm that branch/PR is merged (or its plan implemented) before starting Step 5/6.
- This is the first use of `react-bootstrap`'s `OverlayTrigger`/`Tooltip` in the codebase (per the issue discussion) — double-check it renders correctly in the containerized dev environment (`make dev-up`) before considering Step 4 done, since there's no existing usage to copy from.
- No backend, product, or security changes: `allegiance`/`public_allegiance`/`slain`/`public_slain` are already-exposed character fields; this is a purely presentational, read-only addition.
