# Issue: Character info bar and action bar

## Description
Character photos on the show/list pages have a hover-triggered `ActionsOverlay` component (`frontend/assets/js/components/elements/ActionsOverlay.jsx`) for action buttons (upload photo, and for NPCs, secondary buttons like Slain/Revive). Current action-button behavior — including its differences between PC/NPC and show/list pages — is fine as-is for now; more buttons will be added to it later, but that is a separate, future change.

There is currently no component for showing non-interactive, informational content over a character photo, on any page.

## Problem
There is no mechanism to show informational (non-interactive) content over a character photo, which is needed for future features.

## Expected Behavior
- A new, always-visible (not hover-triggered) overlay bar appears at the top of the character photo, on both the show page and the list page, for both PC and NPC — transparent, borderless.
- The bar is dedicated to showing character information; for now it shows nothing, but is built to support future informational content.
- The content shown is controlled by a rules class that takes into account the page (PC vs NPC), the full character object (not just precomputed booleans, since more character-state-driven rules are expected later), and the role of the current user (via the existing `can_edit`/`is_player`/`is_pc` booleans) — for now, always returning no content.

## Solution
- Add a new overlay component (an "info bar") styled similarly to `.actions-overlay` (`main.scss`) but always visible/top-anchored, transparent, borderless, and without the hover-based opacity transition.
- Render it alongside the existing photo/`ActionsOverlay` in both `CharacterHelper.jsx` (show page) and `CharacterCardHelper.jsx` (list page), for both PC and NPC.
- Add a rules class that decides what information to show, given the character object, page type, and existing user-role booleans — returning no content for now.

## Benefits
- Lays the groundwork for showing character info directly on photos without further structural changes once informational content is defined later.
- Keeps existing action-button behavior untouched, avoiding unnecessary rework ahead of future button additions.
