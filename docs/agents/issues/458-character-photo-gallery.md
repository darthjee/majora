# Issue: Character photo gallery

## Problem

Both PCs and NPCs can have multiple photos (backed by the `CharacterPhoto` model and manageable via the existing full gallery page at `/#/games/:game_slug/pcs/:id/photos` and `/#/games/:game_slug/npcs/:id/photos`), but their show page (`/#/games/:game_slug/pcs/:id` and `/#/games/:game_slug/npcs/:id`) only displays a single profile photo. There is no quick way to see the character's other photos without navigating to the full gallery page.

## Solution

Add a small photo preview section to the PC/NPC show page, mirroring the existing `CharacterTreasuresPreview` pattern:

- A new preview component/helper (analogous to `CharacterTreasuresPreview`/`CharacterTreasuresPreviewHelper`) rendered from `CharacterHelper.render()`, showing a limited card grid of the character's photos.
- Preview photos are static (no click behavior); only a "See all" link navigates, to the existing full photos gallery page (`.../photos`).
- Cap the number of preview photos using a new `MAX_PREVIEW_PHOTOS` constant in `frontend/assets/js/components/common/characterPreviewConstants.js`, following the same style as `MAX_PREVIEW_TREASURES`.
- Add a Navi cache warmer entry in `.circleci/navi_config.yaml` for the per-character photos endpoints (`/games/{:slug}/pcs/{:id}/photos.json` and `/games/{:slug}/npcs/{:id}/photos.json`), following the same pagination pattern already used for `game_treasures`/`paginated_game_treasures`, wired as actions off the existing `pc`/`npc` resources.

No changes are needed to the full gallery page or backend photo model/endpoints — they already exist and are unaffected.
