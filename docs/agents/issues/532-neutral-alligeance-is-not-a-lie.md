# Issue: Neutral allegiance is not a lie

## Description
In the character list views:

- `/#/games/:game_slug/pcs`
- `/#/games/:game_slug/npcs`
- `/#/games/:game_slug` (PCs and NPCs short list)

the info bar shows a "deception" badge when a character's public allegiance diverges from their real allegiance, visible only to admins/DMs.

The badge is currently built by `CharacterDeceptionBadges.buildAllegianceDeception` (`frontend/assets/js/components/common/helpers/CharacterDeceptionBadges.js`), consumed through `InfoBarRules` -> `CharacterCardHelper`/`CharacterHelper`, and shown when all of:

- the viewer is admin or DM
- `allegiance` and `public_allegiance` differ
- `public_allegiance` is not null

## Problem
Neutral allegiance is currently treated the same as any other mismatch. If a character's real or public allegiance is `neutral`, the badge still shows whenever the two values differ, even though presenting (or being) neutral does not actually deceive players — neutrality isn't a claimed side that turns out false.

## Expected Behavior
The allegiance-deception badge should not show when either `allegiance` or `public_allegiance` is `neutral`, in addition to the existing criteria (viewer is admin/DM, values differ, `public_allegiance` is not null).

## Solution
Extend the allegiance-deception check in `CharacterDeceptionBadges.buildAllegianceDeception` so the badge is also suppressed when `allegiance === 'neutral'` or `public_allegiance === 'neutral'`. This check is specific to allegiance and should not affect the shared `#differs` helper used by `buildSlainDeception`.

## Benefits
Avoids showing a misleading "players deceived" badge for characters whose allegiance is genuinely (or publicly) neutral, keeping the badge meaningful for actual deception.
