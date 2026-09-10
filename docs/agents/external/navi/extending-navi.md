# Extending Navi with Your Own Routes and Pages

Extensions let you add your own **backend routes** and **frontend pages** on top of the stock `darthjee/navi-hey` image without forking it or rebuilding the Navi SPA. You write a small, standalone project, build it into a `dist/` folder, mount that folder into the container, and flip one environment variable. The mechanism is fully opt-in and off by default: an image with `NAVI_EXTENSIONS_ENABLED` unset serves exactly the stock dashboard and API.

> **Security warning.** Loading an extension runs **arbitrary JavaScript, mounted into the container, in the same process as Navi with no isolation** — full Node privileges, no sandbox, no permission model. The opt-in flag and the operator-controlled volume are the entire trust model. Only mount code you wrote or audited, from a volume you control.

This page is the operator-facing walkthrough. For the container-side loader mechanics (what Navi scans, how descriptors are validated, collision handling), see [`docs/agents/web-server.md`'s Route extensions section](../../agents/web-server.md#route-extensions) (backend) and [`docs/agents/frontend.md`'s Extensions section](../../agents/frontend.md#extensions) (frontend). To run your extension's own test suite, see [Testing your extension](#testing-your-extension).

### When to use extensions

Reach for an extension when you want the stock Navi image plus a little of your own surface — a JSON endpoint that reports on your system, a dashboard page that renders it, a menu link to reach it — and you don't want to maintain a fork or a full rebuild pipeline just for that. Anything larger (custom auth, bundled npm dependencies the image doesn't ship, a rebuilt SPA) is out of scope; extensions deliberately stay small.

### Enabling extensions

Three things switch the mechanism on:

| Setting | Value |
|---------|-------|
| `NAVI_EXTENSIONS_ENABLED` | Truthy (`1` / `true` / `yes` / `on`) to load extensions. Unset, empty, or falsey leaves the mechanism inert. |
| `NAVI_EXTENSIONS_DIR` | Absolute container path Navi scans for extensions. Defaults to `/navi/extensions`. Mount your built folder here (or point this elsewhere). |
| `NAVI_MENU` (CLI `-m` / `--menu`) | Path to the menu file (`-m` / `--menu`). Defaults to `./config/menu.yml` (resolved against the image WORKDIR `/home/node/app`). Mount your own menu file there to control menu position or labels. |

A `docker-compose.yml` for the recommended pure bind-mount shape:

```yaml
services:
  navi:
    image: darthjee/navi-hey:latest
    environment:
      NAVI_EXTENSIONS_ENABLED: "true"
      # NAVI_EXTENSIONS_DIR defaults to /navi/extensions
      # NAVI_MENU defaults to ./config/menu.yml
    volumes:
      - ./dist:/navi/extensions:ro
      - ./config/menu.yml:/home/node/app/config/menu.yml:ro
    ports:
      - "3000:3000"
```

`:ro` — Navi only ever reads the folder. The whole workflow is: build `dist/`, mount it, set one env var.

### Folder layout

The mounted folder has exactly two reserved subtrees, both **flat and non-recursive**:

```
/navi/extensions/           (this is your build output, not your source tree)
  backend/
    orders.js               # every *.js here is a route module
  frontend/
    orders.js               # every *.js here is a page bundle
    orders.css              # optional same-basename sibling stylesheet
```

- Files are loaded in **lexicographic filename order** within each subtree.
- Either subtree may be **absent** — that is an info-level log line, not an error. A backend-only or frontend-only extension is fine.
- Only files **directly under** `backend/` and `frontend/` are considered; nested directories are ignored.

### A backend route

Each `backend/*.js` module is an ESM file that default-exports (or named-exports `routes`) an array of `{ method, path, handler }` descriptors:

| Field | Constraint |
|-------|------------|
| `method` | `GET`, `PATCH`, or `POST` (case-insensitive). No other verbs. |
| `path` | Non-empty, starts with `/`, no whitespace. Express path syntax (`:param`, `*splat`) is allowed. |
| `handler` | A `RequestHandler` **subclass** — the class itself, not an instance. Navi instantiates it per request as `new handler(req, res)`, exactly like every stock handler. |

The handler base class is imported from the `navi-hey/extension` subpath — use this specifier verbatim; it is version-stable and survives internal reorganisation of the package:

```js
// src/backend/orders.js  →  mounted at /navi/extensions/backend/orders.js
import { RequestHandler } from 'navi-hey/extension';

class OrdersSummaryHandler extends RequestHandler {
  constructor (_request, response) {
    super();
    this.response = response;
  }

  handle () {
    this.response.json({ pending: 3, service: 'orders-extension' });
  }
}

export default [
  { method: 'GET', path: '/ext/orders/summary.json', handler: OrdersSummaryHandler },
];
```

What the handler inherits, identical to every stock handler:

- `GET` `handle()` runs **synchronously**; `PATCH` / `POST` `handle()` is **`await`ed**, so it may be `async`.
- Throwing `ConflictError` → 409, `ForbiddenError` → 403, `NotFoundError` → 404; any other throw → 500 with `{ error: 'Internal Server Error' }`.
- The handler owns the response — it calls `res.json(...)` / `res.status(...)` / `res.send(...)` itself.
- `express.json()` body parsing is already applied, so `req.body` is populated for `PATCH` / `POST`.
- Extension routes are **public** — there is no token wiring for them.

**No build step for the backend.** `backend/*.js` runs as-is in Navi's Node process: plain ESM, `.js` extension, `import` only. It may import anything the Navi image ships plus its own bundled `.js` siblings — it may **not** pull in npm packages the image does not already carry. The "build" for `backend/` is a straight copy of your source files into `dist/backend/`.

### A frontend page

Each `frontend/*.js` bundle default-exports an array of `{ path, text, component }` descriptors:

| Field | Constraint |
|-------|------------|
| `path` | Non-empty, starts with `/`, no whitespace. Becomes a `<Route path>` under the dashboard's existing `HashRouter`; the user-visible URL is `#<path>`. |
| `text` | Non-empty. The menu label (auto-appended to the menu — see below). |
| `component` | A React component (function or class). May be `React.lazy(...)`. |

The page component and the entry module (source):

```jsx
// src/frontend/OrdersPage.jsx
import { useEffect, useState } from 'react';
import './OrdersPage.css';

export default function OrdersPage () {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch('/ext/orders/summary.json')
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => setSummary({ error: true }));
  }, []);

  if (!summary) return <p className="orders-loading">Loading…</p>;
  if (summary.error) return <p className="orders-error">Unavailable</p>;
  return <p className="orders-summary">{summary.pending} pending order(s)</p>;
}
```

```js
// src/frontend/entry.js
import OrdersPage from './OrdersPage.jsx';

export default [
  { path: '/ext/orders', text: 'Orders', component: OrdersPage },
];
```

**Build the bundle with React externalised.** The running Navi image carries **no frontend toolchain** and its SPA is **never rebuilt** — you ship a pre-built ESM bundle that the dashboard discovers at boot via `GET /extensions/frontend.json` and loads from `GET /extensions/frontend/*path` (both return an empty manifest / 404 when extensions are disabled).

React, React-DOM, and React-Router **must be externals**. The host `index.html` already loaded exactly one copy of each and exposes them through its import map; bundling your own would create a second React instance and break hooks, context, and `<Routes>` matching the moment your component mounts.

Externalise the **full set of React specifiers**, including the JSX runtimes:

```
react, react-dom, react-dom/client, react-router-dom, react/jsx-runtime, react/jsx-dev-runtime
```

`@vitejs/plugin-react` rewrites your JSX to `import { jsx } from "react/jsx-runtime"` (and `react/jsx-dev-runtime` in dev builds), so those two specifiers must be externals too. The host SPA's import map provides both — if you bundle your own copy instead, the browser loads a second React and the page silently fails to mount.

The complete, copy-pasteable `vite build --lib` config:

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Emit a library bundle, not an app with its own index.html.
    lib: {
      entry: 'src/frontend/entry.js',
      formats: ['es'],           // Navi loads extension bundles as ESM
      fileName: () => 'orders.js',
      cssFileName: 'orders',     // emit orders.css, not <pkg-name>.css
    },
    outDir: 'dist/frontend',
    emptyOutDir: true,
    rollupOptions: {
      // Never bundle React / React-Router — the host SPA already loaded exactly
      // one copy and exposes it through the index.html import map.
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'react-router-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
      ],
    },
  },
});
```

The build produces a single ESM file, `dist/frontend/orders.js`. If your component imports CSS, Vite's library mode would name the stylesheet after the package (`<pkg-name>.css`) by default — `cssFileName: 'orders'` forces it to `dist/frontend/orders.css`, the **same basename** as the bundle. Navi then injects `<link rel="stylesheet" href="/extensions/frontend/orders.css">` when it loads the bundle. The sibling `.css` file is a convenience — the bundle may inline its styles instead.

### A menu entry

Your route is reachable by URL (`#/ext/orders`) as soon as its bundle loads. A menu entry makes it **discoverable**.

**You get one for free.** The SPA merges every extension `{ path, text }` pair into the menu **client-side**, appended after the menu-file entries. The stock menu ships with **Logs** and **Memory**, so doing nothing renders **Logs, Memory, Orders**. The operator edits nothing.

To control position or label, add an explicit entry to `config/menu.yml`:

```yaml
# config/menu.yml  — mounted over /home/node/app/config/menu.yml, NOT inside /navi/extensions
entries:
  - route: /ext/orders
    text: Orders
```

- Entry shape is `{ route, text[, hidden] }`. `route` starts with `/` (internal) or is an absolute `http(s)://` URL; `text` defaults to `route`.
- Operator entries are **appended** to the stock Logs + Memory defaults.
- **Reposition** — list `/ext/orders` in `menu.yml` at the position you want. A duplicate `route` keeps its first occurrence, so the file entry wins and the auto-appended copy is skipped.
- **Hide** — `{ route: /ext/orders, hidden: true }` drops the auto-appended entry; the route stays reachable by URL.
- The menu file and the extensions volume are **separate schemas** — neither validates the other. A menu entry pointing at a route no extension registers renders as an ordinary link that 404s when clicked.

### Worked example

One backend route, one frontend page, one menu entry — the complete deliverable.

**`src/backend/orders.js`** — the `OrdersSummaryHandler` serving `GET /ext/orders/summary.json`, exactly as shown in [A backend route](#a-backend-route).

**`src/frontend/OrdersPage.jsx`** and **`src/frontend/entry.js`** — the `OrdersPage` component and its descriptor (route `/ext/orders`, label `Orders`), exactly as shown in [A frontend page](#a-frontend-page).

**`src/frontend/OrdersPage.css`:**

```css
.orders-summary { font-weight: 600; }
.orders-error   { color: var(--bs-danger, #dc3545); }
```

**`config/menu.yml`:**

```yaml
entries:
  - route: /ext/orders
    text: Orders
```

**`vite.config.js`** — the complete file from [A frontend page](#a-frontend-page).

**`package.json`** (extension project) — mirrors
[`examples/navi-orders-extension/package.json`](../../../examples/navi-orders-extension/package.json):

```json
{
  "name": "navi-orders-extension",
  "private": true,
  "type": "module",
  "description": "SPEC-5 worked example: an Orders extension for the stock darthjee/navi-hey image (backend route + frontend page + menu entry).",
  "scripts": {
    "build": "vite build && mkdir -p dist/backend && cp src/backend/*.js dist/backend/",
    "test": "docker compose run --rm extension_tests"
  },
  "author": "darthjee",
  "license": "MIT",
  "devDependencies": {
    "@vitejs/plugin-react": "^5.1.1",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "7.14.2",
    "vite": "^7.2.4"
  }
}
```

The `react` / `react-dom` / `react-router-dom` pins mirror the majors in
[`frontend/package.json`](../../../frontend/package.json) (React 19, React-Router 7) —
the copy the stock image's SPA already loads. Re-check them whenever you bump the
base image (see [Upgrading the base image](#upgrading-the-base-image)).

The extension's Jasmine suite does **not** run from `node_modules`: `npm test` is
just `docker compose run --rm extension_tests`, which runs the specs inside the
prebuilt `darthjee/navi-hey-test` image. That image provides `navi-hey/extension`
(the `RequestHandler` base class, byte-identical to what the runtime resolves)
and the `navi-hey/testing/*` doubles, so the project carries **no** test
toolchain in `devDependencies` — only what `npm run build` (Vite) needs. See
[Testing your extension](#testing-your-extension).

The `build` script is `vite build` (the frontend bundle) **plus** a plain copy of `src/backend/*.js` into `dist/backend/` — no transform on the backend files. `npm test` runs the Jasmine suite (backend handler + frontend page) inside the `darthjee/navi-hey-test` container. This example project uses **npm, not Yarn** — it simulates a downstream consumer, which is not bound by Navi's own toolchain choice.

**Built / mounted tree** after `npm run build`:

```
dist/
  backend/
    orders.js          # copied verbatim from src/backend/
  frontend/
    orders.js          # bundled ESM, React external
    orders.css         # emitted from the OrdersPage.css import
```

**`docker-compose.yml`** — the checked-in file runs the [test suite](#testing-your-extension), not a server; it reads identically to:

```yaml
# Runs this extension's Jasmine suite inside the shipped darthjee/navi-hey-test
# image. `npm test` is `docker compose run --rm extension_tests`; only src/ and
# tests/ are mounted in, so no local test toolchain is needed.
services:
  extension_tests:
    image: darthjee/navi-hey-test:latest   # pin to the darthjee/navi-hey tag your extension deploys FROM
    volumes:
      - ./src:/work/src:ro
      - ./tests:/work/tests:ro
      # - ./dist:/navi/extensions:ro   # optional built-output parity check
```

To run the *built* extension against a live Navi, use the bind-mount shape from [Enabling extensions](#enabling-extensions); the in-repo example is wired as the repo-root `navi_extensions_app` service (`docker compose up navi_extensions_app`), which mounts `dist/` at `/navi/extensions` and `config/menu.yml` over the image menu with `NAVI_EXTENSIONS_ENABLED=true`.

**At runtime (deployed against Navi):**

1. On server start Navi reads `/navi/extensions/backend/`, imports `orders.js`, registers `GET /ext/orders/summary.json`, and logs the boot audit line.
2. On SPA boot the dashboard fetches `/extensions/frontend.json`, lazy-loads `/extensions/frontend/orders.js`, mounts `#/ext/orders` inside the stock layout, injects `orders.css`, and appends **Orders** to the menu.
3. With `NAVI_EXTENSIONS_ENABLED` unset the same image serves the same SPA with no `/ext/orders` route, no `/ext/orders/summary.json`, and no menu entry.

For testing your extension in isolation — one backend spec exercising the handler, one frontend spec rendering the page — see [Testing your extension](#testing-your-extension) below.

### Testing your extension

`darthjee/navi-hey-test` is a prebuilt image that bundles Navi's Jasmine toolchain (backend **and** frontend), the jsdom / esbuild frontend setup, and a set of reusable Navi test doubles. An extension project runs its own suite by mounting `src/` and `tests/` into it — **no local test toolchain, no `npm ci` for tests**.

**Image & tags.** `darthjee/navi-hey-test`, published with two tags: `:<git-tag>` — the `darthjee/navi-hey` (Navi) version tag your extension image deploys `FROM` — and `:latest`. Pin the tag your extension deploys `FROM`: the image bakes the same `RequestHandler`, the same React / React-Router majors, and the same doubles that Navi version ships, so what you test is what runs.

**Project layout.** Specs live in the extension project, next to the source they exercise — never in the built `dist/`:

```
navi-orders-extension/
  src/
    backend/orders.js
    frontend/OrdersPage.jsx
    frontend/OrdersPage.css
    frontend/entry.js
  tests/
    backend/orders_spec.js          # tests/backend/**/*_[sS]pec.js
    frontend/orders_page_spec.jsx   # tests/frontend/**/*_[sS]pec.@(js|jsx)
  docker-compose.yml
```

- Specs import straight from `src/` — **no build step runs first**.
- The default `all` run expects specs in both `tests/backend/` and `tests/frontend/`; a backend-only or frontend-only extension uses the `backend` / `frontend` subcommand instead.
- The image `WORKDIR` is `/work`; `src/` mounts at `/work/src`, `tests/` at `/work/tests` (both read-only).

**`tests/backend/orders_spec.js`** — drive the handler directly with a fake `req` / `res`, exactly as Navi's own handler specs do:

```js
import routes from '../../src/backend/orders.js';

describe('orders backend extension', () => {
  it('declares GET /ext/orders/summary.json', () => {
    const [route] = routes;
    expect(route.method).toBe('GET');
    expect(route.path).toBe('/ext/orders/summary.json');
  });

  it('writes a JSON summary', () => {
    let body;
    const response = { json: (payload) => { body = payload; } };
    new routes[0].handler({}, response).handle();
    expect(body.service).toBe('orders-extension');
    expect(typeof body.pending).toBe('number');
  });
});
```

**`tests/frontend/orders_page_spec.jsx`** — render the page with `useContainer` + a mocked `fetch`:

```jsx
import { act } from 'react';
import { useContainer } from 'navi-hey/testing/dom.js';
import { mockFetchSuccess } from 'navi-hey/testing/fetch.js';
import descriptors from '../../src/frontend/entry.js';

describe('OrdersPage', () => {
  const state = useContainer();
  mockFetchSuccess({ pending: 3, service: 'orders-extension' });

  it('exposes the /ext/orders descriptor', () => {
    expect(descriptors[0].path).toBe('/ext/orders');
    expect(descriptors[0].text).toBe('Orders');
  });

  it('renders the pending-order count', async () => {
    const OrdersPage = descriptors[0].component;

    await act(async () => {
      state.root.render(<OrdersPage />);
    });

    expect(state.container.textContent).toContain('3 pending order(s)');
  });
});
```

`useContainer()` installs the jsdom globals and hands back a fresh React root per example; `mockFetchSuccess` / `mockFetchFailure` each register a `beforeEach` that stubs `globalThis.fetch` — call them at `describe` level, as the spec above does.

**Test doubles.** These specifiers resolve **inside the image only**. Treat them as quasi-public API — they are pinned to the image tag and may change between Navi versions (re-run the suite on every bump):

| Import | What it gives |
|--------|---------------|
| `import { RequestHandler } from 'navi-hey/extension'` | The exact base class the runtime resolves (byte-identical), same specifier as production |
| `import { useContainer } from 'navi-hey/testing/dom.js'` | `useContainer()` — installs the jsdom globals, hands back a per-example React root |
| `import { mockFetchSuccess, mockFetchFailure } from 'navi-hey/testing/fetch.js'` | `mockFetchSuccess(data)` / `mockFetchFailure(status)` — register a `describe`-level `beforeEach` that spies `globalThis.fetch` |
| `import { AxiosUtils } from 'navi-hey/testing/axios.js'` | `AxiosUtils.stubGet` / `.stubPost` / `.stubPut` / `.stubPatch` (+ `.stub*Rejection`) static helpers — stub outbound `axios` calls a handler makes |
| `import { LoggerUtils } from 'navi-hey/testing/logger.js'` | `LoggerUtils.stubLoggerMethods()` / `.stubConsoleMethods()` static helpers — silence, or assert on, `Logger` / `console` output |

**Running it.** The extension project's `docker-compose.yml`:

```yaml
# Runs this extension's Jasmine suite inside the shipped darthjee/navi-hey-test
# image. `npm test` is `docker compose run --rm extension_tests`; only src/ and
# tests/ are mounted in, so no local test toolchain is needed.
services:
  extension_tests:
    image: darthjee/navi-hey-test:latest   # pin to the darthjee/navi-hey tag your extension deploys FROM
    volumes:
      - ./src:/work/src:ro
      - ./tests:/work/tests:ro
      # - ./dist:/navi/extensions:ro   # optional built-output parity check
```

and the `package.json` script:

```json
"scripts": {
  "test": "docker compose run --rm extension_tests"
}
```

`docker compose run --rm extension_tests` (or `npm test`) runs the **default `all`** subcommand. Pass another as the service command to override it:

| Command | Behaviour |
|---------|-----------|
| `all` _(default)_ | backend suite, then frontend suite, as **two separate `node` processes**; non-zero exit if either fails |
| `backend` | backend suite only |
| `frontend` | frontend suite only |
| `lint` | `eslint` over the mounted `src/` + `tests/` |
| `sh` | interactive shell in the image |

Add `--coverage` to `all` / `backend` / `frontend` to wrap the run in `c8`, with coverage scoped to your `src/**` only — e.g. `docker compose run --rm extension_tests backend --coverage`.

Without compose: `docker run --rm -v "$PWD/src:/work/src:ro" -v "$PWD/tests:/work/tests:ro" darthjee/navi-hey-test:<navi-tag>`.

**Isolation.** Navi's own `source/spec/` and `frontend/spec/` are **never** enumerated. The backend and frontend suites run as separate `node` processes, so neither suite's globals, helpers, or jsdom window can reach the other. `--coverage` reports only on the author's `src/**`.

**CI hook.** A downstream project wires this as **one job**: build or pull `darthjee/navi-hey-test:<navi-tag>` pinned to the Navi tag its deployment image runs `FROM`, then `docker compose run --rm extension_tests`, on every PR. That job is also where [Upgrading the base image](#upgrading-the-base-image) item 4 is exercised on a Navi bump.

### Baking the extension into a derived image

Instead of a bind-mount you can build a derived image with the extension baked in (immutable deploy artefact, no volume to manage). This repo ships a working one at [`dockerfiles/navi_hey_extension_example/Dockerfile`](../../../dockerfiles/navi_hey_extension_example/Dockerfile):

```dockerfile
ARG NAVI_TAG=latest
FROM darthjee/navi-hey:${NAVI_TAG}

COPY examples/navi-orders-extension/dist/ /navi/extensions/
COPY examples/navi-orders-extension/config/menu.yml /home/node/app/config/menu.yml

ENV NAVI_EXTENSIONS_ENABLED=true
```

- COPY the **built artefacts** to the default mount point (`/navi/extensions/`) — never the source tree.
- The menu file goes to `/home/node/app/config/menu.yml` (the `NAVI_MENU` default resolved against the image WORKDIR), **not** `/navi/menu.yml`.
- Build the extension's `dist/` first (`npm ci && npm run build` in the example project); the build context is the repo root.

The Navi SPA is still **not** rebuilt — the frontend bundle is the same pre-built ESM file the SPA discovers at boot. Pin `NAVI_TAG` to an exact Navi version and run the upgrade checklist below when you bump it. A `docker-compose.yml` for this shape just sets `image:` to the derived tag and drops the two `volumes:` lines.

**See it working.** `docker compose up navi_extensions_app` boots the stock dev image with this example mounted on port `3040`, and `make smoke-extensions` asserts the route, the frontend manifest, and the server-side menu entry end to end. See [Option E — Development image](./option-e-development-image.md) for how to run this image outside of the extensions workflow.

### Reload limitation

Extensions are **fixed for the process lifetime**. Changing them — new backend code, a new frontend bundle, or a new base image — requires a **container restart**. `PATCH /engine/reload` re-reads only the warm-up configuration; it does **not** re-scan `NAVI_EXTENSIONS_DIR` and does not affect loaded extensions.

### Upgrading the base image

Run this checklist when bumping `FROM darthjee/navi-hey:<tag>` or the pulled `image:` tag:

1. **React / React-Router version alignment.** Match your extension project's `react` / `react-dom` / `react-router-dom` devDependencies to the majors in the new image's [`frontend/package.json`](../../../frontend/package.json) (currently React 19, React-Router 7) — or read them off the image's `index.html` import map — then rebuild the frontend bundle. A mismatch that changes the ESM export surface breaks the externalised imports at runtime. The matching `darthjee/navi-hey-test` tag pins those same majors, so item 4 catches a drift you missed here.
2. **Handler import specifier unchanged.** Confirm `import { RequestHandler } from 'navi-hey/extension'` still resolves in the new image. No `src/backend/**` change is expected between Navi versions.
3. **Route-name collisions.** Diff your extension's `method + path` set against the new image's stock routes. Stock always wins — a colliding extra is skipped with a warning and silently disappears. Rename the extra if a new stock route now shadows it.
4. **Re-run your extension's own tests** through [`darthjee/navi-hey-test`](#testing-your-extension) retagged to the new Navi version — `docker compose run --rm extension_tests`, ideally as the one CI job described in [Testing your extension](#testing-your-extension).
5. **Restart, don't reload.** Deploying new extension code — or a new base image — means a container restart, not `PATCH /engine/reload`.

[← Back to How to Use Navi](../how_to_use_navi.md)
