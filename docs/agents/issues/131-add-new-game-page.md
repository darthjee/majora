# Issue: Add new game page

## Description
Add a new game creation page at `/#/games/new` that lets authenticated users create a new game by posting to `POST /games.json`.

## Problem
There is currently no frontend page for creating a new game. Users have no way to create games through the UI.

## Expected Behavior
Navigating to `/#/games/new` shows a form with fields for name, photo, and description. On successful submission the user is redirected to the newly created game's detail page (`/#/games/:game_slug`). On validation failure, field errors are displayed inline. Unauthenticated users who reach this page are redirected to login. The games list page (`/#/games`) includes a link or button to navigate to `/#/games/new`.

## Solution
1. Register the `/games/new` route in `HashRouteResolver` **before** the `/games/:game_slug` route to prevent the wildcard from swallowing the literal segment.
2. Add a `gameNew` page key to `AppHelper` and its `PAGES` map.
3. Add a `createGame` method to `GameClient` that sends `POST /games.json` with `name`, `photo`, and `description`.
4. Add a `POST` handler to the `games_list` backend view that validates and persists the new game, returning the created game (including its `game_slug`) on success. Requires authentication.
5. Create `GameNewController` that handles form submission: checks authentication (redirecting to login if no token is present), calls `createGame`, redirects to `/#/games/:game_slug` on success, sets field errors on 400, sets a general error otherwise.
6. Create the `GameNew` page component, structured like `GameEdit`, with name, photo, and description fields.
7. Add a "New Game" link or button to the games list page (`Games.jsx` / `GamesHelper`).

## Benefits
Users can create new games directly from the UI without needing direct API access.

---

Tags: ✏️
