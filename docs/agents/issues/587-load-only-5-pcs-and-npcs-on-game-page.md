# Issue: Load only 5 PCs and NPCs on game page

## Description
On the game page (`/#/games/:game_slug`), the PC and NPC preview sections currently fetch and render 6 characters each: `GET /games/:game_slug/pcs.json?per_page=6` and `GET /games/:game_slug/npcs.json?per_page=6` (the latter also applies to the authenticated `npcs/all.json` fallback).

## Problem
Showing 6 PCs and 6 NPCs in the preview sections is more than needed. Each preview section already ends with a "See all" card linking to the full list, so the preview itself doesn't need to hold this many items.

## Expected Behavior
The game page preview sections load and display only 5 PCs and 5 NPCs, instead of 6.

## Solution
Reduce the preview limit for PC and NPC listings on the game page from 6 to 5. Both the fetch request (`per_page`) and the client-side preview rendering are driven by the same shared constant (`MAX_PREVIEW_CHARACTERS`), so updating it keeps the fetched count and the rendered count in sync. This constant is scoped to character previews only — it does not affect the separate treasure or photo preview limits, which stay at 6.

## Benefits
- Slightly reduces payload size and DOM size for the game page preview sections.
