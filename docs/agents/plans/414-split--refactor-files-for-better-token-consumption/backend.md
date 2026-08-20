# Backend Plan: Split / refactor files for better token consumption

Main plan: [plan.md](plan.md)

## Overview

`backend/games/views/game/_character_shared.py` (1,111 lines, 61 top-level functions) is the largest backend view file and mixes 6 unrelated resource domains (photos, items, documents, factions, possessions, treasures) plus 4 generic cross-domain helpers. `backend/games/views/game/_treasure_exchange.py` (297 lines) mixes treasure lookup helpers with treasure exchange execution logic. Both get split by responsibility, with zero behavior/API changes — only file layout and import paths change.

## Context

Token Efficiency Score for the repo is 52/100 (Fair), with `_character_shared.py` the single largest offender. See the issue for the full function inventory (verified against the current file), the rejected alternatives, and the edge cases (`_check_character_all_permission`'s PC/NPC asymmetry, treasure's lack of that same asymmetry, `build_access_view`/`build_full_view` staying generic).

Decision already made during discussion: the ~118 call sites that currently import `build_*` factories directly from `_character_shared` (see Step 3) must each be updated to import from the correct new domain module. `_character_shared.py` does **not** re-export the moved names — that would recreate a circular import.

## Steps

- [01 — Split `_character_shared.py` by domain](backend/01-split-character-shared.md)
- [02 — Extract `_treasure_finder.py` from `_treasure_exchange.py`](backend/02-extract-treasure-finder.md)
- [03 — Update call-site imports](backend/03-update-call-site-imports.md)
- [04 — Verify the test suite](backend/04-verify-tests.md)

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`)

## Notes

- The issue's original call-site estimate was ~110 files; a repo-wide grep for `_character_shared import` under `views/game/pcs/` and `views/game/npcs/` found 118 matching files — use that as the authoritative count when doing Step 3, not the issue's estimate.
- No migrations, no serializer changes, no permission logic changes — every `build_*` function moves verbatim, only its containing file and its imports change.
- `_character_shared.py`'s final reduced form keeps only `_build_api_view`, `_check_character_all_permission`, `build_access_view`, `build_full_view` — everything else in the file moves to a domain-specific `_*_shared.py` file.
