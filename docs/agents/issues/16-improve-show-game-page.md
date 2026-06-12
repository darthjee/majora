# Issue: Improve Show Game Page

## Description

The game detail page (`/#/games/:game_slug`) currently shows minimal information. It needs
to be improved with a full game description and navigation links to related content pages.

## Problem

- The game model has no description field — only `name`, `game_slug`, and `photo`.
- The game detail page does not show a description of the game.
- There are no navigation links to the players, PCs, or NPCs pages for the game.

## Expected Behavior

- A `description` full-text field is added to the `Game` model and exposed via the API.
- The game detail page displays the game description when present.
- The game detail page includes navigation links to:
  - Index PCs page (`#/games/:slug/pcs`) — route already exists
  - Index NPCs page (`#/games/:slug/npcs`) — route already exists
  - Index players page (`#/games/:slug/players`) — route does not yet exist; link is a placeholder pointing to the future route

## Context

- `GamePcs` and `GameNpcs` pages are already implemented and registered in the router.
- There is no players page or `#/games/:slug/players` route yet; the players link will point
  to this future route without a working destination for now.

## Solution

### Backend
- Add `description = models.TextField(blank=True, default='')` to the `Game` model.
- Create a migration for the new field.
- Add `description` to `GameDetailSerializer`.
- Update admin and backend tests.

### Frontend
- Update the `Game` detail page (and its helper) to display the description.
- Add navigation link buttons/cards linking to PCs, NPCs, and players index pages.
- Follow the three-layer architecture: component → controller → helper.

## Benefits

- Gives game masters a place to document their campaign setting.
- Makes it easy to navigate from a game's page to its related listings.

---
See issue for details: https://github.com/darthjee/majora/issues/16
