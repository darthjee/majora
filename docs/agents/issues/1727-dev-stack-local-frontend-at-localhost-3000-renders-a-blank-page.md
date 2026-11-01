# Issue: Dev stack: local frontend at localhost:3000 renders a blank page

## Description

With the local dev stack up (`make dev-up`), opening http://localhost:3000/ shows a blank page:
the browser makes its requests, but nothing is rendered.

This blocks local work that needs the frontend, for example approving the device authorization
requests that the statistics-bug investigation scripts create (#1704).

### What was checked (2026-11-01)

Containers `majora_proxy` (127.0.0.1:3000), `majora_app`, `majora_fe` (Vite 7.3.5 dev server)
and `majora_mysql` are up. Migrations are applied, and `majora_app` started with no errors.

Through the proxy on `localhost:3000`, everything below answers `200`:

- `/`: the Vite dev `index.html`, with an empty `<div id="root"></div>`;
- `/assets/js/main.jsx`, `/@vite/client`, `/@react-refresh` (`text/javascript`);
- `/access-route-config.json`, `/users/header_status.json`, `/domain/config.json` (JSON).

So the HTML, the entry module and the boot API calls are all served. The failure is most likely
in the browser: a runtime error while mounting React, a module or import that fails to load, or
an HMR or WebSocket problem behind the proxy. The browser console and network tab weren't
captured yet; that's the first step.

Lead: recent dev-stack changes, for example #1724 (host ports only published by `dev-up`).

## Problem

The domain isn't configured. The likely chain is below. It comes from reading the code; the
user confirms it manually in the browser after the merge.

1. `localhost` is not a registered `domains.Domain`. `GET /games.json` only serves hosts in
   `RegisteredDomainsCache` (`backend/games/views/games/games_list.py`); any other host gets
   `404 {"errors": {"detail": ["domain_not_recognized"]}}`. This is the 404 seen on
   `/games.json`, so the route was not renamed.
2. Nothing creates a dev domain. There are no fixtures or seed command, and the `domains`
   migrations only change the schema, so a fresh dev database has no `Domain` rows.
3. `/domain/config.json` falls back to defaults for unknown hosts, so the header boot call still
   answers `200` and hides the problem.
4. The frontend has no React error boundary anywhere, and nothing in it handles
   `domain_not_recognized`. React mounts (it fetches `/games.json`), the games list fails, an
   error thrown during render unmounts the whole tree, and the page is blank.

## Expected Behavior

http://localhost:3000/ renders the Majora frontend, as it does in production.

### Acceptance

- The local frontend renders through the proxy on `localhost:3000` after `make dev-up` on a
  fresh database.
- `GET /games.json` on `localhost` returns `200` with the local games.
- `localhost` passes `validate_domain`; other dotless hosts are still rejected.
- Running the seed twice is a no-op; existing `Domain` rows are never changed; the seed never
  runs with `STAGE=production` or without `SEED_DEV_DOMAINS=true`.
- A `domain_not_recognized` response on the games list shows a translated (en/pt) warning
  instead of crashing.
- An error thrown during render shows the error-boundary fallback (translated message +
  reload button), not a blank page.
- Manual (user, after merge): the browser console confirms the root cause, and the page
  renders on `localhost:3000`.

## Solution

Three parts, all in scope:

### 1. Seed the dev domain (backend / infra)

- A new idempotent management command, `seed_dev_domains`. It is opt-in and fails closed: it
  runs only when `SEED_DEV_DOMAINS=true` **and** `STAGE` is not `production`; otherwise it
  exits without doing anything. `SEED_DEV_DOMAINS=true` is set only on `majora_app` in
  `docker-compose.yml`.
- A new `seed` action in `backend/bin/configure_database.sh` runs it.
- It is called from both entry points:
  - `backend/bin/server.sh`, after migrations (the command applies its own guard). Every
    `make dev-up` heals itself, and the seed runs before `runserver`, so the in-memory caches
    (`RegisteredDomainsCache`, `DomainGamesCache`) and `DomainCsrfOriginsMiddleware` (read
    once when the process starts) see the new rows.
  - `make setup`, which becomes migrate + seed through the same script. When it runs while
    the server is already up, the app needs a restart to pick up the rows (in-memory caches).
- The seed checks what already exists and never overwrites it:
  - Hosts: `localhost` and `127.0.0.1`.
  - A host that already exists as a `Domain` row is left exactly as it is; it is never moved
    to another group.
  - Missing hosts are created with `schemes='http'` under the group of an existing
    `localhost` row, or else under a `DomainGroup` named "Local development"
    (`get_or_create`).
  - Every `Game` is attached to the group of **each** seeded host (skipping games already in
    it), so `localhost` and `127.0.0.1` show the same games even if they already belong to
    different groups, and the local `/games.json` is never empty.
  - It prints what it created and what it skipped; a second run changes nothing.

### Edge cases

- **The domain validator rejects `localhost`.** `validate_domain` (`backend/domains/models.py`)
  needs at least one dot. Relax it to also accept the exact host `localhost`; other dotless
  names are still rejected. The seeded row is then valid and can be edited in Django admin.
  `127.0.0.1` already passes.
- **Hosts in different groups.** `localhost` and `127.0.0.1` may already belong to different
  `DomainGroup`s; all games are attached to each host's group (see above).
- **Two seeds racing.** `make setup` and `server.sh` can run at the same moment. `Domain.domain`
  is unique, so the seed treats an `IntegrityError` on create as "already exists", and the run
  still ends successfully.
- **Production dump loaded locally.** Only the missing hosts are added; existing rows stay
  untouched.
- **Games created after the seed** are already attached to the requesting domain's group by
  `_create_game`. Nothing else is needed.
- **Test database.** `majora_tests` never runs `server.sh`, so the test database is not seeded.
- **Only `/games.json` depends on domains**, so no other endpoint needs the seed.
- **Out of scope: CSRF origins have no port.** `Domain.origins` produces `http://localhost`
  (no `:3000`). Same-origin requests through the proxy still pass Django's CSRF check, so
  nothing changes here.

### Backward compatibility

- **Production.** Production runs the same `bin/server.sh`, and `STAGE=production` is set only
  in the Render environment, outside the repo. The seed therefore needs the explicit
  `SEED_DEV_DOMAINS=true` opt-in as well, so an environment missing `STAGE` is never seeded.
- **`make setup`** changes from a plain `manage.py migrate` to `bin/configure_database.sh`
  (database wait + migrate + seed). Update the docs that mention it: `README.md`,
  `AGENTS.md`, `docs/agents/external/navi/option-e-development-image.md`.
- **The validator** only accepts more than before (`localhost`), so existing rows are not
  affected.
- **#1724 (host ports)** is not affected: no port or compose-file changes, apart from the new
  env var on `majora_app`.
- **Out of scope: runners on the docker network.** `stack-up` runners reach the proxy as host
  `majora_proxy`, which is not seeded, so their `/games.json` calls stay `404`.
  `investigations/statistics-bug/emulate.py` already falls back to `'unknown-game'` in that
  case. This is documented, not fixed.

### 2. Handle `domain_not_recognized` in the UI (frontend)

On a `404` with `domain_not_recognized`, the games list shows a translated warning (en and pt,
under `frontend/assets/i18n/`), e.g. "This domain is not configured", in place of the list,
instead of crashing.

### 3. Top-level error boundary (frontend)

Add an app-wide React error boundary around the application tree, so any render error shows
a fallback instead of a blank page:

- a translated (en/pt) "Something went wrong" message;
- a button that reloads the page;
- the error logged to the console; no error details are shown to the user.

### Testing

- Backend specs for `seed_dev_domains`:
  - creates the hosts and the group on an empty database;
  - a second run changes nothing;
  - existing `Domain` rows are left untouched;
  - games are attached to each host's group;
  - an `IntegrityError` on create is handled;
  - does nothing without `SEED_DEV_DOMAINS=true` or with `STAGE=production`.
- Backend specs for `validate_domain`: accepts `localhost`, still rejects other dotless hosts.
- Jasmine specs for the error boundary (fallback rendered, reload triggered) and for the games
  list's `domain_not_recognized` warning.
- Translation keys stay in sync across `en`/`pt`.
- Manual browser check by the user after the merge.

## Benefits

- The local frontend works again after `make dev-up`, on a fresh database.
- A render error anywhere in the app no longer means a blank page.
- An unconfigured domain is reported clearly instead of failing silently.
