# Backend Plan: Remove the game content copy specs

Main plan: [plan.md](plan.md)

## Shared contracts

Point docstrings at the new permanent docs created by the architect (see
[plan.md](plan.md#shared-contracts)): `docs/agents/game-content-copy.md` and
`docs/agents/game-content-copy/<tab>.md`. Each tab page has a `## Cache` section, and
`recipes.md` has a `## Common item` section.

## Implementation Steps

### Step 1 — Repoint docstrings from the specs to the permanent docs

Comment-only change, no behavior change. Replace every `docs/agents/specs/game-content-copy/...`
reference with the matching permanent path, and replace the word "spec" with "page" or "doc"
where it refers to these files:

- `copy_types_items.py`: `docs/agents/game-content-copy/items.md`
- `copy_types_common_items.py`: `docs/agents/game-content-copy/common-items.md` (it points at
  the folder today)
- `copy_types_recipes.py`: `docs/agents/game-content-copy/recipes.md`
- `copy_types_documents.py`, `copy_document_associations.py`:
  `docs/agents/game-content-copy/documents.md`
- `copy_types_factions.py`: `docs/agents/game-content-copy/factions.md`
- `copy_types_possessions.py`: `docs/agents/game-content-copy/possessions.md`
- `copy_recipe_common_item.py`: the "Common item" section of
  `docs/agents/game-content-copy/recipes.md`
- `copy_links.py`, `copy_cache_paths.py`: the "Cache" section of each tab page under
  `docs/agents/game-content-copy/`
- `copy_types.py` line 7: "the position the spec's tab table gives" becomes the tab table
  in `docs/agents/game-content-copy.md`. Drop the "Each tab issue inserts" wording if it reads
  as planning text.

Leave `crawler_debug_emission_paginator.py` alone: it points at the unrelated
crawler-test-harness spec.

## Files to Change

- `backend/staff/copy_types.py`
- `backend/staff/copy_types_items.py`
- `backend/staff/copy_types_common_items.py`
- `backend/staff/copy_types_recipes.py`
- `backend/staff/copy_types_documents.py`
- `backend/staff/copy_types_factions.py`
- `backend/staff/copy_types_possessions.py`
- `backend/staff/copy_document_associations.py`
- `backend/staff/copy_recipe_common_item.py`
- `backend/staff/copy_links.py`
- `backend/staff/copy_cache_paths.py`

## CI Checks

- `backend`: lint per `AGENTS.md` (flake8/pylint through `docker-compose`). Docstring
  line-length limits still apply.

## Notes

- `grep -rn "specs/game-content-copy" backend` must return nothing afterwards.
