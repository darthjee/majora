# Issue: Scoped API tokens: staff token list and revoke

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). The epic records the agreed design: scope, permission model, token lifecycle, client shape and who manages tokens.

Add an **"API tokens" panel** to the staff user page (`#/staff/users/:id`) where staff and superusers list a user's scoped API tokens and revoke them. The design is settled in `docs/agents/specs/client/token-ui.md` (section "Staff panel"). The issue covers only the frontend; its blockers are merged:

- #1604 (PR #1644): the staff endpoints `GET /staff/users/:id/api-tokens.json` and `DELETE /staff/users/:id/api-tokens/:tokenId.json`.
- #1605 (PR #1645): the owner page and the shared pieces this panel reuses: `ApiTokenRevokeConfirmModal` (the staff copy is used when `ownerName` is given, `api_tokens_page.revoke_body_staff`), `ApiTokenCellsHelper` and `ApiTokenStatusBadges`.

## Problem

Staff can review and act on a user's recovery tokens from the staff user page, but have no way to see or revoke that user's scoped API tokens. Denying the user is the only lever today, and it revokes every token at once.

## Expected Behavior

- On `#/staff/users/:id`, an "API tokens" panel appears **below** the recovery-token panel.
- It lists the user's tokens with the same columns as the owner list: name, `mjr_<prefix>…`, scope badges, games (or an "All games" badge), expires, last used, created, status. It shows metadata only and never the secret. Rows follow the API order.
- The panel is read-only apart from a per-row **Revoke**. It has no create, no rename and no "Revoke all".
- Revoke asks for confirmation through `ApiTokenRevokeConfirmModal`, naming both the token and its owner. On success the list is re-fetched.
- A 404 on revoke (the token is already gone) shows an info alert ("This token no longer exists") and refreshes the list. It is not treated as a failure.
- An empty list shows "This user has no API tokens." Pending and denied users show it too, since their tokens were auto-revoked.
- A failed fetch shows an error inside the panel and never blanks the user details.
- Non-staff users never see the panel. This relies on the existing page-level redirect in `StaffUserController`, with no extra `AccessStore` check.

## Solution

- **Request config:** in `frontend/assets/js/utils/requests/config/staffUserConfig.js`, add `GET.apiTokens` → `/staff/users/:id/api-tokens.json` and `DELETE.deleteApiToken` → `/staff/users/:id/api-tokens/:tokenId.json`, single-variant and `permission: null`, mirroring `recoveryTokens` / `deleteRecoveryToken`. Update the file's doc comment.
- **Client cache:** make sure the staff token endpoints skip the client cache (`frontend/assets/js/client/config/skipCacheEndpoints.js` / `skipCachePrefixes.js`) if they are not covered yet.
- **Controller:** a new `StaffUserApiTokensController` in `frontend/assets/js/components/resources/staff_user/pages/controllers/`, a sibling of `StaffUserRecoveryTokensController`. It keeps its own `loading` / `error` / `actionError` state. After a revoke it purges `staffUser` and calls `ensure` again; it never patches a row.
- **Helper:** a new `#renderApiTokenPanel` in `StaffUserHelper`, below the recovery-token panel. It builds the rows from the shared `ApiTokenCellsHelper` and `ApiTokenStatusBadges`, and uses `ApiTokenRevokeConfirmModal` with `ownerName`. The owner's `ApiTokensTable` stays owner-only, since it carries inline rename.
- **i18n (`translator` agent):** panel copy as `staff_user_page.api_tokens_*` keys in `frontend/assets/i18n/{en,pt}/staff_user_page.yaml`: the title, the column headers if they are not shared, the empty state and the 404 info alert. Reuse the existing `api_tokens_page.*` and `errors.*` keys where they fit.
- **Tests:** Jasmine specs for the controller and the helper (load, empty, fetch error, revoke success with refresh, revoke 404 with info and refresh, revoke failure with `actionError`, the panel not rendered for non-staff) and for the new `staffUserConfig` entries. ESLint and the translation sync check pass.

Out of scope: backend changes (done in #1604), the owner page (done in #1605), a bulk "Revoke all" and a new staff route.

## Benefits

Staff can audit a user's automations and revoke a single leaked or misused token without denying the whole account, in the same way they already handle recovery tokens.
