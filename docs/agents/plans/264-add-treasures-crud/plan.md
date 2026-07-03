# Plan: Add treasures CRUD

Issue: [264-add-treasures-crud.md](../../issues/264-add-treasures-crud.md)

## Overview

Make the already-implemented treasures pages (`Treasures.jsx`, `TreasureNew.jsx`,
`TreasureEdit.jsx`, routes, backend, serializers) actually reachable and admin-gated:
add a superuser-only "Treasures" link to the header nav, add a client-side admin guard
to the `#/treasures`, `#/treasures/new`, and `#/treasures/:id/edit` routes, and replace
the plain `list-group` rendering on both the main and game-scoped treasures indexes with
a new `TreasureCard` grid (6 per row), backed by a new `default_treasure.png` placeholder
image. This is a frontend-only feature; the only cross-agent dependency is one new
translation key for the nav link.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

The frontend introduces exactly one new translation key, referenced via `Translator.t()`
in `HeaderHelper.jsx`:

- `header.nav_treasures`

This key must be added under the existing top-level `header:` block in every locale file
under `frontend/assets/i18n/` (currently `en.yaml` and `pt.yaml`), alongside the existing
`header.nav_games` key, so `npm run check_i18n` (key-parity check) keeps passing.
