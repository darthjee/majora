# Update affected specs

Only specs that assert directly on the `grayscale`/`dimmed` *prop names* passed into (or through to) `ActionsOverlay` need changes. Specs that render to static markup and assert on the resulting `photo-grayscale`/`photo-hidden` CSS class names (e.g. `PossessionEditHelperSpec.js`, `ItemEditHelperSpec.js`, `CommonItemEditHelperSpec.js`, `CharacterAvatarSlotSpec.js`, `CharacterAvatarFieldHelperSpec.js`, `CharacterAvatarFieldSpec.js`) are unaffected — the rendered output is unchanged by this refactor, so leave them as-is.

Confirmed specs needing an update (re-grep `\.props\.grayscale\|\.props\.dimmed` under `frontend/specs` before starting, in case something shifted):

- `frontend/specs/assets/js/components/common/misc/ActionsOverlay/containerSpec.js` — the component's own spec, lines ~108-119 (`grayscale: true` case), ~135-142 (`dimmed: true` case), ~149-161 (both together). Change each to pass `photoState: { grayscale: true }` / `photoState: { dimmed: true }` / `photoState: { grayscale: true, dimmed: true }` instead of flat `grayscale`/`dimmed` keys — this must stay in sync with Step 01's component change.
- `frontend/specs/assets/js/components/resources/common_item/pages/elements/show/CommonItemPhotoSpec.js` — 4 occurrences of `.props.dimmed` (lines ~64, 68, 93, 97) → `.props.photoState.dimmed`.
- `frontend/specs/assets/js/components/resources/document/pages/elements/show/DocumentPhotoSpec.js` — 4 occurrences of `.props.dimmed` (lines ~64, 68, 93, 97) → `.props.photoState.dimmed`.
- `frontend/specs/assets/js/components/resources/possession/pages/elements/show/PossessionPhotoSpec.js` — 4 occurrences of `.props.dimmed` (lines ~64, 68, 93, 97) → `.props.photoState.dimmed`.
- `frontend/specs/assets/js/components/resources/item/pages/elements/show/ItemPhotoSpec.js` — 4 occurrences of `.props.dimmed` (lines ~64, 68, 93, 97) → `.props.photoState.dimmed`.
- `frontend/specs/assets/js/components/resources/character/pages/helpers/CharacterHelperSlainSpec.js` — 2 occurrences of `overlay.props.grayscale` (lines ~51, 59) → `overlay.props.photoState.grayscale`.

After editing, run `npm run coverage` (from `frontend/`) and `npm run lint` to confirm everything passes and the Codacy Lizard `parameter-count-medium` condition on `ActionsOverlay.jsx` is resolved (9 → 8 params).

## Files to Change

- `frontend/specs/assets/js/components/common/misc/ActionsOverlay/containerSpec.js` — switch `grayscale`/`dimmed` prop construction to nested `photoState`.
- `frontend/specs/assets/js/components/resources/common_item/pages/elements/show/CommonItemPhotoSpec.js` — `.props.dimmed` → `.props.photoState.dimmed`.
- `frontend/specs/assets/js/components/resources/document/pages/elements/show/DocumentPhotoSpec.js` — `.props.dimmed` → `.props.photoState.dimmed`.
- `frontend/specs/assets/js/components/resources/possession/pages/elements/show/PossessionPhotoSpec.js` — `.props.dimmed` → `.props.photoState.dimmed`.
- `frontend/specs/assets/js/components/resources/item/pages/elements/show/ItemPhotoSpec.js` — `.props.dimmed` → `.props.photoState.dimmed`.
- `frontend/specs/assets/js/components/resources/character/pages/helpers/CharacterHelperSlainSpec.js` — `.props.grayscale` → `.props.photoState.grayscale`.
