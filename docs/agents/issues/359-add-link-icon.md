# Issue: Add link icon

## Description
Links currently render with a single hardcoded chain icon (Bootstrap Icons `bi-link-45deg`) in `frontend/assets/js/components/elements/LinkList.jsx`, regardless of what the link points to. This shared component is used on the character show page, the game show page, and the character edit page.

## Problem
Two separate backend models back links today: `Link` (polymorphic, used for Games) and `CharacterLink` (direct FK, used for Characters). Neither has a field to distinguish the kind of link, so every link looks the same visually even though the underlying URL may point to very different kinds of destinations.

Separately, `frontend/assets/images/` is currently a flat folder mixing placeholder images (`default_character.png`, `default_game.png`, `default_treasure.png`) with other unrelated assets (`favicon.png`, `my_account.svg`), with no room reserved for new link icons.

## Solution
1. Add a `link_type` field (avoiding the `type` builtin) to **both** `Link` and `CharacterLink` models, following the existing `CharField` + constants + `CHOICES` list convention (see `source/games/models/upload.py`'s `Upload.STATUS_CHOICES`) rather than `models.TextChoices`.
2. Starting enum value: `lootstudio`. More values can be added later.
3. When `link_type` is not set, keep rendering the current chain icon (`bi-link-45deg`) as the fallback.
4. When `link_type` is set (e.g. `lootstudio`), render the corresponding icon image from `frontend/assets/images/links/` instead (e.g. `lootstudio.png`).
5. For now, generate a placeholder icon image (a plain black image at a reasonable icon size) for `lootstudio.png`, to be replaced later with the real artwork.
6. Reorganize `frontend/assets/images/` into subfolders:
   - `assets/images/placeholders/` — `default_character.png`, `default_game.png`, `default_treasure.png`
   - `assets/images/links/` — new link-type icons (e.g. `lootstudio.png`)
   - `assets/images/icons/` — other icons
   - Update the three existing import paths (`CardAvatar.jsx`, `CardPhoto.jsx`, `CardTreasureImage.jsx`) that currently reference the placeholder images directly under `assets/images/`.

## Benefits
Links become visually distinguishable at a glance (e.g. a LootStudio link looks different from a generic link), and the images folder gets a clearer, more scalable structure as more icon sets are added over time.
