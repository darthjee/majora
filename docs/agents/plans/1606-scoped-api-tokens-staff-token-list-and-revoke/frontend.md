# Frontend Plan: Scoped API tokens: staff token list and revoke

Main plan: [plan.md](plan.md)

## Shared contracts

Use these new keys (added by `translator`) as `Translator.t('staff_user_page.<key>')`: `api_tokens_title`, `api_tokens_loading`, `api_tokens_error`, `api_tokens_empty`, `api_tokens_action_error`, `api_tokens_actions_column`.

Reuse existing keys: `api_tokens_page.col_<column>` (column headers), `api_tokens_page.revoke` (row button), `api_tokens_page.token_gone` (404 info alert). The revoke modal copy comes from `ApiTokenRevokeConfirmModal` itself when `ownerName` is passed.

## Steps

- [01 — Request config and client cache](frontend/01-request-config.md)
- [02 — StaffUserApiTokensController](frontend/02-controller.md)
- [03 — API tokens panel and page wiring](frontend/03-panel.md)

## CI Checks

- `frontend`: ESLint and the Jasmine suite, through `docker-compose` / `make` as described in `AGENTS.md` (never `npm` on the host).

## Notes

- `StaffUserHelper.jsx` is already 253 lines and ESLint warns at 300 (`max-lines`). Put the panel rendering in a new `StaffUserApiTokensHelper.jsx` and have `StaffUserHelper` call it, rather than growing `StaffUserHelper` past the limit.
- Do not reuse `ApiTokensTable` from the owner page: it carries inline rename. Build the staff table from `ApiTokenCellsHelper` instead, so both lists render cells identically.
- No `AccessStore` check: `StaffUserController` already redirects non-staff before the page mounts. The "non-staff never see the panel" acceptance criterion is covered by the existing `StaffUserController` redirect spec plus a `StaffUser` spec asserting the panel is not rendered while the user fetch is loading or failed.
- The secret is never in the staff payload; do not add any secret handling.
