# Plan: Dont show item description in tooltip

Issue: [731-dont-show-item-description-in-tooltip.md](../../issues/731-dont-show-item-description-in-tooltip.md)

## Overview
The items preview list on the character show pages currently renders a hover tooltip with the item's name and, when present, its description. This plan removes the description from that tooltip so it always shows only the item's name. The change lives in a single shared helper, so it affects both the PC and the NPC character show pages (confirmed intentional during issue discussion).

## Context
`ItemPreviewCard` (`frontend/assets/js/components/common/cards/ItemPreviewCard.jsx`) delegates rendering to `ItemPreviewCardHelper.render()`, which builds the tooltip content via a private `#buildTooltipContent(item)` method. That method currently appends `<br />{item.description}` after the name whenever `item.description` is truthy. `ItemPreviewCard` is only ever instantiated from `CharacterHelper.jsx`, which is shared by both `PcCharacter.jsx` and `NpcCharacter.jsx` (via `CharacterDetail.jsx`) — so there is exactly one place to change and it naturally covers both pages.

## Implementation Steps

### Step 1 — Simplify the tooltip content builder
In `frontend/assets/js/components/common/cards/helpers/ItemPreviewCardHelper.jsx`, change `#buildTooltipContent(item)` to always return `item.name`, dropping the description branch entirely (the method can likely be inlined or simplified to a one-liner since it no longer branches). Update the class-level JSDoc on `render()` that currently says "(and description, when present)" to just mention the name.

### Step 2 — Update the spec
In `frontend/specs/assets/js/components/common/cards/helpers/ItemPreviewCardHelperSpec.js`:
- Update `'feeds the item name and description to the tooltip content'` — rename/rewrite it to assert the tooltip content is just the name and does **not** contain the description text.
- Remove or fold `'omits the description line from the tooltip content when there is none'` into the above, since there is no longer a description branch to distinguish.
- Leave the other existing specs (grid classes, image rendering, alt text, no card-body/name in the base render) unchanged — they're unaffected by this change.

## Files to Change
- `frontend/assets/js/components/common/cards/helpers/ItemPreviewCardHelper.jsx` — drop the description branch from `#buildTooltipContent`; tooltip content becomes just `item.name`.
- `frontend/specs/assets/js/components/common/cards/helpers/ItemPreviewCardHelperSpec.js` — update specs to match the new (description-free) tooltip content.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- No backend, translation, or proxy changes are needed — the description text itself is untouched (still fetched/available on `item`), it's just no longer rendered in this tooltip.
- Confirmed during issue discussion: this shared component intentionally affects both the PC and NPC show pages, not just PC as literally named in the issue title.
