# Issue: Refactor functions with too many parameters (Lizard parameter-count-medium)

## Description
Codacy's Lizard complexity analyzer flags 14 functions/methods (mostly React component signatures and constructors under `frontend/`) as taking more parameters than the configured limit (8). A long parameter list is a common sign that a function is doing too much, or that related parameters should travel together as a single object.

## Problem
A large number of positional parameters makes call sites hard to read, obscures which parameters are related, and makes it easy to pass arguments in the wrong order or forget one.

## Solution
For each function below, reduce the parameter count by grouping related parameters into a single object.

The codebase already has an established convention for this: a `context` prop (optionally with a nested `handlers: { onX, onY, ... }` object bundling callbacks), used today in `ListPage.jsx`, `ShowPageLayout.jsx`, and several `*DetailHelper.jsx` files. Reuse this `context`/`handlers` shape wherever a flagged function's parameters fit it, instead of inventing a new grouping. Where it doesn't fit well, use judgment for the most natural grouping, checking nearby sibling components first.

Several of the flagged files are paired — a component and its own `*Helper.jsx` render method with a mirrored parameter list (e.g. `PreviewSection.jsx` and `PreviewSectionHelper.jsx`, `PhotoViewModal.jsx` and `PhotoViewModalHelper.jsx`). Refactor each such pair together, using the same grouped object shape on both sides. `DocumentDetailHelper.jsx` and `FactionDetailHelper.jsx` have no matching flagged parent component (their long argument lists are built from local state in the calling page component, e.g. `GameDocument.jsx`/`GameFaction.jsx`) — group their parameters independently and update the call site accordingly.

`BaseCharacterEditController.js` is a plain JS class constructor rather than a React component; apply the same treatment — group its constructor parameters into a single options object.

JSDoc blocks documenting the current flat parameter lists must be updated to describe the new grouped-object shape (see `ShowPageLayout.jsx`/`ListPage.jsx` for the existing `@param {object} props.foo.bar`-style documentation convention). The repo has no PropTypes definitions, so there is nothing to update there.

### Occurrences (14, across 14 files)

- `frontend/assets/js/components/common/cards/PreviewSection.jsx`
  - line 33: Method PreviewSection has 10 parameters (limit is 8)
- `frontend/assets/js/components/common/cards/helpers/PreviewSectionHelper.jsx`
  - line 28: Method render has 11 parameters (limit is 8)
- `frontend/assets/js/components/common/forms/MultiResourcePickerField.jsx`
  - line 47: Method MultiResourcePickerField has 9 parameters (limit is 8)
- `frontend/assets/js/components/common/forms/TagsField.jsx`
  - line 45: Method TagsField has 11 parameters (limit is 8)
- `frontend/assets/js/components/common/list_page/ListPage.jsx`
  - line 36: Method ListPage has 10 parameters (limit is 8)
- `frontend/assets/js/components/common/misc/ActionsOverlay.jsx`
  - line 58: Method ActionsOverlay has 9 parameters (limit is 8)
- `frontend/assets/js/components/common/modals/PhotoUploadModal.jsx`
  - line 42: Method PhotoUploadModal has 11 parameters (limit is 8)
- `frontend/assets/js/components/common/modals/PhotoViewModal.jsx`
  - line 21: Method PhotoViewModal has 9 parameters (limit is 8)
- `frontend/assets/js/components/common/modals/helpers/PhotoViewModalHelper.jsx`
  - line 25: Method render has 9 parameters (limit is 8)
- `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterEditController.js`
  - line 53: Method constructor has 10 parameters (limit is 8)
- `frontend/assets/js/components/resources/character/pages/elements/tabs/shared/ExchangeDetailPane.jsx`
  - line 35: Method ExchangeDetailPane has 10 parameters (limit is 8)
- `frontend/assets/js/components/resources/character/pages/helpers/BaseCharacterPhotosHelper.jsx`
  - line 49: Method render has 10 parameters (limit is 8)
- `frontend/assets/js/components/resources/document/pages/helpers/DocumentDetailHelper.jsx`
  - line 57: Method render has 9 parameters (limit is 8)
- `frontend/assets/js/components/resources/faction/pages/helpers/FactionDetailHelper.jsx`
  - line 42: Method render has 9 parameters (limit is 8)

## Benefits
- Easier to read and maintain call sites
- Reduced risk of argument-order mistakes and omitted arguments
- Brings all 14 functions under the project's configured Lizard parameter-count threshold
- Reinforces the existing `context`/`handlers` grouping convention instead of fragmenting it with one-off patterns
