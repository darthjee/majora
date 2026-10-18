# Plan: Scoped API tokens: frontend token management page

Issue: [1605-scoped-api-tokens-frontend-token-management-page.md](../../issues/1605-scoped-api-tokens-frontend-token-management-page.md)

## Overview

Add the owner token page at `#/account/api_tokens`, backed by the #1604 endpoints through a new
`apiToken` RequestStore resource. The `frontend` agent builds the data config, route, header
item, shared token components (row cells, revoke modal), the create modal with the scope picker,
games picker (capped at 100) and expiry, and the page itself. The `translator` agent adds the
`api_tokens_page` namespace, the new `errors.*` codes and the header label in `en` and `pt`. The
architect adds the 100-game cap to `docs/agents/specs/client/token-ui.md`.
[`token-ui.md`](../../specs/client/token-ui.md) is the source of truth for behaviour and copy.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### API (already on `main`, from #1604)

- `GET /account/api_tokens.json` returns a plain array of token items, newest first.
- `GET /account/api_tokens/options.json` returns
  `{ scopes: string[] (sorted, "<family>:read|write"), games: [{slug, name}], all_games: bool }`.
- `POST /account/api_tokens.json` takes the body
  `{ name, scopes: string[], games?: string[] (slugs, ≤ 100), expires_at?: ISO string | null }`.
  It returns 201 with the token item plus `token` (the plain secret).
- `PATCH /account/api_tokens/:id.json` takes `{ name }` and returns 200 with the item.
- `DELETE /account/api_tokens/:id.json` returns 204.
- **Token item:** `{ id, name, prefix, scopes: string[], games: [{slug, name}], expires_at | null,
  last_used_at | null, created_at, status: "active" | "expired" }`.
- **400 body:** `{"errors": {"<field>": ["<code>"]}}`. The fields are `name`, `scopes`, `games` and
  `expires_at`.

### Scope families and groups (UI-only constant, `frontend`)

The 16 families come from `backend/accounts/scopes.py` `FAMILIES`, grouped as follows:

- `game`: games, players, sessions, polls, tasks, conversations
- `characters`: pcs, npcs, factions
- `documents`: documents
- `inventory`: items, common_items, possessions, recipes, treasures
- `miniatures`: miniatures

### i18n keys (`translator` writes them, `frontend` reads them)

Every key exists in both `en` and `pt`. The frontend may add keys during implementation; if it
does, it adds them to both languages and the translator agent reviews them.

- **`common.yaml`**
  - `header.nav_api_tokens`
  - `errors.invalid_scope`, `errors.duplicate_scope`, `errors.game_not_reachable`,
    `errors.duplicate_game`, `errors.expires_in_past`, `errors.not_editable`,
    `errors.token_not_allowed` and `errors.max_length`. Check whether `max_length` already
    exists; if it does, reuse it.
- **`api_tokens_page.yaml`** (top-level `api_tokens_page:`)
  - Page and list:
    - `title`, `intro`, `new_token`, `empty`, `load_error`, `retry`, `token_gone`, `action_error`
    - column labels: `col_name`, `col_prefix`, `col_scopes`, `col_games`, `col_expires`,
      `col_last_used`, `col_created`, `col_status`, `col_actions`
    - `all_games`, `all_games_tooltip`, `never`, `never_used`, `status_active`, `status_expired`
    - actions: `rename`, `save`, `cancel`, `revoke`
  - Revoke modal: `revoke_title`, `revoke_body` (interpolates `name`), `revoke_body_staff`
    (interpolates `name` and `owner`), `revoke_confirm`
  - Create form:
    - `create_title`, `name_label`, `scopes_label`, `scopes_note`, `select_all_read`,
      `select_all_write`, `clear`, `read`, `write`
    - group headings `group_game`, `group_characters`, `group_documents`, `group_inventory`,
      `group_miniatures`
    - `family_<family>` (label) and `family_<family>_help` (help line) for each of the 16
      families
    - games picker: `games_label`, `games_search`, `games_remove`, `games_none_reachable`,
      `games_empty_note` (interpolates `count`), `games_superuser_warning`, `games_limit` (interpolates
      `max`)
    - expiry: `expiry_label`, `expiry_30`, `expiry_90`, `expiry_custom`, `expiry_never`,
      `expiry_never_hint`
    - `create`, `options_error`, `generic_error`
  - Secret view: `created_title`, `secret_warning`, `copy`, `copied`, `copy_failed`,
    `usage_hint`, `done`
  - Scope badge: `scope_read`, `scope_write`, `scope_read_write`

## Architect follow-up (no specialist)

- Update `docs/agents/specs/client/token-ui.md`:
  - Under *Games picker*, add the 100-game cap: adding more is disabled at 100, with a hint.
  - In the *Error mapping* table, add `max_length` for the games picker.
  - Under *Testing strategy*, add the cap case.
  - Under *Affected code*, add `frontend/assets/js/client/config/skipCacheEndpoints.js` and
    `skipCachePrefixes.js`, and the `AppHelper.jsx` page registration.
- Optionally fix the out-of-date `index.js` note in `.claude/agents/translator.md`: namespaces
  are lazy-loaded through a Proxy, so no per-file import is needed.

## Reviews

- `security`: secret handling (React state only; never stored in RequestStore, storage, the URL
  or logs) and the use of `options.json`.
- `data-access`: owner-only RequestStore config, resolver-less.
- `cache` (read-only): token endpoints are skip-cache on the client and stay out of Navi.
