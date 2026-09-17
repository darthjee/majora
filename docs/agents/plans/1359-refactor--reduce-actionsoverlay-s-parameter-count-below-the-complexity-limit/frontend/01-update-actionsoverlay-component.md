# Update the ActionsOverlay component

Replace the two standalone booleans `grayscale` and `dimmed` on `ActionsOverlay` with a single grouped object prop `photoState`, dropping the component's parameter count from 9 to 8.

In `frontend/assets/js/components/common/misc/ActionsOverlay.jsx`:
- Change the destructured signature from `grayscale = false, dimmed = false, overlayItems = {}, ...` to `photoState = {}, overlayItems = {}, ...`, then destructure `const { grayscale = false, dimmed = false } = photoState;` alongside the existing `const { secondaryButtons = [], infoBarItems = [] } = overlayItems;` line.
- Update the JSDoc: replace the separate `@param {boolean} [props.grayscale]` and `@param {boolean} [props.dimmed]` entries with a single grouped entry, mirroring how `overlayItems`/`overlayItems.secondaryButtons`/`overlayItems.infoBarItems` are documented today, e.g.:
  ```
  @param {object} [props.photoState] - Optional visual-state flags for the underlying photo.
  @param {boolean} [props.photoState.grayscale] - Whether to render the photo in grayscale.
  @param {boolean} [props.photoState.dimmed] - Whether to render the photo with reduced opacity
    (e.g. a hidden NPC).
  ```
- The rendering logic itself (the `className` computation using `grayscale`/`dimmed`) is unchanged — only where those two booleans come from changes.

## Files to Change

- `frontend/assets/js/components/common/misc/ActionsOverlay.jsx` — replace `grayscale`/`dimmed` params with a `photoState` object prop; update JSDoc.
