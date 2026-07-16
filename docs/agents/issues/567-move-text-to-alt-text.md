# Issue: Move text to alt text

## Description
Several "See all" cards across the app (shared `SeeAllCard` component) render a Bootstrap icon next to visible text — e.g. "See all Player Characters" / "See all Non-Player Characters" in the game page's (`games/:game_slug`) PCs list and NPCs list sections, plus the Character Photos preview and Character Treasures preview. This text should stop being displayed and instead become the accessible name for the icon/link.

## Problem
These "See all" links show both an icon and adjacent visible text, which is visually redundant — the icon alone is meant to convey the action, and the text clutters the card.

## Expected Behavior
All "See all" cards (PCs list, NPCs list, Character Photos preview, Character Treasures preview) show only the icon, with the current text exposed as the accessible name of the link via `aria-label` instead of visible text, so screen reader users still get the same information.

## Solution
Update the shared `SeeAllCard`/`SeeAllCardHelper` component so the `text` prop is applied as `aria-label` on the anchor (`<a>`) instead of being rendered as visible content, following the same icon-only-link pattern already used by `PageLink.jsx` (`aria-label` on the `<a>`). Since this component is shared, the change affects all four call sites (PCs, NPCs, Photos, Treasures previews) at once.

## Benefits
Cleaner, more consistent card UI across all "See all" links, while preserving accessibility for screen reader users.
