# Issue: Add Player page

## Description
Add a Player detail page reachable from the existing Game Players list, plus the backend endpoints it needs. The page shows a single player's character and player information, and the conversations that player shares with the current user.

## Problem
The Game Players list page (`/#/games/:game_slug/players`) renders each player as a non-clickable card (`buildPlayerItemHref` in `playersListType.js` currently always returns `null`). There is no way to open a single player's details, and no backend endpoint exists to fetch one player or to see which conversations two players share.

## Expected Behavior
- Each player card on `/#/games/:game_slug/players` links to `/#/games/:game_slug/players/:id`.
- The new page shows two compact, list-style cards at the top: the player's character (photo + name) and the player themself (photo + name) — same fields/format as the existing roster cards, just two side by side.
- Below the cards, a left column lists (paginated) the conversations shared between the current user and this player. The right column is reserved for a future messages feature and is out of scope here.
- `GET /games/:game_slug/players/:id.json` returns a single player in the same shape as `PlayerListSerializer` (id, user, character).
- `GET /games/:game_slug/conversations.json?player_id=<id>` returns the current user's conversations in that game, filtered to ones `player_id` also participates in; paginated. This is a brand-new endpoint (built from scratch in this issue) — no urls/views/serializers for conversations exist yet.
- Both endpoints set `X-Skip-Cache: true`.

## Solution
Frontend: add a route `/games/:game_slug/players/:id` (`HashRouteResolver.js`), a new page component, and update `buildPlayerItemHref` in `playersListType.js` to link to it. Add a conversations list panel reusing the shared `ListPage`/`Pagination` components. Drop the "add link to Game dropdown menu" item — `HeaderNavHelper.jsx` already links to `/#/games/:game_slug/players`.

Backend: add a single-player view next to `game_players` (`backend/games/views/game/players/`), reusing `PlayerListSerializer`. Build the `conversations.json` endpoint from scratch — filter `Conversation` by `ConversationParticipant` rows for both the requesting user's player and `player_id`, since `Conversation` has no direct `game` FK.

Access: DM/players of the game only — **not** staff/admin, who have no legitimate reason to browse the roster or player conversations. This narrows `/games/:game_slug/players`, `/games/:game_slug/players/:id`, and `/games/:game_slug/conversations.json` to `game.has_player(user)`, dropping the `is_superuser`/`is_staff` bypass that `PlayerPermission` (used only by this endpoint) currently grants.

## Benefits
Lets players drill into a specific fellow player/character and see their shared conversation history, and lays the groundwork (conversations endpoint, detail page shell) for the upcoming messages feature.
