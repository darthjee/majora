# Issue: Refactor: reduce ActionsOverlay's parameter count below the complexity limit

## Description
`ActionsOverlay` (`frontend/assets/js/components/common/misc/ActionsOverlay.jsx`) wraps a photo/avatar with a hover-reveal overlay hosting the photo-upload button and any secondary action buttons (e.g. Slain/Revive). It currently accepts 9 individual props: `type`, `url`, `alt`, `canEdit`, `onClick`, `grayscale`, `dimmed`, `overlayItems`, `photoClassName`. It is used from roughly 20 call sites across the resource pages (character, possession, item, faction, source, document, collection, common_item, stl_model, game).

## Problem
Codacy's Lizard scan (`parameter-count-medium`, Complexity, Warning severity) flags `ActionsOverlay.jsx:62` for exceeding the project's 8-parameter guideline, since the component takes 9 parameters. This makes the component's prop surface harder to reason about and its call sites harder to read.

## Expected Behavior
No visible or behavioral change — `ActionsOverlay` renders and behaves identically at every existing call site; only the prop surface changes shape.

## Solution
Consolidate the `grayscale` and `dimmed` visual-state booleans into a single grouped prop (e.g. `photoState: { grayscale, dimmed }`) — following the pattern already used for `overlayItems` (`secondaryButtons`/`infoBarItems`) — so the total parameter count drops from 9 to 8. This is the least invasive grouping: only 1 call site passes `grayscale` and roughly 14 pass `dimmed`, and most pass at most one of the two. Update every call site and any specs constructing these props directly to match the new shape.

## Benefits
- Clears the Codacy Lizard `parameter-count-medium` finding for this file
- Reduces `ActionsOverlay`'s prop surface, making call sites easier to read and reason about
