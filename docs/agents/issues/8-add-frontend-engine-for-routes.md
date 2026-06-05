# Issue: Add Frontend Engine for Routes

## Description

The frontend needs a hash-based routing engine so that navigating to `/#/path` loads the
corresponding React page and fetches data from `/path.json` on the backend. This covers all
current backend routes (excluding admin routes) and must include a generic HTTP client layer.

## Problem

- There is no routing mechanism in the frontend: navigating to different URLs does not load
  different pages or data.
- There is no centralized HTTP client — components would need to call `fetch` directly with
  no shared error handling or pagination support.

## Expected Behavior

- Navigation via `window.location.hash` (e.g. `/#/games`, `/#/games/my-campaign/pcs`)
  renders the correct React component and fetches the corresponding `.json` endpoint.
- The routing system resolves parameterized patterns (e.g. `/games/:game_slug/characters/:character_id`)
  and extracts named parameters for use in data-fetching controllers.
- A `GenericClient` handles all HTTP communication (GET, GET with pagination, POST, PATCH),
  forwarding hash query params as needed.

## Solution

Implement six layers:

### Layer 1 — `Route` (`frontend/assets/js/utils/Route.js`)
Encapsulates a single route pattern (e.g. `/games/:game_slug/characters/:character_id`).
Compiles it to a regex with named capture groups. Exposes:
- `matches(path)` — returns `true` if the path matches.
- `params(path)` — returns a map of named parameter values.

### Layer 2 — `Router` (`frontend/assets/js/utils/Router.js`)
Registry of `Route` instances. Exposes:
- `register(path, page)` — adds a route.
- `resolve(route)` — returns the page identifier for a path, or `'home'` if none matches.
- `static extractParams(path, hash)` — extracts named params from a hash without a registered
  router instance (used by page controllers).

### Layer 3 — `HashRouteResolver` (`frontend/assets/js/utils/HashRouteResolver.js`)
Registers all known application routes (in specificity order — more specific first):

| Hash URL | Page identifier | JSON endpoint |
|---|---|---|
| `#/games/:game_slug/characters/:character_id` | `character` | `GET /games/:game_slug/characters/:character_id.json` |
| `#/games/:game_slug/pcs` | `gamePcs` | `GET /games/:game_slug/pcs.json` |
| `#/games/:game_slug/npcs` | `gameNpcs` | `GET /games/:game_slug/npcs.json` |
| `#/games/:game_slug` | `game` | `GET /games/:game_slug.json` |
| `#/games` | `games` | `GET /games.json` |
| `#/` or unrecognized | `home` | — |

Also exposes `getPaginationParams()` to extract `page` and `per_page` from the hash query string.

### Layer 4 — `AppController` + `App.jsx`
`AppController` (`frontend/assets/js/components/AppController.js`) wraps `HashRouteResolver`,
listens to `hashchange` events, and updates the React page state. `App.jsx` wires it into the
React component tree via `useState`, `useMemo`, and `useEffect`.

### Layer 5 — `AppHelper` (`frontend/assets/js/components/helpers/AppHelper.jsx`)
Maps page identifier strings to React components:

```js
const PAGES = {
  games, game, gamePcs, gameNpcs, character, home
};
```

Uses `key={hash}` on the rendered fragment to force remount on hash change.

### Layer 6 — `GenericClient` (`frontend/assets/js/client/GenericClient.js`)
Central HTTP layer. All page controllers use this instead of calling `fetch` directly.

| Method | HTTP verb | Hash params forwarded | Pagination headers read |
|---|---|---|---|
| `fetch(path)` | GET | all params | no |
| `fetchIndex(path)` | GET | `page`, `per_page` only | yes |
| `post(path, body)` | POST | none | no |
| `patch(path, body)` | PATCH | none | no |

`fetchIndex` returns `{ data, pagination }` where `pagination` comes from response headers
(`page`, `pages`, `per_page`; defaults: `1`, `1`, `10`).

### Page controllers
Each page controller uses `Router.extractParams()` to read `game_slug`/`character_id` from
the current hash and passes the constructed path to `GenericClient`.

## Benefits

- Clean separation between routing, data fetching, and rendering.
- Testable: `hashProvider` injection means controllers and `GenericClient` can be unit-tested
  without touching `window`.
- Consistent error handling: any non-2xx response throws an `Error` with the request path.
- Pagination support built into `fetchIndex` with sensible defaults.

---
See issue for details: https://github.com/darthjee/majora/issues/8
