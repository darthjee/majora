# Issue: Staff Can Edit Pc Money

## Description
Currently, editing a PC or NPC's money requires navigating to the full character edit page, which not all users who should be able to adjust money have access to. This issue adds a quick "Edit" link directly on the character show page for both PCs and NPCs.

## Problem
The only way to edit a PC or NPC's money today is through the full character edit page. Users who should be able to adjust money — for example staff members — may not have access to that full edit page.

## Expected Behavior
- On the PC/NPC show pages (`/#/games/:game_slug/pcs/:id` and `/#/games/:game_slug/npcs/:id`), an "Edit" link appears just beneath the money display component, visible only to users with permission.
- Clicking it opens the existing money edit modal (the same one already used on the character edit page, chosen based on `gameType`) — wired only for this show-page context; the character edit page's own modal usage is unaffected.
- Clicking Save in this context:
  - persists the new money value via the new endpoint (see Solution)
  - closes the modal
  - reloads the character data: `GET /games/:game_slug/pcs/:id/full.json` (or the NPC equivalent) when the user has full access, otherwise the plain `GET .../:id.json`

## Solution
- Add the edit link inside the money display area on the show page (`CharacterMoney.jsx`, rendered via `CharacterHelper.jsx`), just below the existing markup.
- New endpoints:
  - `PUT /games/:game_slug/pcs/:id/money`
  - `PUT /games/:game_slug/npcs/:id/money`
- Both endpoints must clear the PC/NPC proxy cache the same way the existing full-character update already does.

### Security
Access to the edit link and the new endpoints is restricted to:
- admin
- dm
- staff
- player — **PCs only**; for NPCs, only admin/dm/staff are allowed (a regular player cannot edit NPC money, even for an NPC they otherwise have narrow visibility into)

The edit link itself must be hidden entirely from users without permission (not merely shown-but-erroring on save), consistent with how other edit affordances are conditionally rendered in the app.

### Affected pages
- `/#/games/:game_slug/pcs/:id`
- `/#/games/:game_slug/npcs/:id`

## Benefits
Authorized users (including staff without full edit access) can adjust money quickly without navigating to the full character edit page.
