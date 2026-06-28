# Plan: Add New Game Page

Issue: [131-add-new-game-page.md](../issues/131-add-new-game-page.md)

## Overview

Add a `/#/games/new` route that presents a form for authenticated users to create a new game via `POST /games.json`. On success the user is redirected to the new game's detail page. On failure, inline field errors are shown. The games list page gains a "New Game" link. The work spans backend (new endpoint), frontend (route, page, controller, helper, client method), and translator (i18n keys).

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### POST /games.json

**Request**
- Method: `POST`
- Headers: `Authorization: Token <token>`, `Content-Type: application/json`, `Accept: application/json`
- Body: `{ "name": string (required), "photo": string|null (optional), "description": string (optional, default "") }`

**Success — HTTP 201**
Body matches `GameDetailSerializer`: `{ name, game_slug, photo, description, links, photos }`

**Validation failure — HTTP 400**
```json
{ "errors": { "name": ["..."], "photo": ["..."], "description": ["..."] } }
```

**Unauthenticated — HTTP 401**
```json
{ "errors": { "detail": ["authentication required"] } }
```

**Frontend usage:** `GameClient.createGame(token, { name, photo, description })` POSTs to `/games.json`, reads `game_slug` from the 201 body for the redirect to `/#/games/:game_slug`.

### Translation keys (game_new_page)

Both `en.yaml` and `pt.yaml` must define:
- `game_new_page.title`
- `game_new_page.name_label`
- `game_new_page.photo_label`
- `game_new_page.upload_photo_button`
- `game_new_page.description_label`
- `game_new_page.submit`
- `game_new_page.error`

And `games_page.new_game` (the "New Game" button label on the games list).
