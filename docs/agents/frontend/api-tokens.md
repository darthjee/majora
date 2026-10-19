# API Tokens UI

The SPA has two places for scoped API tokens. Both read data through `RequestStore` with a
logged-in session:

- the **owner token page** at `#/account/api_tokens`, where a user creates, lists, renames and
  revokes their own tokens;
- an **"API tokens" panel** on the staff user page (`#/staff/users/:id`), where staff list and
  revoke a user's tokens.

The backend contract (endpoints, payloads, error codes) is in
[`access-control/api-token.md`](../access-control/api-token.md). The scope rules are in
[`access-control/token-scopes.md`](../access-control/token-scopes.md).

Paths below are relative to `frontend/assets/js/`.

## Routes and navigation

- **Owner page route:** `['/account/api_tokens', 'accountApiTokens']` in
  `utils/routing/HashRouteResolver.js`. It is registered as `accountApiTokens: <ApiTokens />` in
  `components/helpers/AppHelper.jsx`. The route mirrors the API path `account/api_tokens.json`.
- **Header entry:** an "API tokens" item (`header.nav_api_tokens`,
  `data-testid="api-tokens-link"`) in the account dropdown of
  `components/common/header/helpers/HeaderHelper.jsx`. It comes after "Authorization requests"
  and follows the dropdown's logged-in rule. My Account has no link to the page.
- **Back link:** `PageActions backHref="#/my_account"`.
- **Logged-out visit:** `ApiTokensController.buildEffect` redirects to `/` when
  `AuthStorage.getToken()` is missing. A 401 from `RequestStore.ensure` only shows the load or
  options retry alert.
- **Staff:** there is no new route. The panel sits on `#/staff/users/:id` and relies on
  `StaffUserController`'s staff/superuser redirect, with no extra `AccessStore` check.

## Components

### Owner page (`components/resources/account/pages/`)

| File | Responsibility |
|---|---|
| `ApiTokens.jsx` | Page state: tokens, loading, error, options, options error, notice, renaming, revoke target, revoking, create modal visibility. |
| `controllers/ApiTokensController.js` | Extends `BasePageController`: `buildEffect`, `refresh`, `rename`, `revoke`. |
| `helpers/ApiTokensHelper.jsx` | Layout, options and notice alerts, list states; hosts both modals. |
| `elements/ApiTokensTable.jsx` (+ `helpers/ApiTokensTableHelper.jsx`) | The token list; Rename/Revoke, or Save/Cancel while renaming. |
| `elements/ApiTokenRenameField.jsx` | Inline rename input (`maxLength=100`); `buildRenameKeyDownHandler` (Enter saves, Esc cancels). |
| `elements/ApiTokensRetryAlert.jsx` | Alert with a Retry button. |
| `elements/CreateApiTokenModal.jsx` (+ `controllers/CreateApiTokenModalController.js`, `helpers/CreateApiTokenModalHelper.jsx`) | The create form view and the secret view. |
| `elements/ApiTokenScopePicker.jsx` (+ helper), `ApiTokenScopeCheckbox.jsx`, `ApiTokenScopeSelection.js` | The scope picker; `ApiTokenScopeSelection` holds the pure `toggle`, `selectAll` and `clear` logic. |
| `elements/ApiTokenGamesPicker.jsx` (+ helper), `ApiTokenGamesSelection.js` | The games picker; `MAX_GAMES = 100`, `applyGamesSelection`. |
| `elements/ApiTokenExpiryField.jsx` (+ helper), `ApiTokenExpiry.js` | The expiry field; `ApiTokenExpiry` exposes `CHOICES`, `DEFAULT`, `isComplete`, `toExpiresAt` and `minDate`. |
| `elements/ApiTokenSecretView.jsx` (+ helper) | The "token created" view. |

### Staff panel (`components/resources/staff_user/pages/`)

- `StaffUser.jsx` holds the panel state and the revoke modal.
- `controllers/StaffUserApiTokensController.js`, a sibling of
  `StaffUserRecoveryTokensController`, has its own state (`tokens`, `loading`, `error`,
  `notice`, where `notice` is `null`, `'token_gone'` or `'action_error'`). A fetch failure never
  blanks the user details.
- `helpers/StaffUserApiTokensHelper.jsx` renders the read-only table with a per-row Revoke
  button. `StaffUserHelper.render(user, tokensState, handlers, apiTokensPanel)` places it below
  the recovery-token panel.

### Shared (`components/common/api_tokens/`)

Used by both the owner page and the staff panel:

- `ApiTokenRevokeConfirmModal.jsx` (+ `helpers/ApiTokenRevokeConfirmModalHelper.jsx`): the
  staff variant passes `ownerName`, which switches the copy to `revoke_body_staff`.
- `ApiTokenCellsHelper.jsx`: the row cells (`renderName`, `renderPrefix`, `renderScopes`,
  `renderGames`, `renderExpires`, `renderLastUsed`, `renderCreated`, `renderStatus`).
- `ApiTokenScopes.js`: the UI-only family → group constant (`SCOPE_GROUPS`).
- `InlineTooltip.jsx`.
- `components/common/list_types/ApiTokenStatusBadges.js`: active is `success`, expired is
  `secondary`.

No class was added to `frontend/assets/js/client/`: everything goes through `RequestStore`.

## Owner page behavior

### Scope picker

- A table with one row per family and Read/Write checkbox columns, grouped under Game,
  Characters, Documents, Inventory and Miniatures (`SCOPE_GROUPS`). The grouping is UI-only and
  never sent to the API.
- Rows come only from `options.json`'s `scopes`, so the frontend keeps no copy of the
  catalogue. A checkbox whose scope is not in the catalogue renders nothing.
- Shortcuts: "Select all read", "Select all write" (which also adds the reads) and "Clear".
  There is no "everything" shortcut.
- Ticking Write also ticks Read; unticking only removes that one scope. This is a UI
  convenience: on the backend `write` does not imply `read`.
- Each family has a help line (`family_<family>_help`), and a `scopes_note` explains that some
  restricted reads need the `read` scope of several families.

### Games picker

- Options are the reachable games from `options.json`, searched with `MultiResourcePickerField`
  (10 visible results) and shown as removable chips. Games are sent as a list of slugs.
- At 100 selected games no more options are offered and `games_limit` shows. The backend still
  rejects longer lists with `max_length`.
- No reachable games: `games_none_reachable` replaces the picker.
- Empty selection with reachable games: `games_empty_note` says the token covers every game the
  user can reach now and later.
- Empty selection with `all_games: true` (superusers): the `games_superuser_warning` alert. It
  warns but does not block. Plain staff get no special warning.

### Expiry

- Radios: 30 days, **90 days (default)**, custom date, never.
- Presets are `now + N × 24h`, computed at submit time and sent as `toISOString()`.
- The custom date is a `type="date"` input with `min` set to tomorrow; the token expires at
  `23:59:59.999` of that day in the browser's time zone, sent in UTC.
- Never sends `expires_at: null` and shows the `expiry_never_hint` warning.

### Create and the secret shown once

- The "New token" button is disabled until `options.json` has loaded. The Create button needs
  at least one scope, a complete expiry (a custom choice needs a date), loaded options and no
  submit in flight.
- The create call is `RequestStore.mutate` on `POST.collection` with
  `{name (trimmed), scopes, games (slugs), expires_at}`. A 400 maps `errors` onto the form; any
  other failure shows `generic_error` and keeps the form values.
- On success the modal switches to the secret view: the `secret_warning` alert, the full token
  in a read-only monospace input that selects everything on focus, a Copy button
  (`navigator.clipboard.writeText`, with `copied` on success and a visible `copy_failed` alert on
  failure, since this is the only chance to copy), a `usage_hint` and a Done button.
- The modal is static (`backdrop="static"`, `keyboard={false}`, no close button). Done resets
  the modal state, which clears the secret, and refreshes the list.
- The secret lives only in the modal's React state: never in `RequestStore`, browser storage,
  the URL or logs. The list is re-fetched, never built from the create response.

### List, rename and revoke

- The list keeps the API order (newest first). Columns: name, `mjr_<prefix>…`, scope badges
  ("Family: read", "write" or "read/write"), games chips or an "All games" badge with a tooltip,
  expires (`toLocaleDateString`, full date in a tooltip, or "Never"), last used
  (`toLocaleString` or "Never used"), created and the status badge from the API's `status`.
- Rename is inline: Enter or Save sends `PATCH.single` with `{name}`, Esc or Cancel aborts, and
  an unchanged trimmed name sends nothing. A 400 keeps edit mode and shows the name errors.
- Revoke goes through `ApiTokenRevokeConfirmModal`, then `DELETE.single`.
- A 404 on rename or revoke (the token is already gone) shows the `token_gone` info notice and
  refreshes the list. Other failures show `action_error`.
- The page purges the `apiToken` resource on mount, and after every change it purges and calls
  `ensure` again. Rows are never patched in place.

## Staff panel behavior

- Same columns as the owner list, read-only: no create, no rename, no "revoke all".
- Per-row Revoke with the shared confirm modal (staff copy names the owner). After a revoke the
  panel always refreshes, whatever the outcome; a 404 shows `token_gone`, other failures
  `staff_user_page.api_tokens_action_error`.
- Pending and denied users show an empty list, since their tokens were auto-revoked.

## Error mapping

Field errors render through `FieldErrors.jsx` (`Translator.t('errors.<code>')`). Only the
`name`, `scopes`, `games` and `expires_at` keys are wired on create, and only `name` on rename;
errors under any other key are not shown.

| Field | Codes |
|---|---|
| Name | `required`, `blank`, `max_length` |
| Scopes | `required`, `empty`, `invalid_scope`, `duplicate_scope` |
| Games | `game_not_reachable`, `duplicate_game`, `max_length` |
| Expiry | `invalid`, `expires_in_past` |

| Case | Owner page | Staff panel |
|---|---|---|
| Load failure | `load_error` with Retry | `staff_user_page.api_tokens_error` |
| `options.json` failure | `options_error` with Retry; "New token" disabled | — |
| Create, non-400 | `generic_error` | — |
| 404 on rename/revoke | `token_gone` (info) and refresh | `token_gone` (info) and refresh |
| Other mutation failure | `action_error` | `staff_user_page.api_tokens_action_error` |

## Data access

- **`utils/requests/config/apiTokenConfig.js`**, registered as `apiToken` in
  `resourceConfig.js`. Every entry is single-variant (identical `regular`/`private`,
  `permission: null`):

  | Key | Path |
  |---|---|
  | `GET.collection` | `/account/api_tokens.json` |
  | `GET.options` | `/account/api_tokens/options.json` |
  | `POST.collection` | `/account/api_tokens.json` |
  | `PATCH.single`, `DELETE.single` | `/account/api_tokens/:id.json` |

- **`utils/requests/config/staffUserConfig.js`** (resource `staffUser`): `GET.apiTokens` →
  `/staff/users/:id/api-tokens.json` and `DELETE.deleteApiToken` →
  `/staff/users/:id/api-tokens/:tokenId.json` (params `{id, tokenId}`).
- **No permission resolver:** `apiToken` is in the resolver-less list documented in
  `RequestPermissionResolvers.js`, so `NO_PERMISSIONS()` applies.
- **Client cache:** the owner endpoints are in `client/config/skipCacheEndpoints.js` and
  `skipCachePrefixes.js` (`/account/api_tokens/`); the staff list matches the
  `/api-tokens.json` suffix in `skipCacheSuffixes.js`. On the server every token endpoint sets
  `X-Skip-Cache: true`.

## i18n

Every label goes through the translation files, with the same keys in `en` and `pt`:

- `i18n/<lang>/api_tokens_page.yaml` (`api_tokens_page.*`): the owner page copy, also reused by
  the staff panel for column names, revoke copy and `token_gone`;
- `i18n/<lang>/staff_user_page.yaml`: `staff_user_page.api_tokens_*` (title, loading, error,
  empty, action error, actions column);
- `i18n/<lang>/common.yaml`: `header.nav_api_tokens` and the `errors.*` codes
  `invalid_scope`, `duplicate_scope`, `game_not_reachable`, `duplicate_game`,
  `expires_in_past`, `not_editable` and `token_not_allowed`.
