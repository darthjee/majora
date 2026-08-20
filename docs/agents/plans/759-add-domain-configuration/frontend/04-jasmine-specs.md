# Jasmine specs

Cover, following this repo's existing spec layout (`frontend/specs/assets/js/...` mirroring `frontend/assets/js/...`):

- `DomainClient#config` — calls `getJson('/domain/config.json')` with no auth token, following `specs/assets/js/client/AuthClient`'s existing spec shape for `headerStatus`.
- `HeaderHelper` — renders `title`/`sub_title` from the passed-in config prop instead of the removed i18n keys; `""` sub-title renders nothing (existing behavior, now driven by config instead of a translation string).
- `HeaderController` (or wherever step 01/03 landed the fetch + side effect) — the favicon `<link>` is left untouched when `favicon` is `null`, and rewritten when it's a real path; `document.title` is set from the resolved `title`.

## Files to Change

- `frontend/specs/assets/js/client/DomainClient/...` — new spec
- `frontend/specs/assets/js/components/common/header/helpers/HeaderHelper/...` — updated spec
- `frontend/specs/assets/js/components/common/header/controllers/HeaderController/...` — updated/new spec for the favicon/tab-title side effect
