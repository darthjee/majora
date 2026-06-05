# Plan: Add Frontend Engine for Routes

## Overview

Implement a hash-based frontend routing engine for Majora, following the same six-layer
architecture used in the Oak project. All code is adapted to Majora's routes
(`/games`, `/games/:game_slug`, etc.) and the existing Jasmine test structure under
`frontend/specs/`.

## Context

The Majora backend exposes five JSON endpoints (all under `source/games/urls.py`):

| URL | Description |
|---|---|
| `GET /games.json` | List all games |
| `GET /games/<game_slug>.json` | Game detail |
| `GET /games/<game_slug>/pcs.json` | Player Characters for a game |
| `GET /games/<game_slug>/npcs.json` | Non-Player Characters for a game |
| `GET /games/<game_slug>/characters/<character_id>.json` | Character detail |

The current `App.jsx` is a static placeholder. `main.jsx` wraps it in
`@tanstack/react-query`, which is removed in this plan since data fetching is done
directly by `GenericClient`.

The reference implementation lives in
`/Users/darthjee/projetos/mine/oak/frontend/assets/js/`.

## Sub-plans

| File | Scope |
|---|---|
| [plan_utils.md](plan_utils.md) | Step 1 — `Route`, `Router`, `hashQueryParams`, `HashRouteResolver` |
| [plan_client.md](plan_client.md) | Step 2 — `GenericClient` |
| [plan_app.md](plan_app.md) | Steps 3 + 6 — `AppController`, `AppHelper`, `App.jsx`, `main.jsx` |
| [plan_pages.md](plan_pages.md) | Steps 4 + 5 — page stubs + page controllers |
| [plan_specs.md](plan_specs.md) | Step 7 — all Jasmine specs |

## Files to Change

**New files:**
- `frontend/assets/js/utils/Route.js`
- `frontend/assets/js/utils/Router.js`
- `frontend/assets/js/utils/hashQueryParams.js`
- `frontend/assets/js/utils/HashRouteResolver.js`
- `frontend/assets/js/client/GenericClient.js`
- `frontend/assets/js/components/AppController.js`
- `frontend/assets/js/components/helpers/AppHelper.jsx`
- `frontend/assets/js/components/elements/Header.jsx`
- `frontend/assets/js/components/pages/Games.jsx`
- `frontend/assets/js/components/pages/Game.jsx`
- `frontend/assets/js/components/pages/GamePcs.jsx`
- `frontend/assets/js/components/pages/GameNpcs.jsx`
- `frontend/assets/js/components/pages/Character.jsx`
- `frontend/assets/js/components/pages/controllers/BasePageController.js`
- `frontend/assets/js/components/pages/controllers/GamesController.js`
- `frontend/assets/js/components/pages/controllers/GameController.js`
- `frontend/assets/js/components/pages/controllers/GamePcsController.js`
- `frontend/assets/js/components/pages/controllers/GameNpcsController.js`
- `frontend/assets/js/components/pages/controllers/CharacterController.js`
- `frontend/specs/assets/js/utils/RouteSpec.js`
- `frontend/specs/assets/js/utils/RouterSpec.js`
- `frontend/specs/assets/js/utils/hashQueryParamsSpec.js`
- `frontend/specs/assets/js/utils/HashRouteResolverSpec.js`
- `frontend/specs/assets/js/client/GenericClientSpec.js`
- `frontend/specs/assets/js/components/AppControllerSpec.js`
- `frontend/specs/assets/js/components/helpers/AppHelperSpec.js`
- `frontend/specs/assets/js/components/pages/controllers/BasePageControllerSpec.js`
- `frontend/specs/assets/js/components/pages/controllers/GamesControllerSpec.js`
- `frontend/specs/assets/js/components/pages/controllers/GameControllerSpec.js`
- `frontend/specs/assets/js/components/pages/controllers/GamePcsControllerSpec.js`
- `frontend/specs/assets/js/components/pages/controllers/GameNpcsControllerSpec.js`
- `frontend/specs/assets/js/components/pages/controllers/CharacterControllerSpec.js`

**Modified files:**
- `frontend/assets/js/App.jsx` — rewrite with AppController routing pattern
- `frontend/assets/js/main.jsx` — remove react-query wrapper
- `frontend/specs/assets/js/AppSpec.js` — update for new App.jsx
- `frontend/specs/assets/js/mainSpec.js` — update for new main.jsx

## CI Checks

Before opening a PR, run the following checks for the `frontend/` folder:

- `npm test` (CircleCI job: `jasmine`)
- `npm run lint` (CircleCI job: `frontend-checks`)

## Notes

- Page components are stubs — full UI for each page is a separate concern.
- `BasePageController` omits `checkLogin` since Majora has no authentication layer.
- `@tanstack/react-query` is removed from `main.jsx`; it was unused in the routing flow.
- Route order in `HashRouteResolver` matters: `/games/:game_slug/pcs`,
  `/games/:game_slug/npcs`, and `/games/:game_slug/characters/:character_id` must be
  registered before `/games/:game_slug` to prevent the slug segment from matching
  those sub-paths.
