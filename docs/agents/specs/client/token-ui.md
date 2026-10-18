# Token UI

The frontend pages where users manage their scoped tokens, and where staff review them. Part of
the [client spec](../client.md) (epic #1592). Refined by #1597 and implemented by #1605 (owner
page) and #1606 (staff view).

## Overview

The SPA gains two surfaces, both backed by the [Token API](token-api.md) through a logged-in
session and both read through `RequestStore`:

- the **owner token page** at `#/account/api_tokens`, where a user creates, lists, renames and
  revokes their own tokens;
- an **"API tokens" panel** on the staff user page (`#/staff/users/:id`), where staff list and
  revoke a user's tokens.

## Decisions

### Routes and navigation

- **Owner page route:** `#/account/api_tokens`, registered in `HashRouteResolver.js`. It mirrors
  the API path `account/api_tokens.json`, as `#/account/authorization_requests` does.
- **Create flow on the same page:** a "New token" button opens a modal. On success the same
  modal switches to the secret view (see [Secret shown once](#secret-shown-once)), and closing
  it refreshes the list. Rejected: a separate `/new` route.
- **Header entry:** a new "API tokens" item in the account dropdown (`HeaderHelper.jsx`), after
  "Authorization requests", shown under the same logged-in rule as the dropdown.
- **My Account page:** no link added; the header dropdown stays the hub for account pages.
- **Back link:** `PageActions backHref="#/my_account"`, like the authorization requests page.
- **Staff view:** no new route. An "API tokens" panel on `#/staff/users/:id`, below the
  recovery-token panel in `StaffUserHelper` (see [Staff panel](#staff-panel)).
- **Logged-out direct visit:** the same 401 handling as `AuthorizationRequestsController`.

### Owner token page

#### Scope picker

- **Layout:** a table with one row per family (16) and two checkbox columns, Read and Write
  (the catalogue is in [Scopes](scopes.md)). Rows are grouped under headings:
  - **Game:** games, players, sessions, polls, tasks, conversations;
  - **Characters:** pcs, npcs, factions;
  - **Documents:** documents;
  - **Inventory:** items, common_items, possessions, recipes, treasures;
  - **Miniatures:** miniatures.
- **Grouping is UI-only:** a frontend constant maps family → group. It is never sent to the API.
  The scopes themselves come from `options.json` (see
  [Options](token-api.md#options-get-accountapi_tokensoptionsjson)), never from a JS copy of the
  catalogue. Rejected: a flat list of 32 checkboxes (too long).
- **Shortcuts:** "Select all read", "Select all write" and "Clear". There is no "everything"
  shortcut, so a full-power token is a deliberate choice. Rejected: per-group checkboxes.
- **Write ticks Read:** ticking Write on a family also ticks its Read; Read can still be unticked
  by hand. This is a UI convenience only: the backend rule (`write` does not imply `read`) is
  unchanged.
- **Help text:** one i18n line per family describing what it covers (for example, NPCs include
  everything nested under them, photos included), plus a note that some restricted reads need
  the `read` scope of several families.
- **Client-side validation:** the Create button stays disabled until at least one scope is
  ticked. The backend `empty` error is still mapped.
- **List display:** each token's scopes are shown as compact badges per family (for example
  "NPCs: read/write"), in the same group order, not as raw scope strings.

#### Games picker

- **Options:** the [reachable games](token-api.md#reachable-game) returned by `options.json`:
  the games where the user is DM, a player or a PC owner, plus every game for superusers. The
  backend validates the selection with the same helper, so the picker is not the only guard.
  - Rejected: `my-games.json` (membership only, so superusers miss games; carries counts the
    picker does not need; its definition could drift from validation).
  - Rejected: `games.json` (domain-scoped, public, lists games the user cannot use).
- **Picker UI:** a searchable multi-select (client-side type-ahead over the bounded list), with
  selected games shown as removable chips.
- **Empty selection:** means "every game you can reach, including games you join later" (see
  [Warnings and copy](#warnings-and-copy)).
- **No reachable games:** the picker shows a "you're not in any game yet" note. Only the empty
  (all games) option remains, and game-scoped scopes do nothing until the user joins a game.
- **Selection cap:** at most **100 selected games**, the backend cap (`GAMES_MAX_COUNT` in
  #1604). Once 100 are selected, adding more is disabled and a hint
  (`api_tokens_page.games_limit`) explains the limit. The backend still rejects a longer list
  with `max_length` (see [Error mapping](#error-mapping)).

#### Expiry

- **Control:** radio buttons — 30 days, **90 days (default)**, Custom date, Never. Rejected:
  Never as the default (it encourages long-lived tokens).
- **Presets:** `now + 30/90 × 24h`, computed in the browser at submit time and sent as
  `toISOString()` (UTC).
- **Custom date:** a `type="date"` input with `min` set to tomorrow. The token expires at the
  **end of the chosen day (23:59:59) in the browser's time zone**, converted to UTC. Rejected:
  `datetime-local` (fiddly) and start of day (surprising).
- **Never:** sends `expires_at: null`, with a soft hint that non-expiring tokens are riskier.
- **Clock skew:** a backend `expires_in_past` is shown on the expiry field (see
  [Error mapping](#error-mapping)).
- **No "expires soon" warning** in this epic.

#### Secret shown once

- **The create modal switches to a "Token created" view** on a 201. It shows a warning that the
  token cannot be shown again, the full token, a Copy button, a one-line usage hint
  (`Authorization: Bearer <token>` or `MAJORA_TOKEN=<token>`) and a Done button.
- **Field:** a read-only, monospace text input whose whole value is selected on focus, so manual
  copy works when the clipboard API is unavailable. Shown in full; no mask/reveal toggle.
- **Copy:** `navigator.clipboard.writeText`, following the recovery-link precedent
  (`StaffUsersHelper.jsx` / `StaffUsersController.js`), with a short "Copied" confirmation.
  Unlike that precedent, **a failure shows a visible message** ("copy failed, select and copy it
  manually"), since this is the only chance to copy.
- **Static modal:** only Done closes it (`backdrop="static"`, `keyboard={false}`, no close
  button). Done asks for no confirmation and is not gated on Copy having been clicked.
- **After Done:** the secret is cleared from component state and the token list is re-fetched.
- **Reload or navigation away:** the secret is lost, as expected; the token still exists and can
  be revoked. No `beforeunload` prompt.

#### List, rename and revoke

- **Columns:** name, `mjr_<prefix>…`, scope badges, games (or an "All games" badge), expires,
  last used, created, status.
- **Order:** the API order (newest first, `-created_at`); expired tokens are not moved to the
  end.
- **"Expires" column:** `toLocaleDateString(Translator.getLanguage())`, "Never" for `null`, with
  the full date and time in a tooltip.
- **"Last used" column:** `toLocaleString(Translator.getLanguage())`, or "Never used" for
  `null`.
- **Status badge:** Active / Expired, taken from the API's `status` (not recomputed in the
  client; it updates on the next list fetch), styled like `RecoveryTokenStatusBadges.js`.
- **Expired tokens** keep Rename and Revoke. There is no "renew": the user creates a new token.
- **Rename is inline** in the list row (no modal): Enter saves, Esc cancels, and an unchanged
  name sends nothing. Only the name can be edited.
- **Revoke** goes through the shared `ApiTokenRevokeConfirmModal` and removes the token at once.
- **404 on rename or revoke** (the token is already gone): an info alert and a list refresh,
  not a failure (see [Error mapping](#error-mapping)).

### Warnings and copy

- **Empty games list, every role:** an inline note with the reachable count from
  `options.json` — "No games selected: this token can be used on all N games you can reach
  today, and on any game you join later."
- **Superuser warning:** when `options.json` returns `all_games: true` and the games list is
  empty, a yellow alert warns that the token can act on every game in Majora, now and in future,
  and suggests selecting specific games. It is a warning, not a block. Rejected: deciding in the
  frontend with `useStaffOrSuperUser` (it includes plain staff and duplicates the backend
  definition).
- **Plain staff get no special warning**, since they reach member games only (see
  [Reachable game](token-api.md#reachable-game)).
- **List display of `games: []`:** an "All games" badge, with a tooltip reusing the "including
  games joined later" sentence.
- **Other copy (all through i18n):**
  - Page intro: what API tokens are for (automations, the `client/` package); a token never does
    more than its owner can; it cannot manage tokens or the account; tokens are revoked
    automatically if the account is suspended.
  - Revoke confirmation: names the token, says automations using it stop working immediately,
    and that this cannot be undone.
  - Empty list: "You have no API tokens yet."
  - Plus the scope help texts, the "Never" expiry hint and the secret warning above.

### Error mapping

- **Reuse the existing pipeline:** 400 bodies `{"errors": {"<field>": ["<code>"]}}` go to the
  form's field errors and are rendered by `FieldErrors.jsx` (`Translator.t('errors.<code>')`),
  as `MyAccountController` does.
- **Field mapping:**

  | Field | Codes | Notes |
  |---|---|---|
  | Name (create and inline rename) | `required`, `blank`, `max_length` | Existing keys. The input also sets `maxLength=100` and trims the value. |
  | Scope picker | `required`, `empty` (existing); `invalid_scope`, `duplicate_scope` (new) | |
  | Games picker | `game_not_reachable`, `duplicate_game` (new); `max_length` (existing) | `game_not_reachable` says a selected game is no longer available, and to reload and pick again. `max_length` covers more than 100 games, which the picker cap normally prevents. |
  | Expiry | `invalid` (existing); `expires_in_past` (new) | `expires_in_past` mentions checking the device clock. |
  | Any field | `not_editable` (new) | Generic. |

- **Codes the UI cannot normally trigger** (`invalid_scope`, `duplicate_scope`, `duplicate_game`,
  `not_editable`) get short generic "reload the page" messages, not detailed copy.
- **Non-field errors:**
  - 401: the existing handling, as in `AuthorizationRequestsController`.
  - 403 `token_not_allowed`: cannot happen from the browser; a generic error. An
    `errors.token_not_allowed` key is still added.
  - **404 on rename or revoke** (owner or staff; token already gone, unknown user): an info
    alert "This token no longer exists" and a list refresh, not treated as a failure.
  - 5xx / network: a generic error inside the modal; the form keeps its values for a retry.
  - `options.json` failing to load: the create button is disabled, with an alert and a retry.

### Staff panel

- **Mirrors the recovery-token panel** in `StaffUserHelper`: a new `#renderApiTokenPanel`,
  titled "API tokens", **below** the recovery-token panel.
- **Controller:** a new `StaffUserApiTokensController`, a sibling of
  `StaffUserRecoveryTokensController`, with its own `loading`/`error`/`actionError` state (a
  fetch failure never blanks the user details) and the same post-action refresh
  (`RequestStore.purge` then `ensure`, never patching a row). Rejected: folding it into the
  recovery-token controller.
- **Access:** relies on the page-level redirect in `StaffUserController`; no extra `AccessStore`
  check, as in the recovery panel.
- **Columns:** the same as the owner list (metadata only, never the secret). Read-only: no
  create, no rename.
- **Actions:** per-row Revoke with confirmation only. **No "Revoke all"** (there is no bulk
  endpoint, and denying the user already revokes everything).
- **No special cases:** pending and denied users simply show an empty list (their tokens were
  auto-revoked); staff viewing their own page and superuser targets work the same, per
  [Token API](token-api.md).
- **Empty state:** "This user has no API tokens."

### Data access

- **Owner endpoints go through `RequestStore`**, as the epic decided, unlike the other account
  pages (`AuthorizationRequestsController`, `MyAccountController`), which call `AuthClient`
  directly. They use a single-variant config and no resolver, like `staffUser`, following the
  `RequestPermissionResolvers` rules in [`issue-enhancement.md`](../../issue-enhancement.md).
- **New `utils/requests/config/apiTokenConfig.js`**, registered as resource `apiToken` in
  `resourceConfig.js`. Every entry is single-variant (`regular` = `private`,
  `permission: null`), mirroring `staffUserConfig.js`:
  - `GET.collection` → `/account/api_tokens.json`;
  - `GET.options` → `/account/api_tokens/options.json`;
  - `POST.collection` → `/account/api_tokens.json` (create);
  - `PATCH.single` and `DELETE.single` → `/account/api_tokens/:id.json`.
- **No resolver:** `apiToken` joins the documented list of resolver-less resources in
  `RequestPermissionResolvers.js` (with `staffUser`, `poll` and `task`), so the default
  `NO_PERMISSIONS()` applies. No `AccessStore` call.
- **Staff endpoints go in the existing `staffUserConfig.js`:** `GET.apiTokens` →
  `/staff/users/:id/api-tokens.json` and `DELETE.deleteApiToken` →
  `/staff/users/:id/api-tokens/:tokenId.json`, mirroring `recoveryTokens` /
  `deleteRecoveryToken`.
- **Refresh after a change:** `mutate`, then purge `apiToken` (or `staffUser`), then the
  controller calls `ensure` again for the whole list. No row patching, including from the rename
  response.
- **`options.json` caching:** cached by `RequestStore` for the page's life, and purged together
  with `apiToken` after every mutation (same resource). A page reload always refreshes it.
- **Proxy cache:** every token endpoint has a single private variant with `X-Skip-Cache: true`
  (see [Token API](token-api.md#token-endpoints-and-navi)).
- **Secret never stored:** it is read from the `mutate` response's `.json()` straight into the
  modal's React state. `RequestStore.mutate` never caches responses, and the list is re-fetched
  rather than built from the create response, so nothing else keeps the secret.

### i18n

- Every label, message and warning goes through the translation files under
  `frontend/assets/i18n/`, with the same keys in every language (`en` and `pt`).
- **Placement:**
  - new error codes in the shared `errors:` block of `i18n/<lang>/common.yaml`;
  - owner page copy in a new `i18n/<lang>/api_tokens_page.yaml`;
  - staff panel copy as `staff_user_page.api_tokens_*` keys in the existing staff user page
    file.

### Components and boundaries

- **Components and controllers** follow the page/controller/helper pattern of the account and
  staff pages: `ApiTokens.jsx` + `ApiTokensController.js` + `ApiTokensHelper.jsx`, a
  `CreateApiTokenModal` (form view and secret view), `ApiTokenScopePicker`,
  `ApiTokenGamesPicker`, and the shared `ApiTokenRevokeConfirmModal` and row cells. No new class
  in `frontend/assets/js/client/`: everything goes through `RequestStore`.
- **Shared pieces built in #1605 and reused in #1606:**
  - `ApiTokenRevokeConfirmModal`, taking the token name and, in the staff variant, the owner's
    name. Rejected: generalizing `RecoveryTokenActionConfirmModal` (built around three recovery
    actions).
  - The token row cell rendering (scope badges, games badge, dates, status badge).
- **Scope boundaries:**
  - #1605 owns the owner page, `apiTokenConfig.js`, the shared components and the owner i18n.
  - #1606 owns the staff panel, its controller, the `staffUserConfig.js` entries and the staff
    i18n.
  - The `options.json` endpoint and the reachable-games definition belong to #1604.
  - **#1606 is blocked by #1605** (not only by #1604), since it reuses the shared components.
- **Backward compatibility:** purely additive — a new route, header item, staff panel and i18n
  keys. No existing page, endpoint or legacy DRF `Token` behaviour changes.

### Testing strategy

Jasmine specs for:

- each new controller and helper: load, empty, error, create → secret view → Done → refresh,
  rename, revoke, and the 404 refresh;
- the scope picker: Write ticks Read, the shortcuts, the disabled Create button;
- the games picker: the empty-list note, the superuser warning on `all_games`, and the
  100-game cap (adding is disabled at 100 and the limit hint shows);
- expiry conversion: the presets, and the end-of-day custom date in local time converted to UTC;
- the clipboard success and failure paths;
- the new `resourceConfig` entries.

The translation sync check covers `en`/`pt` parity.

### Security and performance

- **The secret lives only in the modal's React state.** Never in `RequestStore` or any cache,
  never in `localStorage`/`sessionStorage`, the URL or the hash, and never logged.
- **Lists are small and unpaginated;** `options.json` is cached per page and purged on
  mutations.
- The `security` agent reviews #1605 at implementation time, for the secret-handling rules and
  `options.json`. There is no review at spec stage.

## Open questions

None. Settled by #1597 and recorded under [Decisions](#decisions).

## Affected code

- `frontend/assets/js/utils/routing/HashRouteResolver.js`: the new `#/account/api_tokens` route.
- `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx`: the "API tokens"
  dropdown item.
- `frontend/assets/js/components/resources/account/pages/`: the new API tokens page,
  controller, helper and elements (create modal, pickers, revoke modal, row cells).
- `frontend/assets/js/components/resources/staff_user/pages/`: the "API tokens" panel in the
  helper and the new `StaffUserApiTokensController`.
- `frontend/assets/js/utils/requests/config/apiTokenConfig.js` (new),
  `frontend/assets/js/utils/requests/config/staffUserConfig.js`,
  `frontend/assets/js/utils/requests/resourceConfig.js` and
  `frontend/assets/js/utils/requests/RequestPermissionResolvers.js` (the doc comment listing
  resolver-less resources).
- `frontend/assets/js/client/config/skipCacheEndpoints.js` and
  `frontend/assets/js/client/config/skipCachePrefixes.js`: the token endpoints skip the client
  cache.
- `frontend/assets/js/components/AppHelper.jsx` (or wherever pages are registered): the new
  page registration.
- `frontend/assets/js/components/common/forms/FieldErrors.jsx`: reused, unchanged.
- `frontend/assets/i18n/{en,pt}/common.yaml` (new `errors.*` codes), the new
  `frontend/assets/i18n/{en,pt}/api_tokens_page.yaml`, and the staff user page translation file.
