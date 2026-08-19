# Issue: Refactor character-related components and specs flagged as too long (Lizard nloc-medium)

## Description

Sub-issue of #1167 (itself a sub-issue of #1152). Codacy's `Lizard` complexity analyzer flags 9 methods across 9 files under `frontend/assets/js/components/resources/character/` and its associated Jasmine controller specs as exceeding the 50-NLOC-per-method limit.

## Problem

These components and specs mix several concerns (markup for multiple sections, multiple test scenarios, or multiple assertions-and-setup blocks) in one long method, making them harder to read and maintain.

## Expected Behavior

Each method below drops back under its 50-NLOC limit through genuine sub-responsibility extraction — split components into smaller sub-components or extracted render helpers, and split specs by extracting shared setup/assertion helpers or breaking up long `it`/anonymous blocks — following the project's existing pattern of splitting test files and extracting shared setup helpers, per the Definition of Done strengthened in #1152.

## Solution

For each occurrence, identify the distinct sections/responsibilities being mixed together and extract them into well-named helper methods, sub-components, or shared spec helpers.

### Occurrences (9, across 9 files)

- `frontend/assets/js/components/resources/character/pages/GameNpcNew.jsx`
  - line 18: Method GameNpcNew has 78 lines (limit 50)
- `frontend/assets/js/components/resources/character/pages/GameNpcs.jsx`
  - line 73: Method GameNpcs has 76 lines (limit 50)
- `frontend/assets/js/components/resources/character/pages/elements/helpers/NpcFiltersHelper.jsx`
  - line 23: Method render has 62 lines (limit 50)
- `frontend/assets/js/components/resources/character/pages/shared/CharacterDetail.jsx`
  - line 53: Method CharacterDetail has 69 lines (limit 50)
- `frontend/assets/js/components/resources/character/pages/shared/CharacterEdit.jsx`
  - line 51: Method CharacterEdit has 89 lines (limit 50)
- `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx`
  - line 26: Method CharacterPhotos has 73 lines (limit 50)
- `frontend/assets/js/components/resources/character/pages/shared/CharacterTreasures.jsx`
  - line 88: Method CharacterTreasures has 53 lines (limit 50)
- `frontend/specs/assets/js/components/resources/character/pages/controllers/BaseCharacterEditController/submitFormSpec.js`
  - line 26: Method (anonymous) has 63 lines (limit 50)
- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterEditController/submitFormSpec.js`
  - line 34: Method (anonymous) has 66 lines (limit 50)

## Benefits

Improved readability, reusability, and testability of the character components and their specs; passes the Codacy Lizard check.
