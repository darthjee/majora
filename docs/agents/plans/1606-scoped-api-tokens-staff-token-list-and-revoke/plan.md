# Plan: Scoped API tokens: staff token list and revoke

Issue: [1606-scoped-api-tokens-staff-token-list-and-revoke.md](../../issues/1606-scoped-api-tokens-staff-token-list-and-revoke.md)

## Overview

Add a read-only "API tokens" panel, with per-row Revoke, to the staff user page (`#/staff/users/:id`), below the recovery-token panel, as designed in `docs/agents/specs/client/token-ui.md` ("Staff panel"). The backend endpoints (#1604) and the shared token components (#1605) are already merged, so this is frontend and i18n work only: two `staffUserConfig` entries, a new `StaffUserApiTokensController`, a new panel helper built from `ApiTokenCellsHelper`, wiring in `StaffUser.jsx`, and the `staff_user_page.api_tokens_*` keys.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

New i18n keys, added by `translator` under `staff_user_page:` in `frontend/assets/i18n/{en,pt}/staff_user_page.yaml` and used by `frontend` through `Translator.t('staff_user_page.<key>')`:

| Key | English copy |
|---|---|
| `api_tokens_title` | `API tokens` |
| `api_tokens_loading` | `Loading API tokens...` |
| `api_tokens_error` | `Could not load this user's API tokens.` |
| `api_tokens_empty` | `This user has no API tokens.` |
| `api_tokens_action_error` | `Could not revoke the API token. Please try again.` |
| `api_tokens_actions_column` | `Actions` |

Existing keys reused unchanged by `frontend` (no new copy needed):

- `api_tokens_page.col_<column>` for the shared column headers (name, prefix, scopes, games, expires, last used, created, status);
- `api_tokens_page.revoke` for the row button;
- `api_tokens_page.token_gone` for the 404 info alert ("This token no longer exists. The list has been refreshed.");
- `api_tokens_page.revoke_title`, `revoke_body_staff` and `revoke_confirm`, through `ApiTokenRevokeConfirmModal` with `ownerName`.

Request config (frontend only, listed for reference): `staffUser` resource, `GET.apiTokens` → `/staff/users/:id/api-tokens.json` and `DELETE.deleteApiToken` → `/staff/users/:id/api-tokens/:tokenId.json`, params `{ id, tokenId }`.
