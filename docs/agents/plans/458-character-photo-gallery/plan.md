# Plan: Character photo gallery

Issue: [458-character-photo-gallery.md](../issues/458-character-photo-gallery.md)

## Overview

PCs and NPCs already have a full backend photo model (`CharacterPhoto`) and a full paginated
photo gallery page (`/#/games/:game_slug/pcs/:id/photos` and the NPC equivalent) — no backend
or gallery-page work is needed. The gap is that the show page only displays the single profile
photo. This plan adds a small, static photo preview section to the show page, mirroring the
existing treasures preview, plus a matching Navi cache-warmer entry and the new translation
keys the preview needs.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)
- [infra](infra.md)

## Shared contracts

- **i18n keys** (translator owns adding these to every locale file; frontend only calls
  `Translator.t(...)` — a missing key safely falls back to the key itself, so frontend work is
  never blocked on translator's):
  - `character_page.photos_title` — section heading, analogous to the existing
    `character_page.treasures_title: Treasures` (English value: `Photos`).
  - `character_photos_preview.empty` — empty-state text, analogous to the existing
    `character_treasures_preview.empty: No treasures yet.` (English value: `No photos yet.`).
  - No new key needed for the "See all" link text — reuse the existing
    `character_preview_section.see_all: See all {{title}}`.
- **Data source**: unlike treasures (fetched from a separate `treasures.json` endpoint and
  merged client-side by `CharacterController.fetchAndMergeTreasures`), the character detail
  payload (`CharacterDetailSerializer`, `source/games/serializers/character_detail.py`)
  **already includes a full `photos` array** (`{id, path}` per photo). No new endpoint, no
  client-side merge step, and no backend change are needed — frontend reads `character.photos`
  directly. Nothing here needs to be produced by another agent.
- **Cache-warmer endpoints** (infra owns `.circleci/navi_config.yaml`; no contract back to
  frontend since these routes already exist and are unaffected by the frontend change):
  `/games/{:slug}/pcs/{:id}/photos.json` and `/games/{:slug}/npcs/{:id}/photos.json` (the
  paginated full-gallery endpoints backing the "See all" link's destination page).
