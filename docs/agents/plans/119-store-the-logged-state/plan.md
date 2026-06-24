# Plan: Store the Logged State

Issue: [119-store-the-logged-state.md](../issues/119-store-the-logged-state.md)

## Overview

On successful login, the backend creates a Django server-side session and stores the user's DRF token inside it. The session ID travels as an `HttpOnly` cookie, so the token never touches `localStorage` or JavaScript. On page refresh, the frontend calls `/users/status.json` without an `Authorization` header; the backend reads the session cookie, looks up the token, and returns the auth status plus the token so the frontend can restore it into memory for subsequent API calls.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

### `GET /users/status.json` — extended response

When the request carries a valid session cookie **and no `Authorization` header**, the backend authenticates via the session and includes the token in the response:

```json
{
  "logged_in": true,
  "username": "alice",
  "user_id": 1,
  "settings": { "favorite_language": "en" },
  "token": "abc123..."
}
```

When authenticated via `Authorization: Token <key>` (existing behavior), the `"token"` field is **omitted** (the frontend already has it in memory).

When not authenticated, the response remains:

```json
{ "logged_in": false }
```

### Session cookie

After a successful login or registration, the backend sets Django's standard `sessionid` cookie with:
- `HttpOnly: true`
- `SameSite: Lax`
- `Secure: true` in production (controlled by `SESSION_COOKIE_SECURE` env var)

The cookie is sent automatically by the browser on every subsequent request; the frontend does **not** need to read, store, or forward it.

### Login / Register response — unchanged

`POST /users/login.json` and `POST /users/register.json` response shapes remain unchanged. The token is still returned in the body so the frontend can hold it in memory for the current page lifetime. The new session cookie is set as a side effect.

### Logout — session is cleared server-side

`POST /users/logout.json` clears both the DRF token **and** the session. The frontend needs no extra header or body change.
