# Frontend (frontend/)

All React source code lives under `frontend/`. See frontend.md for the full component architecture and conventions.

## assets/
Static sources — CSS (`assets/css/`), JavaScript/JSX (`assets/js/`), images (`assets/images/`).

## specs/
Jasmine test files mirroring `assets/js/`.

## Test commands (from /frontend)
- `npm test` — run Jasmine specs under `specs/`
- `npm run coverage` — generate frontend coverage with `c8`
- `npm run lint` — lint frontend source and specs

## Other
- `index.html` — SPA entry point consumed by Vite.
- `vite.config.js` — Vite bundler configuration.
