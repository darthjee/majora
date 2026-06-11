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
  - Index players page
  - Index player characters (PCs) page
  - Index non-player characters (NPCs) page

## Solution

### Backend
- Add a `description = models.TextField(blank=True, default='')` field to the `Game` model.
- Create a migration for the new field.
- Add `description` to `GameDetailSerializer`.
- Update admin and backend tests accordingly.

### Frontend
- Update the `Game` detail page component (and its helper/controller) to display the description.
- Add navigation link components/sections linking to players, PCs, and NPCs index pages for the game.
- Follow the three-layer architecture: component → controller → helper.

## Benefits

- Gives game masters a place to document their campaign setting.
- Makes it easy to navigate from a game's page to its related character and player listings.

---
See issue for details: https://github.com/darthjee/majora/issues/16
