# Games list warning for `domain_not_recognized`

When the games list fetch rejects with an `HttpResponseError` whose status is `404` and whose
error codes include `domain_not_recognized`, show a translated warning
(`Translator.t('games_page.domain_not_recognized')`) instead of the generic error.

Suggested shape: add an optional `resolveErrorMessage(error)` hook to the list-type config
(`gamesListType.js` implements it). In `ListPageController.buildEffect()`'s `.catch`, call
`listTypeConfig[this.type].resolveErrorMessage?.(error)` and fall back to the existing
'Unable to load list.' message. If the warning should look like a warning rather than an error,
render it through a Bootstrap `alert-warning`, following the existing `ErrorAlert` pattern.
Check how the `RequestStore` error propagates: make sure the `HttpResponseError` instance
reaches the `.catch` unwrapped (`Request`/`RequestStoreLogging` must not replace it).

## Files to Change

- `frontend/assets/js/components/common/list_types/configs/gamesListType.js`:
  `resolveErrorMessage`.
- `frontend/assets/js/components/common/list_page/controllers/ListPageController.js`: use the
  hook.
- (if needed) `frontend/assets/js/components/common/list_page/helpers/ListPageHelper.jsx` /
  `ListPage.jsx`: warning variant.
- Jasmine specs: `domain_not_recognized` 404 → translated warning; other failures → the generic
  message; list types without the hook are unchanged.
