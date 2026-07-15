# Plan: Neutral allegiance is not a lie

Issue: [532-neutral-alligeance-is-not-a-lie.md](../issues/532-neutral-alligeance-is-not-a-lie.md)

## Overview
Suppress the allegiance-deception badge (shown to admins/DMs in the PC/NPC list views when `allegiance` and `public_allegiance` differ) when either value is `neutral`, since a neutral allegiance isn't a claimed side that turns out false.

## Context
The badge is built by `CharacterDeceptionBadges.buildAllegianceDeception` (`frontend/assets/js/components/common/helpers/CharacterDeceptionBadges.js:28-41`), which delegates its show/hide decision to the private `#differs(realValue, publicValue)` helper (lines 67-77). That helper is shared with `buildSlainDeception`, so the new `neutral` exclusion must live in `buildAllegianceDeception` itself, not in `#differs`.

The badge is consumed through a single shared chain (`InfoBarRules` -> `CharacterCardHelper`/`CharacterHelper`) reused by all three views mentioned in the issue (`/#/games/:game_slug/pcs`, `/#/games/:game_slug/npcs`, and the game-show short list), so no per-view changes are needed — this is a one-file fix.

## Implementation Steps

### Step 1 — Add the neutral exclusion
In `CharacterDeceptionBadges.buildAllegianceDeception`, after the existing `#differs` check, also return `null` when `character.allegiance === 'neutral'` or `character.public_allegiance === 'neutral'`. Update the method's JSDoc to mention the new condition.

### Step 2 — Add tests
In `frontend/specs/assets/js/components/common/helpers/CharacterDeceptionBadgesSpec.js`, under `.buildAllegianceDeception`, add cases:
- returns `null` when `allegiance` is `'neutral'` and `public_allegiance` differs (e.g. `'ally'`)
- returns `null` when `public_allegiance` is `'neutral'` and `allegiance` differs (e.g. `'enemy'`)
- returns `null` when both `allegiance` and `public_allegiance` are `'neutral'` (already covered by the equality case, but add explicitly for clarity if not redundant)
- still builds the badge for a non-neutral differing pair (existing coverage, verify it isn't broken)

Do not add neutral-related cases to `.buildSlainDeception` — that concept doesn't apply there.

## Files to Change
- `frontend/assets/js/components/common/helpers/CharacterDeceptionBadges.js` — add the neutral exclusion to `buildAllegianceDeception`.
- `frontend/specs/assets/js/components/common/helpers/CharacterDeceptionBadgesSpec.js` — add coverage for the new exclusion.

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes
- No backend or API changes are involved; `allegiance`/`public_allegiance` values and the `'neutral'` literal already exist across the codebase (e.g. `CharacterStatusBadges.ALLEGIANCE_VARIANTS`, `AllegianceBorder`, `NpcFiltersHelper`).
- The refactor originally requested in the issue was found to already be in place (centralized in `CharacterDeceptionBadges` -> `InfoBarRules` -> `CharacterCardHelper`/`CharacterHelper`, per issue #480), so it was dropped from scope during discussion.
