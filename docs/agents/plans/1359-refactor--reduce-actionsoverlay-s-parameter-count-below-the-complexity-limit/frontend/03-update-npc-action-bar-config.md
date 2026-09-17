# Update the list-page NPC action-bar config

`ListPageHelper.jsx`'s `#renderItem` (`frontend/assets/js/components/common/list_page/helpers/ListPageHelper.jsx:76-84`) spreads `config.buildActionBarProps(item, context)` (minus `secondaryButtons`) straight onto `<ActionsOverlay {...actionBarProps} />`. Only one list-type config actually returns `grayscale`/`dimmed` in that object today: `buildNpcActionBarProps` in `frontend/assets/js/components/common/list_types/configs/characterListTypes.js`. Every other config (`buildReadOnlyActionBarProps` in `listTypeConfig.js`, and `globalTreasureListType.js`'s `buildActionBarProps`) never returns those keys, so they need no change.

Change `buildNpcActionBarProps` to nest the two flags under `photoState` instead of returning them flat, so the existing spread in `ListPageHelper.jsx` picks up the new shape automatically with no edit needed there:

```js
function buildNpcActionBarProps(item, context) {
  const character = item.data;

  return {
    canEdit: Boolean(context.canEdit) || Boolean(context.isPlayer),
    onClick: () => context.onUploadClick(character),
    photoState: {
      grayscale: Boolean(item.slain),
      dimmed: Boolean(character.hidden),
    },
    secondaryButtons: buildNpcSecondaryButtons(character, context),
  };
}
```

Update its JSDoc `@returns` line (currently `{{canEdit: boolean, onClick: Function, grayscale: boolean, dimmed: boolean, secondaryButtons: object[]}}`) to reflect the nested `photoState: {grayscale: boolean, dimmed: boolean}` shape.

Do not touch `ListPageHelper.jsx` itself — confirm after this change that its `{...actionBarProps}` spread still carries `photoState` through untouched (no code change needed there, just verification).

## Files to Change

- `frontend/assets/js/components/common/list_types/configs/characterListTypes.js` — nest `grayscale`/`dimmed` under `photoState` in `buildNpcActionBarProps`'s return value and JSDoc.
