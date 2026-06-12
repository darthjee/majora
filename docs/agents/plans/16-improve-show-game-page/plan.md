# Plan: Improve Show Game Page

## Overview

Add a `description` TextField to `Game`, expose it in the detail API, then improve the
`Game` detail page to show the description and navigation links to PCs, NPCs, and players.

## Context

- `Game` model has no `description` field yet.
- `Game.jsx` renders a bare `<div>{game?.name}</div>` with no helper/helper layer.
- `GamePcs` and `GameNpcs` pages already exist at `#/games/:slug/pcs` and `#/games/:slug/npcs`.
- No players page exists yet; the link will point to the future route `#/games/:slug/players`.

## Implementation Steps

### Step 1 — Backend: add `description` to Game model

Add `description = models.TextField(blank=True, default='')` to `source/games/models.py`.

### Step 2 — Backend: migration

Create `source/games/migrations/0007_game_description.py` with `AddField` for `description`.

### Step 3 — Backend: serializer

Add `'description'` to `GameDetailSerializer.Meta.fields`.

### Step 4 — Backend: tests

In `TestGameDetailView`, add:
- `test_returns_description_field` — asserts `description` is present in detail response.

### Step 5 — Frontend: GameHelper

Create `frontend/assets/js/components/pages/helpers/GameHelper.jsx` with:
- `render(game)` — Bootstrap layout: photo, name, description, navigation links
- `renderLoading()` — spinner/loading message
- `renderError(error)` — alert danger

Navigation links rendered as Bootstrap buttons:
- PCs → `#/games/${game.game_slug}/pcs`
- NPCs → `#/games/${game.game_slug}/npcs`
- Players → `#/games/${game.game_slug}/players` (placeholder)

### Step 6 — Frontend: refactor Game.jsx

Update `Game.jsx` to delegate to `GameHelper` following the same pattern as `Games.jsx`.

### Step 7 — Frontend: specs

Create `frontend/specs/assets/js/components/pages/helpers/GameHelperSpec.js` with:
- renders game name
- renders game description
- renders link to PCs page
- renders link to NPCs page
- renders link to players page
- renderLoading renders loading state
- renderError renders error alert

## Files to Change

**Backend:**
- `source/games/models.py` — add `description` field
- `source/games/migrations/0007_game_description.py` — new migration
- `source/games/serializers.py` — add `description` to `GameDetailSerializer`
- `source/games/tests/views_test.py` — add description test

**Frontend:**
- `frontend/assets/js/components/pages/helpers/GameHelper.jsx` — new helper
- `frontend/assets/js/components/pages/Game.jsx` — delegate to GameHelper
- `frontend/specs/assets/js/components/pages/helpers/GameHelperSpec.js` — new spec

## CI Checks

Before opening a PR, run:
- `frontend/`: `yarn test && yarn lint` (Jasmine + ESLint)
- `source/`: `ruff check source/` (ruff linter; DB tests require Docker)
