# Plan: Organize Python code

Issue: [470-organize-python-code.md](../issues/470-organize-python-code.md)

## Overview

Pure reorganization of `backend/games` — no behavior change. Split the monolithic
`urls.py` into a hub plus per-resource modules, migrate `views/characters/` to the
`game/pcs/` + `game/npcs/` shape already documented in
[`docs/agents/views-organization.md`](../views-organization.md) (this is the slice
issue #348 called "the folder that motivated the convention"), and apply an equivalent
folder-per-resource structure to `serializers/` and `models/`, documenting that new
convention alongside the existing views one. CircleCI hardcodes a test path
(`games/tests/views/characters/`) that must be updated in lockstep with the views move.

## Agents involved

- [backend](backend.md)
- [infra](infra.md)

## Shared contracts

The **only** cross-boundary contract is a file path infra's CI config depends on
backend producing:

- Today, `.circleci/config.yml`'s `pytest_views_characters` job runs
  `pytest games/tests/views/characters/` and `pytest_views_rest` runs
  `pytest games/tests/views/ --ignore=games/tests/views/characters/`.
- Backend must move `backend/games/tests/views/characters/*` into
  `backend/games/tests/views/game/pcs/` and `backend/games/tests/views/game/npcs/`
  (mirroring the production view tree, one test file per view file, per
  views-organization.md rule 6), so that **all** character/PC/NPC tests end up under
  `backend/games/tests/views/game/`.
- Infra must then change both job commands to target/ignore
  `games/tests/views/game/` instead of `games/tests/views/characters/`.
- No other endpoint, payload, field name, or type changes hands between the two agents
  — this is filesystem-path-only.

Dispatch order: backend's views move and infra's CI update touch different files and can
happen in parallel, but the PR should only merge once both land together (an
intermediate state with mismatched paths would break CI).
