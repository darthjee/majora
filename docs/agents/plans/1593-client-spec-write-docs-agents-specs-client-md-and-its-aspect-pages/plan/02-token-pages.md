# Token aspect pages

Write the four token-side pages using the shared template (Overview, Decisions, Open questions,
Affected code).

- **`tokens.md`**:
  - Decisions:
    - the `ApiToken` fields: owner, name, hashed secret, non-secret prefix, scopes, optional list
      of games, optional expiry, last used, created at;
    - the `Authorization: Bearer mjr_<prefix>_<secret>` format, which keeps scoped tokens apart
      from the legacy `Token <key>`;
    - the secret is shown once, and only the name can be edited;
    - expiry is optional (30 or 90 days, a custom date, or never), and expired tokens are
      rejected;
    - revocation is immediate, with no per-user limit;
    - tokens are revoked for good when the owner leaves `approved`, including the staff deny flow,
      which already destroys DRF tokens.
  - Why a custom model was chosen over DRF `Token`, knox and OAuth2.
  - Open questions (#1594): the hashing algorithm, prefix length, where the last-used update
    happens and how often it is written, and the auto-revoke hook point.
- **`scopes.md`**:
  - Decisions:
    - a request needs both the owner's role and the token's scope to allow it;
    - resource × action scopes;
    - the optional list of games;
    - the endpoint families tokens can never reach (token management, account data, staff);
    - uploads follow the scope of the resource they attach to;
    - enforcement must fail closed.
  - Open questions (#1595): the full scope catalogue, the survey of views, and the enforcement
    mechanism (per-view declaration or a central URL map).
- **`token-api.md`**:
  - Decisions:
    - owner endpoints (create, list, rename, revoke) accept a logged-in session only;
    - staff can list and revoke any user's tokens (metadata only, never the secret), mirroring the
      recovery tokens in `access-control/user.md`;
    - every token endpoint sets `X-Skip-Cache: true`;
    - the backend rejects any game the owner cannot reach.
  - Open questions (#1596): URL shapes, payloads, error codes, and how the PHP proxy and the Navi
    cache treat `Authorization: Bearer` requests.
- **`token-ui.md`**:
  - Decisions:
    - the owner token page: create form, the secret shown once, list, rename, revoke;
    - the scope picker shows the full catalogue; the games picker lists only games the user can
      reach;
    - a staff section on the staff user page;
    - reads go through `RequestStore` and `RequestPermissionResolvers`;
    - i18n.
  - Open questions (#1597): routes, navigation entry points, and how scopes are grouped in the
    picker.

## Files to Change

- `docs/agents/specs/client/tokens.md`: new.
- `docs/agents/specs/client/scopes.md`: new.
- `docs/agents/specs/client/token-api.md`: new.
- `docs/agents/specs/client/token-ui.md`: new.
