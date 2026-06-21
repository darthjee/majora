# Plan: Add favorite language to user

Issue: [80-add-favorite-language-to-user.md](../issues/80-add-favorite-language-to-user.md)

## Overview
Persist a logged-in user's language preference on the backend: a new `UserProfile.favorite_language` field, a non-cacheable endpoint to update it, and an extension of the existing `status.json` endpoint to return it. The frontend saves the preference whenever the language selector changes for a logged-in user, and applies the saved preference on page load.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- **`GET /users/status.json`** (existing, from issue #73) — when logged in, the response gains a `settings` object: `{"logged_in": true, "username": "<str>", "settings": {"favorite_language": "<code>"}}`. When not logged in, unchanged: `{"logged_in": false}` (no `settings` key).
- **`POST /users/language.json`** — new, `IsAuthenticated`. Body `{"language": "<code>"}`. `200 {"favorite_language": "<code>"}`. No server-side validation against a fixed language list (the backend just stores whatever string it's given — the frontend only ever sends codes it knows about via `Translator.getAvailableLanguages()`).
- **Header required**: the frontend sends `X-Skip-Cache: 1` on `language.json`, matching the convention already used for `login`/`logout`/`status` (issue #73) — this request must never be served from the proxy cache.
- **Trigger**: the frontend calls `language.json` only when the language selector changes **and** the user is currently logged in; logged-out language changes stay purely client-side (already handled by `Translator`/`LanguageStorage` from issue #79).

## Implementation Steps

### Step 1 — Backend: profile field + endpoints
See [backend.md](backend.md).

### Step 2 — Frontend: persist on change, apply on load
See [frontend.md](frontend.md).

## Notes
- This builds directly on issue #73 (`status.json`, `AuthClient`, `HeaderController`) and issue #79 (`Translator`, `LanguageSelector`, `LanguageSelectorController`) — both already merged to `main`.
