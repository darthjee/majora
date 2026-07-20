# Plan: PC show page should show up to 11 photos

Issue: [744-pc-show-page-should-show-up-to-11-photos.md](../issues/744-pc-show-page-should-show-up-to-11-photos.md)

## Overview

Raise the PC/NPC photo preview limit from 6 to 11 in the frontend (both the fetch's default
`per_page` and the display slice), and add matching `short_pc_photos`/`short_npc_photos`
cache-warm entries to `.circleci/navi_config.yaml` at `per_page=11`, mirroring the existing
`short_pc_treasures`/`short_pc_items` pattern. No backend change is needed — the pagination
endpoint already accepts any `per_page` value.

## Agents involved

- [frontend](frontend.md)
- [infra](infra.md)

## Shared contracts

The photo preview fetch URL infra warms must exactly match the URL the frontend actually
requests, or cache warming misses:

- URL shape: `/games/{:slug}/pcs/{:id}/photos.json?per_page=11` (and the `npcs` equivalent).
- `11` is the new preview limit, replacing `6` everywhere it appears for this feature:
  - Frontend: `MAX_PREVIEW_PHOTOS` (display slice) and `CharacterClient.fetchCharacterPhotos`'s
    default `perPage` (fetch bound) — both must become `11`, and both must stay equal to each
    other so the fetch and the slice never disagree.
  - Infra: the new `short_pc_photos`/`short_npc_photos` warm-cache entries must use
    `per_page=11`, the same value.
