# Plan: Recipes spec (3/3): frontend design and placement

Issue: [1444-recipes-spec-3-3-frontend-design-and-placement.md](../../issues/1444-recipes-spec-3-3-frontend-design-and-placement.md)

## Overview
Write `docs/agents/specs/recipes/frontend.md`, the third and last recipes spec page, and link it
from `docs/agents/specs/recipes.md`. The page records the placement decision and specifies every
game/character recipe page, shortlist, exchange modal, resolver wiring and i18n file against the
#1443 API contract, so #1449 and #1450 can implement without re-deciding anything. Docs only.

## Context
- Domain pages (#1442) and `recipes/api-contract.md` (#1443) are merged; the index still lists
  "Frontend (`recipes/frontend.md`) — pending, added by #1444".
- Placement is decided in the issue: a new "Recipes" entry in the header "Game" dropdown
  (`IS_GAME_PAGE`, like Common Items), and for PCs/NPCs a shortlist section on the show page plus
  a full list page with a "Recipes" entry in the PC/NPC dropdowns (like Documents/Items).
- No uploads of any kind on recipes; thumbnails come from `output.photo_path`, falling back to
  the "unknown" placeholder when `output` is `null`.
- The architect owns the spec page; the **frontend** agent provides input on existing patterns.
  No specialist writes code in this issue.

## Steps

- [01 — Gather frontend input](plan/01-gather-frontend-input.md)
- [02 — Write the frontend spec page](plan/02-write-frontend-spec.md)
- [03 — Link from the spec index](plan/03-link-from-index.md)
- [04 — Cross-check against the contract](plan/04-cross-check.md)

## Notes
- Must not re-decide domain rules or the API contract; if a gap is found, record it in
  `frontend.md` as a frontend-only decision, or correct the contract page in the same change
  only when it is clearly an omission (e.g. a missing permission flag).
- No Navi, backend or `access-control/` changes — #1448 and #1451 own those.
- No CI job exercises these docs beyond general markdown checks; there is no code to test.
