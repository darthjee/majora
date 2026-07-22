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
        helpers/            # AppHelper.jsx (page-key -> component wiring, lives at components root)
        resources/          # one folder per resource — see "Directory Structure" below
          game/
            pages/             # top-level route components for this resource
              controllers/     # page controllers (.js)
              helpers/         # page JSX helpers (.jsx)
              elements/        # elements used only by this resource's pages
                controllers/   # element controllers (.js)
                helpers/       # element JSX helpers (.jsx)
          game_session/
            pages/ ...
          character/
            pages/ ...
          treasure/
            pages/ ...
          staff_user/
            pages/ ...
          account/
            LoginModal.jsx     # not a routed page (opened from the header), so it sits
            controllers/       # alongside pages/ instead of inside it
            helpers/
            pages/ ...
        common/              # elements shared across more than one resource, grouped by theme
          base/                # shared base classes not tied to one component
            controllers/         # e.g. BasePageController, BaseEditController
          buttons/             # BackButton, EditButton, LoadMoreButton, NewButton, ...
          modals/              # MoneyEditModal, PhotoUploadModal, ...
          cards/               # CardAvatar, CardPhoto, CharacterPreviewCard, ...
          badges/              # Badge, InfoBadgeList, TooltipBadge
          forms/               # FieldErrors, FormField, TextareaField
          header/              # Header + its controllers/helpers
          pagination/          # Pagination, PageLink + their controllers/helpers
          list_page/           # ListPage, PageActions + their controller/helper
          list_types/          # per-resource list item components/configs (unchanged)
          misc/                # standalone shared elements (ActionBar, Avatar, ErrorAlert, ...)
          # each theme folder above has its own controllers/ and helpers/ sub-folders
          # when it has files for those (no empty sub-folders)
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

Each resource folder under `components/resources/` colocates every page, controller, and helper
used only by that resource (e.g. `resources/game/pages/Games.jsx`,
`resources/game/pages/controllers/GamesController.js`,
`resources/game/pages/helpers/GamesHelper.jsx`, and — for elements used only by `game` pages —
`resources/game/pages/elements/GameCard.jsx` with its own `controllers/`/`helpers/`
sub-folders). The six resources are `game`, `game_session`, `character` (covers both NPC and PC
pages), `treasure`, `staff_user`, and `account` (my-account, register, recover-password, login).

Anything genuinely shared across more than one resource (or used by the app shell itself, like
`Header.jsx`) lives under `components/common/`, grouped into themed subfolders (`buttons/`,
`modals/`, `cards/`, `badges/`, `forms/`, `header/`, `pagination/`, `list_page/`, `list_types/`,
`misc/`, `base/`), each with its own `controllers/` and `helpers/` sub-folders when it has files
for those — e.g. `common/pagination/Pagination.jsx`, `common/forms/FormField.jsx`,
`common/base/controllers/BasePageController.js`. `App.jsx`, `AppController.js`, and
`helpers/AppHelper.jsx` stay at the `components/` root and import from `resources/<resource>/`
and `common/` as needed. `utils/` (non-JSX utility classes) is untouched by the resource split.

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
on `loading`/`error`/success state (see `resources/game/pages/Games.jsx` for a reference
example).

### Controller (`.js` in `controllers/`)

A plain JS class, extending `BasePageController` (`components/common/base/controllers/BasePageController.js`).
Responsible for:

- Data fetching via the API client
- Building `useEffect` callbacks (`buildEffect()`)
- Preventing state updates after unmount (`buildSafeSetter()` from `BasePageController`)

No JSX. Receives state setters and an optional injected client in the constructor (see
`resources/game/pages/controllers/GamesController.js` for a reference example).

### Helper (`.jsx` in `helpers/`)

A static class. All methods are `static renderXxx()` returning JSX. No state, no side
effects (see `resources/game/pages/helpers/GamesHelper.jsx` for a reference example).

---

## Avoiding Inline JSX Conditionals

Render helpers should not mix conditional logic with large chunks of markup directly inline.
Pick one of these four extraction patterns, depending on what the condition guards:

1. **Condition wrapping a large block of HTML** — extract a dedicated component that receives
   the relevant attributes, so the call site becomes `{canEdit && <EditableSomething ... />}`.
   See `resources/character/pages/elements/CharacterInfo.jsx` / `common/cards/CardAvatar.jsx` for
   examples of components with conditional behaviour at their root.
2. **Condition wrapping a non-trivial existing component** — use
   `components/common/misc/ConditionalComponent.jsx`, which takes a `render` boolean prop and
   renders its `children` when true, `null` otherwise. The call site becomes
   `<ConditionalComponent render={canEdit}>...</ConditionalComponent>`. See
   `resources/game/pages/helpers/GameHelper.jsx`, `resources/character/pages/helpers/CharacterHelper.jsx`,
   `resources/character/pages/helpers/GameCharactersHelper.jsx`, and
   `resources/staff_user/pages/helpers/StaffUsersHelper.jsx` (`#renderRecoveryAction`) for
   concrete usages.
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
| **Page** | `components/resources/<resource>/pages/` | Top-level route component. One per route. Has its own `controllers/` and `helpers/` sub-folders. |
| **Element (resource-specific)** | `components/resources/<resource>/pages/elements/` | Reusable building block used only by that resource's pages (e.g. `resources/game/pages/elements/GameCard.jsx`). Also has `controllers/` and `helpers/` sub-folders when non-trivial. |
| **Element (shared)** | `components/common/` | Reusable building block used across more than one resource, or from the app shell (e.g. `Pagination`, `Header`). Also has `controllers/` and `helpers/` sub-folders when non-trivial. |

Before placing a new element under a resource's `pages/elements/`, grep for its actual (or
anticipated) importers: if it's only ever imported from that resource's pages, it belongs there;
if it's imported from more than one resource, it belongs under `components/common/` instead.
Naming alone can be misleading — e.g. `TreasureExchangeModal` and `LinksEditModal` are used only
by the `character` resource despite their generic-sounding names, while `TreasureCard` and
`CharacterCard` are shared across resources despite their resource-specific-sounding names.

---

## Adding a New Page

1. Create `components/resources/<resource>/pages/MyPage.jsx` — state declarations + effect
   wiring only. If the page belongs to a new resource, create the
   `components/resources/<resource>/pages/` folder (with `controllers/`/`helpers/`
   sub-folders) first.
2. Create `components/resources/<resource>/pages/controllers/MyPageController.js` — extend
   `BasePageController` (`components/common/base/controllers/BasePageController.js`), implement
   `buildEffect()`.
3. Create `components/resources/<resource>/pages/helpers/MyPageHelper.jsx` — static class with
   all JSX factories.
4. Register the route in `utils/HashRouteResolver.js` and add the page to `helpers/AppHelper.jsx`
   (import from `../resources/<resource>/pages/MyPage.jsx`).

## Adding a New Element

1. Decide whether the element is specific to one resource or genuinely shared (see "Pages vs
   Elements" above).
2. Resource-specific: create `components/resources/<resource>/pages/elements/MyElement.jsx`.
   Shared: create `components/common/<theme>/MyElement.jsx`, picking (or creating) the themed
   subfolder it belongs to (`buttons/`, `modals/`, `cards/`, `badges/`, `forms/`, `header/`,
   `pagination/`, `list_page/`, `list_types/`, `misc/`, ...) rather than dropping it flat under
   `common/`.
3. If it has logic: add a `controllers/MyElementController.js` alongside it (under
   `pages/elements/controllers/` or `common/<theme>/controllers/`, respectively).
4. If it has complex rendering: add a `helpers/MyElementHelper.jsx` alongside it (under
   `pages/elements/helpers/` or `common/<theme>/helpers/`, respectively).

---

## Routing

Routes are registered in `utils/HashRouteResolver.js`, one `register(pattern, pageName)`
call per route. `HashRouteResolver.getPage()` strips the query string before matching, so
`#/games?page=2&per_page=10` resolves to `'games'`. Pagination parameters are extracted
separately via `getPaginationParams()`.

---

## Pagination

The pagination element set lives in `components/common/pagination/` (`Pagination.jsx`,
`PageLink.jsx`, `helpers/PaginationHelper.jsx`, `controllers/PaginationController.js`,
`controllers/PaginationBuilder.js`), since it's shared across every resource. See
[pagination.md](pagination.md) for the full breakdown, including the ellipsis algorithm and
the `<Pagination>` prop contract.

---

## API Client

`client/GenericClient.js` is the shared HTTP client (`fetchIndex`, `fetch`, `post`, `patch`)
— read it directly for the exact method signatures.

---

## Resource Data Requests

`utils/requests/` (issue #778) is a frontend-only, structure-only layer that centralizes
resource-data fetching, mirroring the pattern `utils/access/` already established for
access/permission checks (an `AccessCache`-backed store reacting to route/auth/"view as"
changes). No existing controller/component is rewired to call it yet — that is left for a
follow-up issue. Three cooperating pieces:

- **`resourceConfig.js`** (+ `config/*.js`, one file per resource: `game`, `npc`, `pc`, `item`,
  `treasure`) — a `resourceConfig.get(method, resource, quantityType)` lookup returning the
  resolved `{ regular, private }` pair of `{ path, permission }` entries for that resource's
  `collection`/`single` GET endpoint. `permission` is `null` (open to everyone), a permission-key
  string (e.g. `'can_edit'`), or a function of params, for the rare case where whether a
  restricted endpoint exists at all depends on a param (see `treasureConfig.js`, where only the
  NPC kind has a restricted `/treasures/all.json`). Only `GET` is configured today; the shape
  does not need restructuring to add `POST`/`PATCH`/`DELETE` later.
- **`Request.js`** — one logical resource+quantity-type request. Picks `regular` vs `private`
  based on a caller-supplied permissions object (fail-closed to `regular`), delegates
  dedupe/cache/abort mechanics for the resolved variant+params+query to its own `AccessCache`
  instance, and wraps every settled result as `{ data }` (a fresh object each time, never
  mutated in place). A query/param/permission change aborts the previous variant's in-flight
  fetch and starts a new one — but any promise already handed out to earlier callers stays
  pending and resolves once the *replacement* request settles, instead of being left hanging.
- **`RequestStore.js`** — holds one `Request` per resource/quantity-type/params combination,
  resolving the live permissions each should evaluate via `RequestPermissionResolvers.js`
  (mapping each resource/quantity-type to the matching `AccessStore.ensure*Permissions` call —
  see that file's module doc for the game-level-vs-character-level `can_edit` nuance). Exposes
  `ensure(...)`, `resyncPermissions()`, `reset()`, and a `subscribe()` that wires
  `resyncPermissions()` to `AuthEvents`/`AccessEvents.subscribeFacadeChanged` (not yet called
  from application bootstrap, same "structure only" scope as above).

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
