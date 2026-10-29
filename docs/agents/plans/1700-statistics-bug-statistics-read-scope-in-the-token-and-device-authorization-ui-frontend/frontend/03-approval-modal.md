# Scopes on the approval modal

In `AuthorizeAuthorizationRequestModalHelper`, when `request.scopes` is a non-empty list:

- use the token-request title and body keys;
- render a "Requested permissions" list from `ApiTokenScopes.groupScopes(request.scopes)`, with the
  family labels and the Read/Write actions (catalogue labels only, unknown scopes dropped);
- when `statistics:read` is requested, render a warning alert with
  `authorization_requests_page.statistics_warning`.

Requests with no scopes keep today's title, body and content.

Specs: modal with scopes (title, list, labels), with `statistics:read` (warning shown), with an
unknown scope (not shown), and without scopes (unchanged).

## Files to Change

- `frontend/assets/js/components/resources/account/pages/elements/helpers/AuthorizeAuthorizationRequestModalHelper.jsx`
  — scopes list, warning and title switch.
- `frontend/specs/assets/js/components/resources/account/pages/elements/helpers/AuthorizeAuthorizationRequestModalHelperSpec.jsx`
  and `.../elements/AuthorizeAuthorizationRequestModalSpec.jsx` — specs.
