# Issue: Add a My Games page

## Description
Add a "My Games" page (`/#/my-games/`) that lists every game the current user belongs to, showing their role in that game (player or DM), their character in that game (unless they are the DM), and how many conversations they follow in that game.

## Solution
### Page
- Path: `/#/my-games/`
- Renders a list of game cards
- Each card's info bar shows 4 badges:
  - Role badge: "DM" or "Player"
  - Character badge: the character's name (omitted for DMs, and when the player has no character yet in that game)
  - Bootstrap `envelope` icon + count of conversations the user follows in that game (tooltip: "Following x conversations")
  - Bootstrap `envelope-fill` icon + count of unread conversations in that game (tooltip: "x unread conversations")
- A dedicated backend response wrapper is needed to shape the endpoint's return

### Endpoint
- `GET /my-games.json`
- Returns an array of items, each with:
  - `game`: the same lightweight shape as the general Games list (name, slug, cover photo)
  - `role`: "dm" or "player"
  - `character`: the character the user plays in that game, or `null` if they're a DM or have no character yet
  - `conversations`: `{ count, unread_count }` — conversations the user follows that have at least one participant in that game, and how many of those are unread

### Link
- Add a "My Games" item to the Account dropdown menu in the header

### Permissions
- Link and endpoint are only available to logged-in users

## Benefits
Gives users a single place to see all their games together with their role, character, and conversation activity, instead of checking each game individually.
