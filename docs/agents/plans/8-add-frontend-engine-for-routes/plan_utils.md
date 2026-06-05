# Plan: Utility Layer

## `frontend/assets/js/utils/Route.js`

Identical to the Oak version. Encapsulates a single route pattern, compiles `:param`
segments to regex capture groups, and exposes `matches`, `params`, and `page`.

```js
export default class Route {
  #regex;
  #paramNames;
  #page;

  constructor(path, page) {
    this.#paramNames = [];
    const pattern = path.replace(/:([^/]+)/g, (_, name) => {
      this.#paramNames.push(name);
      return '([^/]+)';
    });
    this.#regex = new RegExp(`^${pattern}/?$`);
    this.#page = page;
  }

  matches(route) {
    return this.#regex.test(route);
  }

  params(route) {
    const match = route.match(this.#regex);
    if (!match) return {};
    return this.#paramNames.reduce((acc, name, index) => {
      acc[name] = match[index + 1] || '';
      return acc;
    }, {});
  }

  get page() { return this.#page; }
}
```

---

## `frontend/assets/js/utils/Router.js`

Identical to the Oak version. Maintains a singleton class-level registry and exposes
both static and instance `register`/`resolve`, plus `static extractParams` and
`static reset` for test isolation.

```js
import Route from './Route.js';

export default class Router {
  static #registry = null;
  #routes = [];

  static #getRegistry() {
    if (!Router.#registry) Router.#registry = new Router();
    return Router.#registry;
  }

  static register(path, page) { Router.#getRegistry().register(path, page); }
  static resolve(route)       { return Router.#getRegistry().resolve(route); }
  static reset()              { Router.#registry = null; }

  static extractParams(path, route = '') {
    const normalized = Router.#normalizeRoute(route);
    return new Route(path, 'tmp').params(normalized);
  }

  register(path, page) { this.#routes.push(new Route(path, page)); }

  resolve(route) {
    const match = this.#routes.find((r) => r.matches(route));
    return match ? match.page : 'home';
  }

  static #normalizeRoute(route = '') {
    const path = String(route).split('?')[0];
    return path.startsWith('#') ? path.slice(1) : path;
  }
}
```

---

## `frontend/assets/js/utils/hashQueryParams.js`

Identical to the Oak version. Extracts all query params from the hash string.

```js
export default function getHashQueryParams(hash = '') {
  const questionMarkIndex = hash.indexOf('?');
  if (questionMarkIndex === -1) return new URLSearchParams();
  return new URLSearchParams(hash.slice(questionMarkIndex + 1));
}
```

---

## `frontend/assets/js/utils/HashRouteResolver.js`

Same structure as Oak. Only the registered routes differ — Majora's five game routes
replace the Oak category/kinds routes.

**Route registration order (most specific first):**

```
/games/:game_slug/characters/:character_id  →  'character'
/games/:game_slug/pcs                       →  'gamePcs'
/games/:game_slug/npcs                      →  'gameNpcs'
/games/:game_slug                           →  'game'
/games                                      →  'games'
(unmatched)                                 →  'home'
```

```js
import Router from './Router.js';

export default class HashRouteResolver {
  #hashProvider;
  #router;

  static #buildRouter() {
    const router = new Router();
    router.register('/games/:game_slug/characters/:character_id', 'character');
    router.register('/games/:game_slug/pcs',                      'gamePcs');
    router.register('/games/:game_slug/npcs',                     'gameNpcs');
    router.register('/games/:game_slug',                          'game');
    router.register('/games',                                     'games');
    return router;
  }

  constructor(hashProvider = () => (typeof window === 'undefined' ? '' : window.location.hash)) {
    this.#hashProvider = hashProvider;
    this.#router = HashRouteResolver.#buildRouter();
  }

  currentHash() { return this.#hashProvider(); }

  getPage() {
    const hash = this.currentHash();
    const withoutHash = hash.startsWith('#') ? hash.slice(1) : hash;
    const route = withoutHash.split('?')[0];
    return this.#router.resolve(route);
  }

  getPaginationParams() {
    const questionMarkIndex = this.currentHash().indexOf('?');
    if (questionMarkIndex === -1) return new URLSearchParams();

    const query = new URLSearchParams(this.currentHash().slice(questionMarkIndex + 1));
    const params = new URLSearchParams();
    const page = query.get('page');
    const perPage = query.get('per_page');

    if (page !== null)    params.set('page', page);
    if (perPage !== null) params.set('per_page', perPage);

    return params;
  }
}
```
