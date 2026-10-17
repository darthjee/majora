# Issue: Client spec: improve token-ui.md

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). Review
`docs/agents/specs/client/token-ui.md`, written in #1593, and close its gaps before
implementation (#1605 owner page, #1606 staff view). Topic: the frontend token management page
and the staff token view.

## Problem

`token-ui.md` lists its open questions (routes, navigation, scope grouping, games loading,
components) but leaves them unsettled. Reading it against `token-api.md`, `scopes.md` and the
code also showed cross-page gaps:

- **"Reachable game" is inconsistent.** The epic and `token-ui.md` say "as DM, player or PC
  owner"; `token-api.md` (#1596) says "any game the owner's roles let them read", which, with
  game list/detail being `AllowAny`, literally means every game.
- **No way for the UI to get the scope catalogue.** `scopes.md` says the backend constant feeds
  the token UI's options, but no endpoint exposes it.
- **Obligations stated elsewhere are missing here:** the superuser warning on an empty games list,
  the "games joined later" copy for `games: []`, and the `expired` status display.
- **The data-access line is inaccurate:** account pages bypass `RequestStore` today, so "like
  other account data" does not describe a real pattern.

## Expected Behavior

- `docs/agents/specs/client/token-ui.md` records every decision below, has no unresolved open
  questions, and is ready to drive #1605 and #1606.
- `docs/agents/specs/client/token-api.md` is amended for the reachable-game definition, the new
  `options.json` endpoint (row, access, tests) and the superuser-only warning wording.
- The hub `docs/agents/specs/client.md` notes the `token-api.md` amendment and the shared pieces
  #1606 reuses from #1605, and its Order section says #1606 comes after #1605.

## Solution

Decisions settled during `/enhance-issue`. Each becomes a section of `token-ui.md` (and, where noted, an amendment to `token-api.md`).

### Routes and navigation

- **Owner page route:** `#/account/api_tokens` (registered in `HashRouteResolver.js`), mirroring
  the API path `account/api_tokens.json`, as `#/account/authorization_requests` does.
- **Create flow on the same page:** a "New token" button opens a modal; on success the same modal
  switches to the secret-shown-once view, and closing it refreshes the list. No separate `/new`
  route. (Details of the secret view: see the secret-display topic.)
- **Header entry:** a new "API tokens" item in the account dropdown (`HeaderHelper.jsx`), after
  "Authorization requests". Shown under the same logged-in rule as the dropdown.
- **My Account page:** no link added; the header dropdown stays the hub for account pages.
- **Back link:** `PageActions backHref="#/my_account"`, like the authorization requests page.
- **Staff view:** no new route. An "API tokens" panel on `#/staff/users/:id`, below the
  recovery-token panel in `StaffUserHelper`.
- **Logged-out direct visit:** same 401 handling as `AuthorizationRequestsController`.

### Scope picker

- **Layout:** a table with one row per family (16) and two checkbox columns, Read and Write.
  Rows are grouped under headings:
  - **Game:** games, players, sessions, polls, tasks, conversations;
  - **Characters:** pcs, npcs, factions;
  - **Documents:** documents;
  - **Inventory:** items, common_items, possessions, recipes, treasures;
  - **Miniatures:** miniatures.
- **Grouping is UI-only:** a frontend constant mapping family → group. It is never sent to the
  API. Rejected: a flat list of 32 checkboxes (too long).
- **Shortcuts:** "Select all read", "Select all write", "Clear". No "everything" shortcut, so a
  full-power token is a deliberate choice. Rejected: per-group checkboxes.
- **Write ticks Read:** ticking Write on a family also ticks its Read; Read can still be
  unticked by hand. A UI convenience only — the backend rule (`write` does not imply `read`) is
  unchanged.
- **Help text:** one i18n line per family describing what it covers (e.g. NPCs include
  everything nested under them, photos included), plus a note that some restricted reads need
  the `read` scope of several families.
- **Client-side validation:** the Create button stays disabled until at least one scope is
  ticked; the backend `empty` error is still mapped.
- **List display:** each token's scopes are shown as compact badges per family
  (e.g. "NPCs: read/write"), in the same group order, not as raw scope strings.

### Games picker and reachable games

- **"Reachable" is redefined precisely:** the games where the owner is DM, a player or a PC
  owner, **plus every game for superusers**. Staff who are not superusers count as members only
  (staff power is about `staff/*`, not game content). This replaces `token-api.md`'s "any game
  the owner's roles let them read", which, with game list/detail being `AllowAny`, would
  literally mean every game.
- **One backend helper/queryset** drives create-time validation of `games`, request-time
  resolution of `games: []`, and the picker's options, so UI and backend cannot disagree.
- **New endpoint `GET account/api_tokens/options.json`** (session-only, single private variant,
  `X-Skip-Cache: true`, same access rows as the other owner endpoints, scoped tokens get 403
  `token_not_allowed`). Response:
  `{"scopes": ["<family>:<action>", ...], "games": [{"slug": "...", "name": "..."}], "all_games": false}` —
  `scopes` is the backend catalogue constant (also settles how the catalogue reaches the UI),
  `games` is the reachable-games helper's output, sorted by name, and `all_games` is `true` when
  the reachable set is every game (superusers), driving the warning in the copy topic.
  - Rejected: `my-games.json` (membership only, so superusers miss games; carries counts the
    picker does not need; its definition could drift from validation).
  - Rejected: `games.json` (domain-scoped, public, lists games the user cannot use).
  - Rejected: a JS copy of the catalogue (drifts from the backend constant).
- **Picker UI:** a searchable multi-select (client-side type-ahead over the bounded list), with
  selected games shown as removable chips. Leaving it empty means "every game you can reach,
  including games you join later" (copy: see the warnings topic).
- **No reachable games:** the picker shows a "you're not in any game yet" note; only the empty
  (all games) option remains, and game-scoped scopes do nothing until the user joins a game.
- **Spec impact:** amend `docs/agents/specs/client/token-api.md` under this issue — the
  reachable-game definition, the `options.json` row in the owner endpoint table, its access and
  test rows — and note it in the hub. #1604 (still open) implements it.

### Secret shown once

- **The create modal switches to a "Token created" view** on a 201. It shows a warning that the
  token cannot be shown again, the full token, a Copy button, a one-line usage hint
  (`Authorization: Bearer <token>` or `MAJORA_TOKEN=<token>`), and a Done button.
- **Field:** a read-only, monospace text input whose whole value is selected on focus, so manual
  copy works when the clipboard API is unavailable. Shown in full; no mask/reveal toggle.
- **Copy:** `navigator.clipboard.writeText`, following the recovery-link precedent
  (`StaffUsersHelper.jsx` / `StaffUsersController.js`), with a short "Copied" confirmation.
  Unlike that precedent, a **failure shows a visible message** ("copy failed, select and copy it
  manually"), since this is the only chance to copy.
- **Static modal:** only Done closes it (`backdrop="static"`, `keyboard={false}`, no ✕). No
  confirmation on Done, and Done is not gated on Copy having been clicked.
- **After Done:** the secret is cleared from component state and the token list is re-fetched.
- **Reload or navigation away:** the secret is lost, as expected; the token still exists and can
  be revoked. No `beforeunload` prompt.
- **Where the secret lives:** only in the modal's React state. Never in `RequestStore` or any
  cache, never in `localStorage`/`sessionStorage`, the URL or the hash, never logged. The create
  call is a mutation, and the list is re-fetched rather than built from the create response.

### Expiry

- **Control:** radio buttons — 30 days, **90 days (default)**, Custom date, Never. Rejected:
  Never as the default (encourages long-lived tokens).
- **Presets:** `now + 30/90 × 24h`, computed in the browser at submit time and sent as
  `toISOString()` (UTC).
- **Custom date:** a `type="date"` input with `min` = tomorrow. The token expires at the **end of
  the chosen day (23:59:59) in the browser's time zone**, converted to UTC. Rejected:
  `datetime-local` (fiddly), start of day (surprising).
- **Never:** sends `expires_at: null`, with a soft hint that non-expiring tokens are riskier.
- **Clock skew:** a backend `expires_in_past` is shown on the expiry field (see error mapping).
- **List "Expires" column:** `toLocaleDateString(Translator.getLanguage())`, "Never" for `null`,
  with the full date and time in a tooltip.
- **Status badge:** Active / Expired, taken from the API's `status` (not recomputed in the
  client; it updates on the next list fetch), styled like `RecoveryTokenStatusBadges.js`.
- **No "expires soon" warning** in this epic.
- **Order:** the API order (newest first, `-created_at`); expired tokens are not moved to the end.
- **Expired tokens** keep Rename and Revoke. No "renew": the user creates a new token.
- **"Last used" column:** `toLocaleString(Translator.getLanguage())`, or "Never used" for `null`.

### Warnings and copy

- **Empty games list, every role:** an inline note with the reachable count from
  `options.json` — "No games selected: this token can be used on all N games you can reach
  today, and on any game you join later."
- **Superuser warning:** when `options.json` returns `all_games: true` and the games list is
  empty, a yellow alert warns that the token can act on every game in Majora, now and in future,
  and suggests selecting specific games. A warning, not a block. Rejected: deciding in the
  frontend with `useStaffOrSuperUser` (it includes plain staff and duplicates the backend
  definition).
- **Plain staff get no special warning**, since they reach member games only. This corrects
  `token-api.md`'s "warns staff and superusers" to superusers only.
- **List display of `games: []`:** an "All games" badge, with a tooltip reusing the
  "including games joined later" sentence.
- **Other copy (all through i18n):**
  - Page intro: what API tokens are for (automations, the `client/` package); a token never does
    more than its owner can; it cannot manage tokens or the account; tokens are revoked
    automatically if the account is suspended.
  - Revoke confirmation: names the token, says automations using it stop working immediately,
    and that this cannot be undone.
  - Empty list: "You have no API tokens yet."
  - Plus the scope help texts, the "Never" expiry hint and the secret warning from the topics
    above.

### Error mapping

- **Reuse the existing pipeline:** 400 bodies `{"errors": {"<field>": ["<code>"]}}` go to the
  form's field errors and are rendered by `FieldErrors.jsx` (`Translator.t('errors.<code>')`),
  as `MyAccountController` does.
- **Field mapping:**
  - Name (create and inline rename): `required`, `blank`, `max_length` — existing keys. The input
    also sets `maxLength=100` and trims the value.
  - Scope picker: `required`, `empty` (existing), `invalid_scope`, `duplicate_scope` (new).
  - Games picker: `game_not_reachable`, `duplicate_game` (new). `game_not_reachable` tells the
    user a selected game is no longer available and to reload and pick again.
  - Expiry: `invalid` (existing), `expires_in_past` (new; mentions checking the device clock).
  - `not_editable` (new, generic).
- **Codes the UI cannot normally trigger** (`invalid_scope`, `duplicate_scope`, `duplicate_game`,
  `not_editable`) get short generic "reload the page" messages, not detailed copy.
- **Non-field errors:**
  - 401: the existing handling, as in `AuthorizationRequestsController`.
  - 403 `token_not_allowed`: cannot happen from the browser; generic error. An
    `errors.token_not_allowed` key is still added.
  - **404 on rename or revoke** (owner or staff; token already gone, unknown user): an info alert
    "This token no longer exists" and a list refresh — not treated as a failure.
  - 5xx / network: a generic error inside the modal; the form keeps its values for a retry.
  - `options.json` failing to load: the create button is disabled, with an alert and a retry.
- **i18n placement:** new codes in the shared `errors:` block of `i18n/<lang>/common.yaml`; page
  copy in a new `i18n/<lang>/api_tokens_page.yaml`; the staff panel's copy in the staff user
  page's file. Every key in both `en` and `pt`.

### Staff panel

- **Mirrors the recovery-token panel** in `StaffUserHelper`: a new `#renderApiTokenPanel`,
  titled "API tokens", **below** the recovery-token panel.
- **Controller:** a new `StaffUserApiTokensController`, a sibling of
  `StaffUserRecoveryTokensController`: its own `loading`/`error`/`actionError` state (a fetch
  failure never blanks the user details), and the same post-action refresh (`RequestStore.purge`
  then `ensure`, never patching a row). Rejected: folding it into the recovery-token controller.
- **Access:** relies on the page-level redirect in `StaffUserController`; no extra
  `AccessStore` check, as in the recovery panel.
- **Columns:** the same as the owner list (name, `mjr_<prefix>…`, scope badges, games or "All
  games", expires, last used, created, status). Read-only: no create, no rename.
- **Actions:** per-row Revoke with confirmation only. **No "Revoke all"** (no bulk endpoint;
  denying the user already revokes everything).
- **Shared pieces built in #1605 and reused in #1606:**
  - `ApiTokenRevokeConfirmModal`, taking the token name and, in the staff variant, the owner's
    name. Rejected: generalizing `RecoveryTokenActionConfirmModal` (built around three recovery
    actions).
  - The token row cell rendering (scope badges, games badge, dates, status badge).
- **No special cases:** pending/denied users simply show an empty list (tokens were
  auto-revoked); staff viewing their own page and superuser targets work the same, per
  `token-api.md`.
- **Empty state:** "This user has no API tokens."
- **i18n:** `staff_user_page.api_tokens_*` keys in the existing staff user page file.

### Data access

- **Owner endpoints go through `RequestStore`**, as the epic decided — unlike the other account
  pages (`AuthorizationRequestsController`, `MyAccountController`), which call `AuthClient`
  directly. The spec's "like other account data" wording is replaced by "with a single-variant
  config and no resolver, like `staffUser`".
- **New `utils/requests/config/apiTokenConfig.js`,** registered as resource `apiToken` in
  `resourceConfig.js`. Every entry is single-variant (`regular` = `private`,
  `permission: null`), mirroring `staffUserConfig.js`:
  - `GET.collection` → `/account/api_tokens.json`;
  - `GET.options` → `/account/api_tokens/options.json`;
  - `POST.collection` → `/account/api_tokens.json` (create);
  - `PATCH.single` and `DELETE.single` → `/account/api_tokens/:id.json`.
- **No resolver:** `apiToken` joins the documented list of resolver-less resources in
  `RequestPermissionResolvers.js` (with `staffUser`, `poll`, `task`), so the default
  `NO_PERMISSIONS()` applies. No `AccessStore` call.
- **Staff endpoints go in the existing `staffUserConfig.js`:** `GET.apiTokens` →
  `/staff/users/:id/api-tokens.json` and `DELETE.deleteApiToken` →
  `/staff/users/:id/api-tokens/:tokenId.json`, mirroring `recoveryTokens` /
  `deleteRecoveryToken`.
- **Refresh after a change:** `mutate` purges `apiToken` (or `staffUser`), then the controller
  calls `ensure` again for the whole list. No row patching, including from the rename response.
- **`options.json` caching:** cached by `RequestStore` for the page's life, and purged together
  with `apiToken` after every mutation (same resource). A page reload always refreshes it.
- **Secret:** read from the `mutate` response's `.json()` straight into modal state;
  `RequestStore.mutate` never caches responses, so nothing keeps the secret.

### Components, boundaries, testing and security

- **Components and controllers:** follow the page/controller/helper pattern of the account and
  staff pages — `ApiTokens.jsx` + `ApiTokensController.js` + `ApiTokensHelper.jsx`, a
  `CreateApiTokenModal` (form view and secret view), `ApiTokenScopePicker`,
  `ApiTokenGamesPicker`, and the shared `ApiTokenRevokeConfirmModal` and row cells. No new class
  in `frontend/assets/js/client/` (everything goes through `RequestStore`).
- **Scope boundaries:** #1605 owns the owner page, its config, the shared components and the
  owner i18n; #1606 owns the staff panel, its controller, the `staffUserConfig.js` entries and
  the staff i18n. The `options.json` endpoint and the reachable-games redefinition belong to
  #1604. **#1606 is blocked by #1605** (not only by #1604), since it reuses the shared components.
- **Edge cases:** covered per topic above (no reachable games, membership lost between load and
  submit, clock skew, token already gone → 404 refresh, expired tokens, `options.json` failing).
  **Rename is inline** in the list row (no modal): Enter saves, Esc cancels, an unchanged name
  sends nothing.
- **Backward compatibility:** purely additive — a new route, header item, staff panel and i18n
  keys; no existing page, endpoint or legacy DRF `Token` behaviour changes.
- **Testing strategy:** Jasmine specs for each new controller and helper (load, empty, error,
  create → secret view → Done → refresh, rename, revoke, 404 refresh), the scope picker (Write
  ticks Read, shortcuts, disabled Create), the games picker (empty-list note, superuser warning
  on `all_games`), expiry conversion (presets, end-of-day custom date in local time to UTC), the
  clipboard success and failure paths, and the new `resourceConfig` entries. The translation
  sync check covers en/pt parity.
- **Performance and security:** lists are small and unpaginated; `options.json` is cached per
  page and purged on mutations. The secret lives only in modal state (see above). The
  `security` agent reviews #1605 at implementation time for the secret-handling rules and
  `options.json`; no review at spec stage.

## Benefits

- #1605 and #1606 can be implemented without design decisions left to the implementer.
- The UI and the backend share one definition of reachable games and one scope catalogue, so
  they cannot disagree.
- Secret handling, error mapping and refresh behaviour follow existing codebase patterns
  (recovery-token panel, `FieldErrors`, `RequestStore` purge-then-ensure).
