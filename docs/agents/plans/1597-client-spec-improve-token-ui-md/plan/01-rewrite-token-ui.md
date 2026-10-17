# Rewrite token-ui.md

Rewrite `docs/agents/specs/client/token-ui.md` from the issue's Solution section, keeping the
hub's aspect-page template.

- **Overview:** keep, and mention the two surfaces (`#/account/api_tokens` owner page, the
  "API tokens" panel on `#/staff/users/:id`), both through `RequestStore`.
- **Decisions:** replace the current subsections with:
  - Routes and navigation;
  - Owner token page, split into: Scope picker; Games picker; Expiry; Secret shown once;
    List, rename and revoke (inline rename; shared revoke confirm modal; 404 → info + refresh);
  - Warnings and copy (empty-games count note, superuser `all_games` warning, "All games"
    badge, intro, revoke confirmation, empty states);
  - Error mapping (field mapping table, non-field errors, i18n placement);
  - Staff panel;
  - Data access (`apiTokenConfig.js` entries, `staffUserConfig.js` entries, no resolver,
    purge-then-ensure, `options.json` caching, secret never stored);
  - i18n (keep the existing rule; add the file placement);
  - Components and boundaries (#1605 vs #1606, #1606 blocked by #1605, shared pieces);
  - Testing strategy;
  - Security and performance (secret handling rules; `security` review on #1605).
- Correct the old data-access line: drop "like other account data"; state the single-variant,
  resolver-less config "like `staffUser`".
- Replace the old games-picker line ("as DM, player or PC owner") with a link to
  [Reachable game](token-api.md#reachable-game).
- **Open questions:** "None. Settled by #1597."
- **Affected code:** update the list:
  - `frontend/assets/js/utils/routing/HashRouteResolver.js` (new route);
  - `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx` (dropdown item);
  - new `frontend/assets/js/components/resources/account/pages/` page, controller, helper and
    elements for API tokens;
  - `frontend/assets/js/components/resources/staff_user/pages/` (helper panel, new controller);
  - `frontend/assets/js/utils/requests/config/apiTokenConfig.js` (new),
    `config/staffUserConfig.js`, `resourceConfig.js`, `RequestPermissionResolvers.js` (doc
    comment listing resolver-less resources);
  - `frontend/assets/js/components/common/forms/FieldErrors.jsx` (reused, unchanged);
  - `frontend/assets/i18n/{en,pt}/common.yaml` (new `errors.*` codes), new
    `api_tokens_page.yaml`, the staff user page file.
  - Remove the `frontend/assets/js/client/` bullet: no new client class is needed.

## Files to Change

- `docs/agents/specs/client/token-ui.md` — full rewrite as above.
