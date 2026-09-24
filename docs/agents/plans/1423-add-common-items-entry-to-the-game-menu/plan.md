# Plan: Add "Common Items" entry to the Game menu

Issue: [1423-add-common-items-entry-to-the-game-menu.md](../../issues/1423-add-common-items-entry-to-the-game-menu.md)

## Overview

Common items already have list, new, show and edit pages and routes, but the header's
**Game** dropdown has no entry for them. This plan adds a "Common Items" entry right after
"Items", linking to `#/games/<slug>/common_items`, with the same `IS_GAME_PAGE` audience
as Items. It also adds the label in en and pt and updates the Game-menu order spec. No
backend or permission changes are needed: common items already have exactly the same
permissions as `GameItem`.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

- **i18n key:** `game_page.common_items`, a new key under the existing `game_page`
  namespace (`frontend/assets/i18n/<lang>/game_page.yaml`).
  - en: `Common Items`
  - pt: `Itens Comuns`
- The frontend consumes the key via `gameItem('common-items', '/common_items', 'game_page.common_items')`
  in `NAV_LINK_REGISTRY`. The translator provides it in every language directory, so
  `check_i18n` passes.
