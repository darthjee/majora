# Front-End Architecture

The Majora front-end is a React + Vite SPA located in `frontend/`. It runs in its own Docker
container (`majora_fe`) and is served through the Tent proxy.

---

## Runtime Boot Flow

1. `frontend/index.html` defines `<div id="root"></div>` and loads `/assets/js/main.jsx`.
2. `frontend/assets/js/main.jsx` imports Bootstrap CSS/JS and local CSS, then mounts `<App />`.
3. `frontend/assets/js/components/App.jsx` uses `AppController` to resolve the current hash route
   and render the matching page component.

---

## Running Locally

```bash
# Start the full stack (proxy + backend + frontend dev server)
make dev-up

# Frontend tests
cd frontend && yarn test

# Frontend lint
cd frontend && yarn lint
```

The Vite dev server runs on port 8080 inside the container (`majora_fe`), exposed at port 3010.
When `FRONTEND_DEV_MODE=true` in `.env`, the Tent proxy (port 3000) forwards all front-end
requests to the Vite dev server with HMR enabled.

---

## Directory Structure

```
frontend/
  assets/
    css/
      styles.css          # custom CSS
      main.scss           # custom SCSS
    js/
      client/             # HTTP API clients
      components/
        App.jsx             # app shell (lives at components root)
        AppController.js    # app shell controller (lives at components root)
        elements/           # reusable UI building blocks
          controllers/      # element controllers (.js)
          helpers/          # element JSX helpers (.jsx)
        helpers/            # JSX helpers shared across pages (.jsx)
        pages/              # top-level route components
          controllers/      # page controllers (.js)
          helpers/          # page JSX helpers (.jsx)
      i18n/                # translation singleton, storage, and events (.js)
      utils/              # non-JSX utility classes (.js)
      main.jsx            # SPA entry point
    i18n/                 # bundled YAML translation files (en.yaml, ...)
  specs/                  # Jasmine tests (mirror assets/js/ structure)
  index.html
  package.json
  vite.config.js
  eslint.config.mjs
```

See [Frontend i18n](i18n.md) for the translation layer (`Translator`,
`LanguageStorage`, `LanguageEvents`, and the header language selector).

---

## Component Architecture

Every non-trivial component is split into three layers.

### Component (`.jsx`)

The React component. Responsible for:

- Declaring state with `useState`
- Wiring effects with `useEffect`, delegating all logic to the controller
- Delegating all rendering to the helper

Stays lean — no business logic, no inline JSX beyond top-level conditionals.

```jsx
// pages/Games.jsx
export default function Games() {
  const [games, setGames] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new GamesController(setGames, setPagination, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  if (loading) return GamesHelper.renderLoading();
  if (error)   return GamesHelper.renderError(error);
  return GamesHelper.render(games, pagination);
}
```

### Controller (`.js` in `controllers/`)

A plain JS class. Responsible for:

- Data fetching via the API client
- Building `useEffect` callbacks (`buildEffect()`)
- Preventing state updates after unmount (`buildSafeSetter()` from `BasePageController`)

No JSX. Receives state setters in the constructor.

```js
// pages/controllers/GamesController.js
export default class GamesController extends BasePageController {
  constructor(setGames, setPagination, setLoading, setError, client = null) {
    super();
    this.client = client ?? new GenericClient();
    // ... assign setters
  }

  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      this.client.fetchIndex('/games.json')
        .then(({ data, pagination }) => { safeSet(this.setGames, data); ... })
        .finally(() => safeSet(this.setLoading, false));
      return () => { mounted = false; };
    };
  }
}
```

### Helper (`.jsx` in `helpers/`)

A static class. All methods are `static renderXxx()` returning JSX. No state, no side effects.

```jsx
// pages/helpers/GamesHelper.jsx
export default class GamesHelper {
  static render(games, pagination) { ... }
  static renderLoading()           { ... }
  static renderError(error)        { ... }
}
```

---

## Pages vs Elements

| Type | Location | Purpose |
|------|----------|---------|
| **Page** | `components/pages/` | Top-level route component. One per route. Has its own `controllers/` and `helpers/` sub-folders. |
| **Element** | `components/elements/` | Reusable building block used across pages (e.g. `Pagination`, `GameCard`). Also has `controllers/` and `helpers/` sub-folders when non-trivial. |

---

## Adding a New Page

1. Create `components/pages/MyPage.jsx` — state declarations + effect wiring only.
2. Create `components/pages/controllers/MyPageController.js` — extend `BasePageController`,
   implement `buildEffect()`.
3. Create `components/pages/helpers/MyPageHelper.jsx` — static class with all JSX factories.
4. Register the route in `utils/HashRouteResolver.js` and add the page to `helpers/AppHelper.jsx`.

## Adding a New Element

1. Create `components/elements/MyElement.jsx`.
2. If it has logic: add `components/elements/controllers/MyElementController.js`.
3. If it has complex rendering: add `components/elements/helpers/MyElementHelper.jsx`.

---

## Routing

Routes are registered in `utils/HashRouteResolver.js`:

```js
this.#router.register('/games/:game_slug/characters/:character_id', 'character');
this.#router.register('/games/:game_slug/pcs', 'gamePcs');
this.#router.register('/games/:game_slug/npcs', 'gameNpcs');
this.#router.register('/games/:game_slug', 'game');
this.#router.register('/games', 'games');
this.#router.register('/', 'home');
```

`HashRouteResolver.getPage()` strips the query string before matching, so
`#/games?page=2&per_page=10` resolves to `'games'`. Pagination parameters are extracted
separately via `getPaginationParams()`.

---

## Pagination

The pagination element set lives in `components/elements/`:

| File | Role |
|------|------|
| `Pagination.jsx` | Thin wrapper — delegates to `PaginationHelper.render` |
| `PageLink.jsx` | Anchor built from a URL template (`#/games?page=:page&per_page=:perPage`) |
| `helpers/PaginationHelper.jsx` | Renders the full Bootstrap `<nav><ul class="pagination">…</ul></nav>` |
| `controllers/PaginationController.js` | Wraps `PaginationBuilder`, returns the page list |
| `controllers/PaginationBuilder.js` | Algorithm: first 3 + last 3 + ±3 window, with `null` gap markers |

Usage in a helper:

```jsx
<Pagination
  currentPage={pagination.page}
  totalPages={pagination.pages}
  perPage={pagination.perPage}
  basePath="#/games"
/>
```

`Pagination` returns `null` when `totalPages ≤ 1`, so no conditional needed at the call site.

---

## API Client

`client/GenericClient.js` is the shared HTTP client:

- `fetchIndex(path)` — GET with pagination params from the hash query string; returns
  `{ data, pagination: { page, pages, perPage } }` extracted from response headers.
- `fetch(path)` — GET with all hash query params forwarded.
- `post(path, body)` / `patch(path, body)` — JSON write operations.

---

## Bootstrap

Bootstrap 5 is imported globally in `main.jsx`:

```js
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
```

Use Bootstrap classes directly on JSX elements. Common patterns:

- Grid: `container` > `row` > `col-sm-6 col-md-4 col-lg-3`
- Cards: `card`, `card-body`, `card-title`, `card-img-top`, `img-fluid`
- Feedback: `alert alert-danger`, `text-muted`
- Pagination: `pagination`, `page-item`, `page-link`, `active`, `disabled`
- Spacing: `mt-4`, `mb-4`, `mb-3`

---

## Linting and Documentation

ESLint (`frontend/eslint.config.mjs`) enforces JSDoc on all public classes, methods, and exported
functions under `assets/js/`. Every JSDoc block must include:

- A prose description as the first line.
- `@param {type} name description` for each parameter.
- `@returns {type} description` for every non-void function.

Private class fields (`#method`) are documented but not enforced (`publicOnly: true`).
JSDoc requirements are disabled for spec files.

---

## Tests

Spec files live in `specs/` and mirror the `assets/js/` directory structure. Run with:

```bash
cd frontend && yarn test
```

For rendering-based tests, import `renderToStaticMarkup` from `react-dom/server` and assert
on the resulting HTML string. For controller tests, instantiate the controller directly and
call `buildEffect()()`, then flush promises with `await new Promise(r => setTimeout(r, 0))`.
