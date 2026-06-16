# Remove players link

## Context

The game detail page (`/#/games/:game_slug`) contains a link to a players page that does not exist and has no planned implementation in the near term. The broken link causes a dead-end navigation experience and confuses users.

## What needs to be done

- **Frontend:** Remove the players link from the game detail page component.

## Acceptance criteria

- [ ] The players link is removed from the game detail page
- [ ] No dead links remain on the game detail page
- [ ] Existing tests continue to pass
