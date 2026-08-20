# Frontend Plan: Add domain configuration

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes `GET /domain/config.json` — see [plan.md](plan.md)'s "Shared contracts" for the exact response shape (`favicon`/`title`/`sub_title`, snake_case) and null/`""` semantics. Also stops calling `Translator.t('header.title')` / `Translator.t('header.subtitle')` — `translator` (see its plan) removes exactly those two keys.

## Steps

- [01 — Fetch domain config at bootstrap](frontend/01-fetch-domain-config-at-bootstrap.md)
- [02 — `HeaderHelper.jsx`: title/sub-title from config](frontend/02-header-helper-from-config.md)
- [03 — Favicon + tab title override](frontend/03-favicon-and-tab-title-override.md)
- [04 — Jasmine specs](frontend/04-jasmine-specs.md)

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- `frontend/index.html:7`'s static `<title>Majora</title>` and its static `<link rel="icon" href="/assets/images/favicon.png">` both stay in the HTML unchanged — they're the pre-fetch/no-JS fallback, not something removed. `title` always comes back as a real string from the API (defaulting to `"Majora"` server-side, never `null`), so `document.title` is always set once config loads. `favicon` is the one field that can come back `null`, in which case the favicon `<link>` is left untouched.
