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

Stays lean — no business logic, no inline JSX beyond top-level conditionals. Declares state,
instantiates the controller, wires its effect, and delegates rendering to the helper based
on `loading`/`error`/success state (see `pages/Games.jsx` for a reference example).

### Controller (`.js` in `controllers/`)

A plain JS class, extending `BasePageController`. Responsible for:

- Data fetching via the API client
- Building `useEffect` callbacks (`buildEffect()`)
- Preventing state updates after unmount (`buildSafeSetter()` from `BasePageController`)

No JSX. Receives state setters and an optional injected client in the constructor (see
`pages/controllers/GamesController.js` for a reference example).

### Helper (`.jsx` in `helpers/`)

A static class. All methods are `static renderXxx()` returning JSX. No state, no side
effects (see `pages/helpers/GamesHelper.jsx` for a reference example).

---

## Avoiding Inline JSX Conditionals

Render helpers should not mix conditional logic with large chunks of markup directly inline.
Pick one of these four extraction patterns, depending on what the condition guards:

1. **Condition wrapping a large block of HTML** — extract a dedicated component that receives
   the relevant attributes, so the call site becomes `{canEdit && <EditableSomething ... />}`.
   See `CharacterInfo.jsx` / `CardAvatar.jsx` for examples of components with conditional
   behaviour at their root.
2. **Condition wrapping a non-trivial existing component** — use
   `components/elements/ConditionalComponent.jsx`, which takes a `render` boolean prop and
   renders its `children` when true, `null` otherwise. The call site becomes
   `<ConditionalComponent render={canEdit}>...</ConditionalComponent>`. See
   `pages/helpers/GameHelper.jsx`, `pages/helpers/CharacterHelper.jsx`,
   `pages/helpers/GameCharactersHelper.jsx`, and `pages/helpers/StaffUsersHelper.jsx`
   (`#renderRecoveryAction`) for concrete usages.
3. **Too many chained conditions** — extract the boolean expression into a named
   helper/controller method (e.g. `shouldRender()`) so the JSX reads
   `{shouldRender() && <SomeComponent />}`, instead of chaining several `&&` checks inline.
4. **Large inline markup without a natural component boundary** — extract a private
   `static renderXxx()` helper method following the existing convention in `helpers/*.jsx`
   (e.g. `CharacterHelper.#renderPrivateDescription`, `StaffUsersHelper.#renderRecoveryAction`),
   instead of writing the markup inline.

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

Routes are registered in `utils/HashRouteResolver.js`, one `register(pattern, pageName)`
call per route. `HashRouteResolver.getPage()` strips the query string before matching, so
`#/games?page=2&per_page=10` resolves to `'games'`. Pagination parameters are extracted
separately via `getPaginationParams()`.

---

## Pagination

The pagination element set lives in `components/elements/` (`Pagination.jsx`, `PageLink.jsx`,
`helpers/PaginationHelper.jsx`, `controllers/PaginationController.js`,
`controllers/PaginationBuilder.js`). See [pagination.md](pagination.md) for the full
breakdown, including the ellipsis algorithm and the `<Pagination>` prop contract.

---

## API Client

`client/GenericClient.js` is the shared HTTP client (`fetchIndex`, `fetch`, `post`, `patch`)
— read it directly for the exact method signatures.

---

## Bootstrap

Bootstrap 5 is imported globally in `main.jsx` and used directly via its CSS classes on JSX
elements (grid, cards, alerts, pagination, spacing) — no custom wrapper components beyond
what's already listed above.

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
