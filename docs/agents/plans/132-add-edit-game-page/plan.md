# Plan: Add Edit Game Page

Issue: [132-add-edit-game-page.md](../issues/132-add-edit-game-page.md)

## Overview

Add a game edit flow that lets DMs (game masters) and superusers update a game's `name`, `photo`, and `description`. The backend gains a `PATCH /games/<slug>.json` endpoint and an always-200 `GET /games/<slug>/access.json` endpoint. The frontend gains a `/games/:game_slug/edit` page following the same controller/helper/page pattern as the existing character edit pages. Translations and Navi warm-up config are updated in parallel.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)
- [infra](infra.md)

## Shared contracts

### `PATCH /games/<game_slug>.json`

- **Auth:** `TokenAuthentication` / `AllowAny` permission class (same pattern as character edit). Returns 401 if unauthenticated, 403 if authenticated but not a DM for that game or a superuser.
- **Request body:** JSON object with any subset of `{name: string, photo: string|null, description: string}`. All fields optional.
- **Success response:** 200 with the updated game object (same shape as `GET /games/<slug>.json` — i.e. `GameDetailSerializer` output).
- **Validation error:** 400 `{"errors": {<field>: [<msg>, ...]}}`.
- **URL pattern name:** `game-detail` (reuse existing URL entry, upgrade the view to handle PATCH in addition to GET).

### `GET /games/<game_slug>/access.json`

- **Auth:** `TokenAuthentication` / `AllowAny`.
- **Always returns 200**, never 401 or 404. For unauthenticated users, anonymous requests, or non-existent slugs: `{can_edit: false}`.
- **Response:** `{can_edit: bool}`.
- **Header:** `X-Skip-Cache: true` (same as character access endpoints).
- **URL pattern name:** `game-access`.
- **New URL:** `/games/<slug:game_slug>/access.json`.

### Game object shape (GameDetailSerializer)

Fields frontend can rely on after a successful PATCH: `id`, `name`, `game_slug`, `photo`, `description`, `links`, `photos`. The `game_slug` is read-only and never changed by PATCH.

### Translation namespace

New i18n namespace: `game_edit_page`. Keys:

```yaml
game_edit_page:
  title: Edit game
  name_label: Name
  photo_label: Photo URL
  description_label: Description
  submit: Save changes
  error: Failed to save game. Please try again.
```

Both `en.yaml` and `pt.yaml` must define exactly these keys under `game_edit_page`.
