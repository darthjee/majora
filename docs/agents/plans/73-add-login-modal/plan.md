# Plan: Add login modal

Issue: [73-add-login-modal.md](../issues/73-add-login-modal.md)

## Overview
Add a "logged-in check" endpoint on the backend (login/register/logout already exist), and on the frontend build a login modal — mirroring `../oak/frontend`'s `LoginModal`/`LoginModalHelper`/`LoginModalController`/`LoginModalClient` pattern — wired to the header's Login/Logoff control, plus a small auth event bus so other components can react to login/logout.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- **Endpoints** (all under `/users/`, already routed in `source/games/urls.py` except `status`):
  - `POST /users/login.json` — existing. Body `{username, password}`. `200 {token}` / `401 {error}`.
  - `POST /users/logout.json` — existing. Requires `Authorization: Token <token>`. `204` on success.
  - `GET /users/status.json` — **new**. No body. Returns `200 {logged_in: true, username: <str>}` when the request's `Authorization: Token <token>` header maps to a valid token, otherwise `200 {logged_in: false}` (never 401 — this is a check, not an auth gate).
- **Required header**: the frontend must send `X-Skip-Cache: 1` on `login.json`, `logout.json`, and `status.json` requests (these must never be served from the proxy cache).
- **Auth token storage**: the frontend stores the token returned by `login.json` in `localStorage` (key `authToken`) and sends it back as `Authorization: Token <value>` on `logout.json`/`status.json`.
- **Auth event**: the frontend dispatches a `window` `CustomEvent('auth:changed', { detail: { loggedIn: boolean } })` after a successful login, logout, or the page-load status check — any component that needs to react to login state subscribes to this event (same `window.addEventListener` pattern already used by `AppController` for `hashchange`).

## Implementation Steps

### Step 1 — Backend: add the status endpoint
See [backend.md](backend.md).

### Step 2 — Frontend: login modal, auth client, header wiring, event bus
See [frontend.md](frontend.md).

## Notes
- `login`/`logout`/`register` views and their tests already exist in `source/games/views/auth.py` / `source/games/tests/auth_test.py` — only the `status` endpoint is new backend work.
- No existing event-bus utility exists in the frontend; `auth:changed` on `window` is introduced as the minimal mechanism, following the existing `hashchange` listener pattern in `AppController`.
