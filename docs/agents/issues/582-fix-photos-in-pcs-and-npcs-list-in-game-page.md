# Issue: Fix photos in pcs and npcs list in game page

## Description
The game page (`/#/games/:game_slug`) shows two preview sections, PC list and NPC list, each displaying the game's character photos followed by a "see more" card linking to the full standalone list page (`/#/games/:game_slug/pcs` and `/#/games/:game_slug/npcs`).

Today these sections reuse the same `CharacterCard` component (`frontend/assets/js/components/common/CharacterCard.jsx`, rendered via `CharacterPreviewSectionHelper`) that the standalone list pages use, just with `size="small"`. The "see more" card at the end of each section is a different component, `SeeAllCard`.

## Problem
- The small `CharacterCard` uses narrower grid columns (`col-sm-3 col-md-2 col-lg-1`) than `SeeAllCard` (`col-6 col-sm-4 col-md-3 col-lg-2`), so character photos appear noticeably smaller than the "see more" card at the end of the row.
- The small `CharacterCard` still renders `ActionsOverlay` (upload/slain-toggle buttons) and the info bar, which are meant for character management and are not relevant on this read-only preview section.

## Solution
Create a new dedicated component for these game-page preview sections (there is currently none — `CharacterPreviewSectionHelper` just reuses `CharacterCard`), styled like `SeeAllCard`:

- Same grid columns/card layout as `SeeAllCard` (`col-6 col-sm-4 col-md-3 col-lg-2`, `card h-100`), so cards in a row are visually consistent.
- Show the character photo (via `CardAvatar`, falling back to the default placeholder) instead of an icon.
- The whole card is a link to the character page (as `CharacterCard` does today).
- No `ActionsOverlay`/info bar/action bar — this is a read-only preview; management actions remain on the standalone list pages.
- Slain characters keep the grayscale photo treatment (`photo-grayscale` filter).
- Card border keeps indicating allegiance the same way it does today (NPCs only, via `allegianceBorderClass`).

`CharacterPreviewSectionHelper` (`frontend/assets/js/components/common/helpers/CharacterPreviewSectionHelper.jsx`) would swap its `CharacterCard` usage for this new component; `SeeAllCard` and the standalone list pages stay unchanged.
