# Issue: Add more link types

## Description
Currently, links (both the generic `Link` model and `CharacterLink`) support a single type, `lootstudio`, rendered in the UI via a PNG image (`LINK_TYPE_ICONS` in `frontend/assets/js/components/common/LinkIcon.jsx`). This issue adds five new link types, each associated with a Bootstrap Icon instead of an image:

| type | icon (Bootstrap Icons) |
| ---- | ---- |
| diary | feather |
| music | music-note-list |
| stl | box |
| background | book-half |
| reference | bookmark-star-fill |

## Problem
Users can currently only categorize a link as `lootstudio`. There is no way to mark a link as pointing to a character's diary, a music reference, a 3D-printable model (STL), background/lore material, or a general reference resource, nor a matching icon to visually distinguish them in the UI.

## Solution
- Extend `LINK_TYPE_CHOICES` on both `backend/games/models/link.py` and `backend/games/models/character/character_link.py` (currently duplicated, unshared enums) with the five new types: `diary`, `music`, `stl`, `background`, `reference`.
- Add the corresponding Django migration altering the `link_type` choices on both the `Link` and `CharacterLink` tables.
- Extend `frontend/assets/js/components/common/LinkIcon.jsx` to render a Bootstrap Icon class (e.g. `bi-feather`, `bi-music-note-list`, `bi-box`, `bi-book-half`, `bi-bookmark-star-fill`) for the five new types, while keeping the existing PNG-based rendering for `lootstudio` unchanged.
- Add `link_type_<type>` translation labels for all five new types to `frontend/assets/i18n/en.yaml` and `pt.yaml`, so they appear in the type dropdown (`LinksEditModalHelper.jsx`).

## Benefits
Users can categorize links more precisely and recognize their kind at a glance via distinct icons, improving navigation of a character's or game's linked resources.
