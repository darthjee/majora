# Fetch domain config at bootstrap

Add a client method to fetch `GET /domain/config.json`, following the existing `AuthClient#headerStatus` precedent (`frontend/assets/js/client/AuthClient.js:51`, `getJson('/users/header_status.json', ...)`, extending `BaseClient`). This is a public, unauthenticated GET — no token/auth handling needed, unlike `headerStatus`.

Trigger this fetch once at app bootstrap, alongside (not necessarily inside) the existing `HeaderController`'s `header_status` fetch (`frontend/assets/js/components/common/header/controllers/HeaderController.js`) — `Header` mounts on every page and already owns comparable bootstrap-effect wiring, making it the natural place, but confirm this is still true given the current shape of `HeaderController`'s effect before committing to it. Store the resolved `{ favicon, title, sub_title }` somewhere `HeaderHelper` (step 02) and the favicon/tab-title side effect (step 03) can both read it from.

## Files to Change

- `frontend/assets/js/client/DomainClient.js` (new) — `config()` method calling `getJson('/domain/config.json')`
- `frontend/assets/js/components/common/header/controllers/HeaderController.js` — trigger the fetch, hold the resolved config in state
