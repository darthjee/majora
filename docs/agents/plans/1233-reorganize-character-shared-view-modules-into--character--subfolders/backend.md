# Backend Plan: Reorganize character shared view modules into _character/ subfolders

Main plan: [plan.md](plan.md)

## Steps

- [01 — Create the _character package skeleton](backend/01-create-character-package-skeleton.md)
- [02 — Move the 5 character-wide helpers and merge _character_shared.py into __init__.py](backend/02-move-character-wide-helpers.md)
- [03 — Move the 6 resource-shared hubs and _treasure_finder.py](backend/03-move-resource-shared-hubs.md)
- [04 — Fix wrapper-view imports across game/{npcs,pcs}/detail/**](backend/04-fix-wrapper-view-imports.md)
- [05 — Fix imports in the unmoved granular resource folders and npcs/pcs root files](backend/05-fix-external-imports.md)
- [06 — Run and fix the backend test suite](backend/06-run-test-suite.md)

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`)

## Notes

- Purely structural — no behavior change; every moved function/class keeps its name and signature.
- This issue is meant to land after its 6 sibling sub-issues (#1227–#1232, splitting the `game/{npcs,pcs}/detail/{documents,factions,items,possessions,treasures,photos}/` wrapper trees) — see issue Decision #4. As of plan-writing time (2026-08-21): #1227 (documents), #1229 (items), #1230 (possessions) are merged; #1228 (factions) and #1231 (treasures) are queued but not yet merged; #1232 (photos) is not yet planned. If this plan is implemented before all 6 land, re-verify Step 4's import fixes for whichever sibling(s) merge afterward against their new file locations — expect this branch to need a rebase against the later siblings' PRs either way.
- The granular `game/{documents,factions,items,photos,possessions,treasures}/` folders (holding e.g. `_faction_exchange.py`, `_document_summary.py`) already exist and are **not** moved by this issue — only imports pointing at the modules that *do* move need updating there. This is a scope clarification added to the issue during planning; the issue's original "Affected Files" section didn't mention these folders.
- The overall import-path transformation is mechanically uniform (see Steps 2–5 for the exact per-category rule) — a scripted grep/sed pass per moved-module name will be far less error-prone than editing ~150 import lines by hand. Verify with the grep command in Step 6 before considering the migration complete.
