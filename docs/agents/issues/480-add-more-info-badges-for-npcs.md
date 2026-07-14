# Issue: Add more info badges for npcs

## Description
NPC show and index pages display a character photo with an overlay info bar (`frontend/assets/js/components/common/InfoBar.jsx`), driven by a `TooltipBadge` (`frontend/assets/js/components/common/TooltipBadge.jsx`) whose items are built in `frontend/assets/js/components/common/helpers/CharacterStatusBadges.js` and rendered inside the tooltip by `InfoBadgeList.jsx`. Today that bar surfaces allegiance. This issue adds two new badges, visible only to staff/editors, that flag when a character's real state has been deliberately misrepresented to players, plus a legibility fix for the existing tooltip text.

## Problem
Staff currently has no visual indicator on the NPC index/show pages showing that a character's real `allegiance` or `slain` state has been intentionally misrepresented to players (i.e. `public_allegiance`/`public_slain` differ from the real `allegiance`/`slain` values). Additionally, the existing tooltip renders neutral-variant text (e.g. neutral allegiance) with Bootstrap's default `text-muted` gray, which has poor contrast against the tooltip's dark background.

## Expected Behavior
- A new badge appears, staff/editor views only, when `allegiance` and `public_allegiance` differ (using the `bi-emoji-grimace` Bootstrap icon, in a yellow/orange warning color). It only shows when both `allegiance` and `public_allegiance` are present in the response — `public_allegiance`/`public_slain` are omitted for users without permission to see them, so this doubles as a permission check. On hover, its tooltip shows both allegiance values and the text "Players deceived" at the top.
- A new badge appears, staff/editor views only, when `slain` and `public_slain` differ (using the `bi-emoji-dizzy` Bootstrap icon, in the same yellow/orange warning color), under the same presence check. On hover, its tooltip shows both slain values (real and public) and the text "Players deceived" at the top.
- The existing info-bar tooltip's neutral/gray text switches to a near-white color for legibility, scoped only to this tooltip.

## Solution
- Extend `CharacterStatusBadges.js` with two new badge builders that only evaluate when `public_allegiance`/`public_slain` are present (not null/undefined — their absence signals the current user lacks permission to see them) and compare them against `allegiance`/`slain`, emitting a badge item when they differ.
- Add `bi-emoji-grimace` and `bi-emoji-dizzy` entries to `frontend/assets/js/utils/ui/Icons.js`, following the existing `bi-emoji-*` convention (plain, non-fill, matching the issue's wording).
- Use Bootstrap's built-in `warning` variant (`bg-warning`/`text-warning`) for the new badges' color, matching the existing use of `text-warning` in `ResilienceIndicatorHelper.jsx`, since the project has no custom orange/warning SCSS variable.
- Add "Players deceived" as a translated i18n string, following the project's existing translation-key conventions.
- Update `InfoBadgeList.jsx`'s neutral-variant fallback (currently `text-muted`) to a near-white class/color, scoped to this tooltip only.

## Benefits
Gives staff clear at-a-glance and on-hover visibility into intentional discrepancies between an NPC's true state and what is shown to players, improving GM tooling; also improves tooltip legibility for neutral-state entries.
