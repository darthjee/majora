# Opt in games/my-games list type configs

Add a new `cardPhotoClassName: 'card-photo-rect'` field to the two list
type configs that should render rectangular cards. `itemsPerRow: 4` is
already set on both — no change needed there, since Step 1's formula
already derives the flexible column count from it.

`ListPageHelper.#renderItem` reads `config.cardPhotoClassName` and passes
it through to `ActionsOverlay`'s new `photoClassName` prop (from Step 2).
Every other list type's config simply omits this field, so `CardPhoto`
keeps defaulting to `card-photo-square` for them — no other config file
needs to change.

## Files to Change

- `frontend/assets/js/components/common/list_types/configs/gamesListType.js` — add `cardPhotoClassName: 'card-photo-rect'`.
- `frontend/assets/js/components/common/list_types/configs/myGamesListType.js` — add `cardPhotoClassName: 'card-photo-rect'`.
- `frontend/assets/js/components/common/list_page/helpers/ListPageHelper.jsx` — read `config.cardPhotoClassName` and pass it to `ActionsOverlay`'s `photoClassName` prop in `#renderItem`.
