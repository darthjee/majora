# Issue: Character tool tip

## Description
Depends on #456 (character info bar).

Add the info bar's first badge: a single `info-circle-fill` icon badge shown in the character photo's info bar (both PC and NPC), which reveals a tooltip on hover/mouseover listing character status items (icon + colored text each), built as reusable components.

Also migrate the existing treasure-quantity badge (currently an independent, always-visible `<span className="badge bg-secondary">` on `TreasureCard`, see `TreasureCardHelper.jsx#renderQuantityBadge`) onto the same generic bar/badge mechanism, so character and treasure badges share one underlying component contract instead of each having their own bespoke markup.

No tooltip exists anywhere in this codebase today; this introduces the first one, using `react-bootstrap`'s `OverlayTrigger`/`Tooltip` (already a project dependency) rather than the vanilla Bootstrap JS widget.

## Problem
- Character photos have no way to show status information (slain, allegiance) at a glance.
- The treasure-quantity badge on `TreasureCard` is implemented independently of the character-photo overlay components, even though both are conceptually "a badge on a card photo" — duplicated, bespoke markup instead of a shared mechanism.

## Expected Behavior
- A single badge, using the `info-circle-fill` bootstrap icon, appears in the character info bar (from #456) for both PC and NPC photos.
- On mouseover, a tooltip appears listing character status items. Each item has its own icon, text, and color, and is only shown when its underlying data is present (non-null, key not missing):
  - **Slain** (`character.slain`): `true` → icon `skull-fill` (existing custom `.bi-skull-fill` class), text "Slain", color `btn-danger`/red. `false` → icon `heart-fill`, text "Alive", color `btn-success`/green.
  - **Public Slain** (`character.public_slain`): `true` → icon `skull` (existing custom `.bi-skull` class), text "Known as Slain", red. `false` → icon `heart`, text "Known as Alive", green.
  - **Allegiance** (`character.allegiance`, NPC only — matches current frontend scoping, where allegiance is not read/displayed for PCs): `enemy` → icon `emoji-angry-fill`, text "Enemy", red. `ally` → icon `emoji-smile-fill`, text "Ally", green. `neutral` → icon `emoji-expressionless-fill`, text "Neutral", no special color.
  - **Public Allegiance** (`character.public_allegiance`, NPC only): `enemy` → icon `emoji-angry`, text "Known as Enemy", red. `ally` → icon `emoji-smile`, text "Known as Ally", green. `neutral` → icon `emoji-expressionless`, text "Known as Neutral", no special color.
- All the `info-circle-fill`/`emoji-*` icons above are standard Bootstrap Icons glyphs already available in the project's `bootstrap-icons` package — unlike `skull`/`skull-fill` (which needed custom SVG-based classes because Bootstrap Icons has no skull glyph), no new custom icon assets are needed here; only new `Icons.js` constants.
- The treasure-quantity badge (shown when `quantity > 1`) is migrated to the same badge mechanism used by the character info bar/action bar, without changing its visible behavior (still always-visible, no tooltip, no icon — just the `×{quantity}` text).

## Solution
- Extend the existing bar components with a composition-based approach: `ActionsOverlay`/`ActionBar` already accept a `secondaryButtons` array of `{label, variant, icon, onClick}` definitions (see `SlainSecondaryButtons.js`); add an analogous injectable array/prop for badges (e.g. `infoBadges`) to the info bar introduced in #456, so both the character info bar and the treasure quantity badge consume the same generic badge-rendering component, each fed by their own small "rules"/builder class — no dedicated per-domain badge components.
- Add a `CharacterInfoBadges` (name illustrative) rules/builder class (parallel to `SlainSecondaryButtons`/`InfoBarRules` from #456) that builds the Slain/Public Slain/Allegiance/Public Allegiance item list from a character object, omitting any item whose underlying field is null/missing.
- Build a reusable tooltip-badge component (single badge icon + `react-bootstrap` `OverlayTrigger`/`Tooltip` revealing the item list on hover) and a reusable item-list component (icon + colored text per item), as two separate components per the issue's request ("we want the tooltip to be a component, the items themselves to be a component").
- Migrate `TreasureCardHelper.#renderQuantityBadge` to feed its `×{quantity}` text through the same generic badge mechanism (no tooltip, no icon) instead of its own independent `<span>` markup.

## Benefits
- Character photos communicate key status (alive/slain, allegiance) at a glance without cluttering the UI, via a single unobtrusive badge.
- One shared, generic badge/tooltip mechanism serves both character and treasure cards, avoiding duplicated bespoke markup and easing future badge additions to either.
