# Frontend Plan: Improve docs token usage

Main plan: [plan.md](plan.md)

## Shared contracts

None — independent of the backend track.

## Implementation Steps

### Step 1 — Audit inline mock objects in specs

`frontend/specs/support/factories.js` already centralizes `buildGame`,
`buildCharacter`, and `buildLink`, and 73 spec files already use them.
However, roughly 120 spec files still build game-like mock objects inline
(literal `{ game_slug: '...', ... }`) instead of calling `buildGame`, and 43
build character-like objects with inline `is_pc: true/false` instead of
`buildCharacter`. Audit these inline objects and identify the recurring
shapes.

### Step 2 — Extend and adopt the shared factories

Where an inline shape matches (or nearly matches) an existing factory,
replace it with a call to `buildGame`/`buildCharacter`/`buildLink` plus
overrides. Where a recurring shape isn't covered yet (e.g. treasure, poll, or
session mocks), add a new `buildX` function to `factories.js` following the
existing pattern (plain object, `overrides` param, spread last) and adopt it
at the call sites. Keep `factories.js` a single file — unlike the backend's
`factories.py`, it's small (53 lines) and doesn't need a package split; only
its coverage needs to grow.

## Files to Change

- `frontend/specs/support/factories.js` — add any missing `buildX` factory
  functions
- `frontend/specs/**/*Spec.js` — replace inline mock objects with the shared
  factories where they match

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job:
  `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job:
  `frontend-checks`)

## Notes

- Don't force-fit every inline object onto a shared factory — only
  consolidate shapes that are genuinely repeated; a one-off mock with unusual
  fields is fine left inline.
