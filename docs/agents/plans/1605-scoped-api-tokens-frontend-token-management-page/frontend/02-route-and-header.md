# Route, page registration and header item

- In `HashRouteResolver.js`, add `['/account/api_tokens', 'accountApiTokens']` next to the
  existing `['/account/authorization_requests', 'accountAuthorizationRequests']` entry, before
  `/my_account`.
- In `components/helpers/AppHelper.jsx`, import `ApiTokens` and add
  `accountApiTokens: <ApiTokens />` to `PAGES`, next to `accountAuthorizationRequests`. Step 06
  builds the page; until then, a minimal page is enough to wire up.
- In `HeaderHelper.jsx`, add a
  `<NavDropdown.Item href="#/account/api_tokens" data-testid="api-tokens-link">` with
  `Translator.t('header.nav_api_tokens')`, directly after the authorization requests item in the
  `LOGGED_IN` account dropdown. My Account gets no link.

Specs:

- Extend `HeaderHelper/myAccountAndLanguageSpec.js`: the link is absent when logged out, and
  present with the right href and text when logged in.
- Add a route resolution case to the existing `HashRouteResolver` spec.

## Files to Change

- `frontend/assets/js/utils/routing/HashRouteResolver.js`
- `frontend/assets/js/components/helpers/AppHelper.jsx`
- `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx`
- `frontend/specs/assets/js/components/common/header/helpers/HeaderHelper/myAccountAndLanguageSpec.js`
- the existing `HashRouteResolver` spec under `frontend/specs/assets/js/utils/routing/`
