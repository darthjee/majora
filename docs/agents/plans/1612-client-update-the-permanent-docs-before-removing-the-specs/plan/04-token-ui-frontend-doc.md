# Token UI frontend doc

Move the spec's `token-ui.md` into a new page under `docs/agents/frontend/`, checked against
the implementation:

- `frontend/assets/js/components/resources/account/pages/ApiTokens.jsx` and its
  `elements/` (`ApiTokensTable`, `CreateApiTokenModal`, `ApiTokenScopePicker`,
  `ApiTokenScopeCheckbox`, `ApiTokenScopeSelection`, `ApiTokenExpiry`, `ApiTokensRetryAlert`
  and the helpers);
- the staff panel (`staff_user/pages/helpers/StaffUserApiTokensHelper.jsx`,
  `controllers/StaffUserApiTokensController.js`);
- data access (`utils/requests/config/apiTokenConfig.js`, `staffUserConfig.js`,
  `RequestStore`, `RequestPermissionResolvers.js`) and routing (`HashRouteResolver.js`).

Cover routes and navigation, the scope picker, the games picker, expiry, the secret shown
once, list/rename/revoke, warnings and copy, error mapping, the staff panel, data access, i18n
namespaces and the component boundaries (the shared revoke confirm modal and row cells).
Register the page in `docs/agents/frontend/index.md` (and `docs/agents/frontend.md` if it
lists pages).

## Files to Change

- `docs/agents/frontend/api-tokens.md` — new.
- `docs/agents/frontend/index.md` — register the page.
- `docs/agents/frontend.md` — register the page, if it lists pages.
