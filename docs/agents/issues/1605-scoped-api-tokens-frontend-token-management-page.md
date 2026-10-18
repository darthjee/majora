# Issue: Scoped API tokens: frontend token management page

## Description
Part of epic #1592 (Majora client for automations, with fine-grained API tokens). #1604 added the owner token endpoints (`account/api_tokens.json`, `account/api_tokens/options.json`, `account/api_tokens/<id>.json`), and they are on `main`.

This issue adds the owner token page at `#/account/api_tokens`, where an approved user creates, lists, renames and revokes their own scoped API tokens. [`docs/agents/specs/client/token-ui.md`](../specs/client/token-ui.md) is the source of truth for layout, copy, error mapping, data access and tests. The staff panel is #1606, which is blocked by this issue because it reuses the shared components built here.

## Problem
The backend can create and manage scoped tokens, but users have no UI for it. Without this page nobody can get a token for the client (#1607 onward). The plain secret also needs careful handling: the user sees it exactly once and it must never land in a cache or in storage.

## Expected Behavior
- **Route and navigation:** `#/account/api_tokens` is registered in `HashRouteResolver.js`. An "API tokens" item appears in the header account dropdown after "Authorization requests". The page has `PageActions backHref="#/my_account"`. A logged-out visit gets the same 401 handling as `AuthorizationRequestsController`.
- **Create modal** (a "New token" button):
  - Name: required, trimmed, `maxLength=100`.
  - **Scope picker:** a table of the 16 families with Read and Write columns, grouped as Game / Characters / Documents / Inventory / Miniatures. The family-to-group map is a UI-only constant, and the scopes themselves come from `options.json`. Shortcuts: "Select all read", "Select all write" and "Clear". Ticking Write also ticks Read. Each family has a help line. Create stays disabled until at least one scope is ticked.
  - **Games picker:** a searchable multi-select over the reachable games from `options.json`, with selected games shown as removable chips. An empty selection shows the "all N games you can reach, and any you join later" note. With `all_games: true` and nothing selected, a yellow superuser warning appears. With no reachable games, a "not in any game yet" note appears. The picker stops at **100 selected games**, the backend cap (`GAMES_MAX_COUNT` in #1604): once 100 are selected, adding more is disabled and a hint explains the limit.
  - **Expiry:** radio buttons for 30 days, 90 days (default), Custom date and Never. Presets are sent as `toISOString()`. A custom date (`type="date"`, `min` = tomorrow) expires at 23:59:59 local time, converted to UTC. Never sends `null`, with a soft risk hint.
- **Secret shown once:** on a 201, the same modal (static, only Done closes it) shows the warning, the full token in a read-only monospace input that selects all on focus, a Copy button (`navigator.clipboard.writeText`, with a "Copied" confirmation and a visible failure message) and the usage hint. Done clears the secret from state and re-fetches the list.
- **List:** name, `mjr_<prefix>…`, per-family scope badges, games (or an "All games" badge), expires, last used, created and an Active/Expired status badge taken from the API. Rows keep the API order. There is an empty state.
- **Rename** is inline: Enter saves, Esc cancels, and an unchanged name sends nothing. **Revoke** goes through the shared `ApiTokenRevokeConfirmModal`. A 404 on either shows an info alert and refreshes the list.
- **Errors:** 400 field errors render through `FieldErrors.jsx`, using the spec field mapping. A backend `max_length` error on `games` is also mapped to the games picker. A 5xx or network error keeps the form values for a retry. If `options.json` fails to load, Create is disabled and an alert offers a retry.

## Solution
- **Data access:** a new `utils/requests/config/apiTokenConfig.js`, registered as resource `apiToken` in `resourceConfig.js`. Every entry is single-variant (`regular` = `private`, `permission: null`): `GET.collection`, `GET.options`, `POST.collection`, `PATCH.single` and `DELETE.single`. `apiToken` is added to the resolver-less list in the `RequestPermissionResolvers.js` doc comment. After a mutation, the controller calls `mutate`, purges `apiToken` and runs `ensure` again. Rows are never patched in place.
- **Secret handling:** the token goes from the `mutate` response straight into the modal's React state. It is never stored in `RequestStore`, `localStorage`/`sessionStorage`, the URL or logs.
- **Components** (under `components/resources/account/pages/`): `ApiTokens.jsx`, `ApiTokensController.js`, `ApiTokensHelper.jsx`, `CreateApiTokenModal` (form view and secret view), `ApiTokenScopePicker` and `ApiTokenGamesPicker`. The shared pieces reused by #1606 are `ApiTokenRevokeConfirmModal` (with an optional owner name) and the token row cells. No new class goes in `frontend/assets/js/client/`.
- **i18n** (`translator` agent): new `errors.*` codes (`invalid_scope`, `duplicate_scope`, `game_not_reachable`, `duplicate_game`, `expires_in_past`, `not_editable`, `token_not_allowed`) in `common.yaml`, and a new `api_tokens_page.yaml` for `en` and `pt`. The translation sync check must pass.
- **Tests:** Jasmine specs as listed in the spec's testing strategy. These cover the controller and helper flows (load, empty, error, create → secret → Done → refresh, rename, revoke, 404 refresh), the scope picker, the games picker notes and warning, expiry conversion, clipboard success and failure, and the new `resourceConfig` entries. ESLint passes.
- **Spec update:** add the 100-game cap (the picker limit and the `max_length` mapping for the Games picker) to `token-ui.md` (Games picker and Error mapping), plus a Jasmine case for the cap.
- **Review:** the `security` agent checks the secret handling and the `options.json` usage.
- **Out of scope:** the staff panel, the `staffUserConfig.js` entries and the staff i18n (#1606), plus any backend change (#1604, #1643).

## Benefits
Users can create least-privilege tokens for their automations by themselves. The secret is shown exactly once and never persisted. The shared components make #1606 a small follow-up.
