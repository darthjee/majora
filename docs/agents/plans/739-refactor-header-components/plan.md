# Plan: Refactor game views folder structure

Issue: [739-refactor-header-components.md](../issues/739-refactor-header-components.md)

## Overview

Move the 26 domain-specific flat `_*.py` view helper files under
`backend/games/views/game/` into 6 new domain subfolders (`documents/`,
`factions/`, `items/`, `photos/`, `possessions/`, `treasures/`), updating
`_character_shared.py` and all direct consumer files' imports accordingly,
one commit per domain.

See [backend.md](backend.md) for the full plan.
