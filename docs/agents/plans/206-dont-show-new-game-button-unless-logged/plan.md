# Plan: Don't Show New Game Button Unless Logged

Issue: [206-dont-show-new-game-button-unless-logged.md](../issues/206-dont-show-new-game-button-unless-logged.md)

## Overview

Two independent changes gate the game-creation feature behind authentication. The frontend conditionally hides the "New Game" button when the user is not logged in, by subscribing to `AuthEvents` in `Games.jsx` and passing the auth state down to `GamesHelper.render()`. The backend creates a `GameMaster` record for the requesting user immediately after a game is successfully saved, ensuring every new game has a DM from creation time.

## Agents involved

- [frontend](frontend.md)
- [backend](backend.md)

## Shared contracts

None. The two changes are independent:
- The frontend tracks login state via `AuthStorage` / `AuthEvents` — purely client-side.
- The backend creates a `GameMaster` inside `_create_game` — no new API fields are exposed.
