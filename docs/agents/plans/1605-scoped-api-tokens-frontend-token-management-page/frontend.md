# Frontend Plan: Scoped API tokens: frontend token management page

Main plan: [plan.md](plan.md)

## Shared contracts

- **API and token item shape:** see [plan.md](plan.md#api-already-on-main-from-1604).
- **Scope families and groups:** see
  [plan.md](plan.md#scope-families-and-groups-ui-only-constant-frontend).
- **i18n keys:** see
  [plan.md](plan.md#i18n-keys-translator-writes-them-frontend-reads-them). The translator agent
  writes them. If you need a key that isn't listed, add it to both `en` and `pt` yourself, so
  that `check_i18n` stays green.

## Steps

- [01 — apiToken request config and skip-cache](frontend/01-request-config.md)
- [02 — Route, page registration and header item](frontend/02-route-and-header.md)
- [03 — Shared token cells and revoke modal](frontend/03-shared-components.md)
- [04 — Scope picker, games picker and expiry](frontend/04-form-pickers.md)
- [05 — Create modal with secret view](frontend/05-create-modal.md)
- [06 — Page, controller and helper](frontend/06-page.md)

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`, which runs
  `npm run coverage`).
- `frontend`: `docker-compose run --rm majora_fe yarn lint` and `yarn check_i18n` (CI job:
  `frontend-checks`).

## Notes

- **Spec file naming:** Jasmine only picks up `**/*[sS]pec.js`, so every new spec must be named
  `*Spec.js`. The 8 existing `*Spec.jsx` files never run. Fixing that is out of scope.
- **Specs mirror the source tree** under `frontend/specs/assets/js/...`. Controller specs get
  one file per method inside a folder named after the controller, e.g.
  `controllers/ApiTokensController/buildEffectSpec.js`.
- **Secret handling (security review):** the plain `token` goes only from the create
  `mutate` response's `.json()` into `CreateApiTokenModal` React state. It is cleared on Done and
  never put in RequestStore, `localStorage`/`sessionStorage`, the URL/hash or `console`.
- **Out of scope:** the staff panel, `staffUserConfig.js` and the staff i18n (#1606). Build the
  shared components so #1606 can reuse them as they are.
