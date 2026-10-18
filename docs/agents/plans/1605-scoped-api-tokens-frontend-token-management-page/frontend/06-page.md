# Page, controller and helper

`ApiTokens.jsx` + `controllers/ApiTokensController.js` + `helpers/ApiTokensHelper.jsx`,
following `AuthorizationRequests.jsx`. The page uses `useState` and builds the controller with
`useMemo` and `useEffect(() => controller.buildEffect()(), [controller])`. The controller extends
`BasePageController`.

**Controller:**

- **Logged-out handling:** `RequestStore.ensure` rejects with a plain `Error`, so it loses the
  HTTP status and a 401 can't be detected from it. Instead, `buildEffect` first checks the
  session the same way the app does elsewhere (e.g. `AuthStorage.getToken()`), and calls
  `redirectTo('/')` when logged out, matching `AuthorizationRequestsController`. When logged in,
  a fetch failure sets `error`, and the page shows `load_error` with a retry.
- **Loading:**
  - The list: `ensure({componentName: 'ApiTokensController', resource: 'apiToken',
    quantityType: 'collection'})` → `setTokens(data)`, in API order.
  - The options, independently: `ensure({... quantityType: 'options'})` → `setOptions`. On
    failure it sets `optionsError`, which disables "New token" and shows an alert with a retry.
- **Refresh:** `RequestStore.purge({resource: 'apiToken'})`, then `ensure` the list and the
  options again. Never patch rows in place, including from the rename response.
- **Rename:** `mutate({method: 'PATCH', quantityType: 'single', params: {id}, body: {name}})`.
  - It sends nothing when the trimmed name is unchanged.
  - **400:** show the row's field errors (`FieldErrors` for `name`).
  - **404:** show the `token_gone` info alert and refresh.
  - **Other failures:** show `action_error`.
  - **Success:** refresh.
- **Revoke:** opens the shared `ApiTokenRevokeConfirmModal`. On confirm it calls
  `mutate({method: 'DELETE', quantityType: 'single', params: {id}})`.
  - **204:** refresh.
  - **404:** show `token_gone` and refresh.
  - **Other failures:** show `action_error`.

**Helper:**

- `PageActions backHref="#/my_account"`, with the "New token" button as a child.
- The page intro.
- The `options_error` alert with a retry.
- The `token_gone` info and `action_error` alerts.
- The `LoadingMessage`.
- The `empty` state.
- The table: columns use the `ApiTokenCellsHelper` cells from step 03, plus an actions cell.
- **Inline rename row state:** an input with `maxLength=100`. Enter saves and Esc cancels.
- Expired tokens keep Rename and Revoke.
- `CreateApiTokenModal` with `options` and `onCreated = refresh`.

Specs (`*Spec.js`, controller specs split per method):

- Logged-out redirect.
- Load, empty, and the error with retry.
- The options failure disables "New token".
- Create → `onCreated` → refresh (purge + ensure).
- Rename: success, unchanged name sends nothing, 400 and 404.
- Revoke: confirm, 404 refresh, and failure.
- Helper rendering for each state.

## Files to Change

- `frontend/assets/js/components/resources/account/pages/ApiTokens.jsx` (new)
- `frontend/assets/js/components/resources/account/pages/controllers/ApiTokensController.js` (new)
- `frontend/assets/js/components/resources/account/pages/helpers/ApiTokensHelper.jsx` (new)
- `frontend/specs/assets/js/components/resources/account/pages/controllers/ApiTokensController/*Spec.js`
  (new)
- `frontend/specs/assets/js/components/resources/account/pages/helpers/ApiTokensHelperSpec.js`
  (new)
