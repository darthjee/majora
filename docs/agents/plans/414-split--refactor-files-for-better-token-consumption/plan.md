# Plan: Split / refactor files for better token consumption

Issue: [414-split--refactor-files-for-better-token-consumption.md](../../issues/414-split--refactor-files-for-better-token-consumption.md)

## Overview

Split `backend/games/views/game/_character_shared.py` (1,111 lines) into 6 new domain-specific `_*_shared.py` files plus a reduced core, and extract the lookup helpers out of `backend/games/views/game/_treasure_exchange.py` into a new `_treasure_finder.py`. Pure refactor — no behavior, API, or permission changes.

See [backend.md](backend.md) for the full plan.
