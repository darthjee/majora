# Plan: Character info bar and action bar

Issue: [456-character-info-bar-and-action-bar.md](../issues/456-character-info-bar-and-action-bar.md)

## Overview

Add a new, always-visible "info bar" overlay to the top of every character photo (show page and list-page cards, both PC and NPC), controlled by a new rules class that currently returns no content. The existing hover-triggered `ActionsOverlay`/`ActionBar` (upload + Slain/Revive buttons) is left behaviorally untouched — this issue only adds the new info bar alongside it. Entirely within the `frontend` agent's scope.

## Context

- `ActionsOverlay.jsx` (`frontend/assets/js/components/elements/ActionsOverlay.jsx:33-45`) renders `<div className="actions-overlay">` wrapping the photo and `ActionBar`. That div is already `position: relative`, and is used for NPC show/list photos and PC show-page photos (`CharacterHelper.jsx#renderPicture`, `CharacterCardHelper.jsx#renderPhoto`'s `npc` branch).
- PC cards on the list page (`CharacterCardHelper.jsx:161-163`) render a bare `<CardAvatar>` with no wrapping overlay at all — confirmed by `frontend/specs/assets/js/components/elements/CharacterCardSpec.js:35` ("renders a plain CardAvatar for PCs, with no overlay buttons").
- CSS for the hover bar lives in `frontend/assets/css/main.scss:38-84` (`.actions-overlay` + `.actions-overlay-button*`, all `opacity: 0` → `1` on `:hover`). No always-visible overlay class exists yet.
- `SlainSecondaryButtons.js` (`frontend/assets/js/components/elements/helpers/SlainSecondaryButtons.js`) is the existing precedent for a small static "rules" class that builds overlay content from a character object, leaving gating to the caller — the new info-bar rules class should follow the same shape.
- Per discussion on the issue: the action-button behavior differences between PC/NPC and show/list pages are intentionally left as-is — do **not** add `ActionsOverlay` to PC list cards, and do not touch `#buildSecondaryButtons` in either `CharacterHelper.jsx` or `CharacterCardHelper.jsx`. "Role of the user" continues to mean the existing precomputed `character.can_edit`/`is_player`/`is_pc` booleans — no new role concept (e.g. `AccessStore`'s `dm`/`player`/`owner`) is wired in for this issue.

## Implementation Steps

### Step 1 — Info bar rules class

Add `frontend/assets/js/components/elements/helpers/InfoBarRules.js`, a static class (JSDoc'd per lint rules) with a single entry point, e.g. `InfoBarRules.build(character)`, taking the full character object (so future rules can react to any of its fields, not just precomputed booleans) and returning the list of info items to display. For this issue, it always returns an empty array/no content for every combination of page (`character.is_pc`), character state, and role (`character.can_edit`/`is_player`) — the goal is only to establish the extension point.

### Step 2 — Info bar component

Add `frontend/assets/js/components/elements/InfoBar.jsx`, a presentational component (parallel to `ActionBar.jsx`) that renders the info items passed to it inside an always-visible, top-anchored, transparent, borderless bar (no hover/opacity transition, unlike the action buttons). Decide, consistent with `ActionBar`'s style, whether an empty item list renders an empty (invisible) bar or nothing at all — either is acceptable since there is no content yet, but keep it simple.

### Step 3 — CSS scaffold

In `frontend/assets/css/main.scss`, add a new always-visible bar class (e.g. `.info-overlay`) analogous to `.actions-overlay-button*` but anchored `top: 0` instead of `bottom`, with no `opacity`/`transition` rules (always visible) and no background/border (transparent). Reuse the existing `.actions-overlay` container (`position: relative`) where `InfoBar` sits alongside `ActionsOverlay`; for the PC list-card case (no `ActionsOverlay` involved), add a minimal `position: relative` wrapper class of its own (or reuse `.actions-overlay` purely for its positioning, at the implementer's discretion) so `InfoBar` has a positioning context around the bare `CardAvatar`.

### Step 4 — Wire into `ActionsOverlay`

Extend `ActionsOverlay.jsx` with a new optional prop (e.g. `infoBarItems`, default `[]`) and render `<InfoBar items={infoBarItems} />` inside its existing wrapping div, alongside `Photo` and `ActionBar`. This is purely additive — existing props (`canEdit`, `secondaryButtons`, etc.) and rendered action-button markup must stay exactly as they are today. Update `frontend/specs/assets/js/components/elements/ActionsOverlay/containerSpec.js` (and `photoTypeSpec.js` if affected) to cover the new prop without breaking existing assertions.

### Step 5 — Wire into show and list pages

- `CharacterHelper.jsx#renderPicture` (show page, `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx:125-143`): compute `InfoBarRules.build(character)` and pass it as `infoBarItems` to the existing `ActionsOverlay` call, for both PC and NPC.
- `CharacterCardHelper.jsx#renderPhoto` (list page, `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx:160-180`):
  - NPC branch: pass `InfoBarRules.build(character)` as `infoBarItems` to the existing `ActionsOverlay` call.
  - PC branch: wrap the existing bare `<CardAvatar>` in the new minimal positioning wrapper from Step 3 and render `<InfoBar items={InfoBarRules.build(character)} />` next to it — do **not** introduce `ActionsOverlay`/`ActionBar`/`canEdit` here.

### Step 6 — Tests

- Add a spec for `InfoBarRules` (mirrors `SlainSecondaryButtonsSpec.js` if one exists, else follows the existing helper spec conventions) asserting it currently returns no content for representative PC/NPC/role combinations.
- Add specs for `InfoBar.jsx` (new `frontend/specs/assets/js/components/elements/InfoBar/` folder) covering empty-content rendering and the always-visible (non-hover) CSS class, mirroring the structure of `ActionBar`'s specs (`secondaryButtonSpec.js`, `uploadButtonSpec.js`).
- Update `CharacterCardSpec.js` (PC branch) to assert the info-bar wrapper is now present even though no overlay buttons are rendered — keep the "no overlay buttons for PCs" assertion intact, just extend it to account for the new wrapper/`InfoBar`.
- Update `CharacterHelperSpec`/`CharacterCardHelperSpec` (wherever `#renderPicture`/`#renderPhoto` are covered) to assert `infoBarItems` is threaded through to `ActionsOverlay`.

### Step 7 — Verify

Run lint and the full Jasmine suite through the containerized toolchain (never invoke `yarn`/`npm` directly on the host).

## Files to Change

- `frontend/assets/js/components/elements/helpers/InfoBarRules.js` (new) — rules class deciding info-bar content; returns none for now.
- `frontend/assets/js/components/elements/InfoBar.jsx` (new) — presentational always-visible info bar.
- `frontend/assets/js/components/elements/ActionsOverlay.jsx` — add optional `infoBarItems` prop, render `InfoBar` alongside the existing photo/`ActionBar`.
- `frontend/assets/css/main.scss` — add the always-visible `.info-overlay` bar styling and any minimal positioning wrapper needed for the PC list-card case.
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — thread `InfoBarRules.build(character)` into `ActionsOverlay` on the show page.
- `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx` — thread `InfoBarRules.build(character)` into `ActionsOverlay` for NPC cards, and add the new wrapper + `InfoBar` for PC cards (no `ActionsOverlay`).
- `frontend/specs/assets/js/components/elements/InfoBar/**` (new) — component specs.
- `frontend/specs/assets/js/components/elements/helpers/InfoBarRulesSpec.js` (new, path illustrative) — rules class specs.
- `frontend/specs/assets/js/components/elements/ActionsOverlay/containerSpec.js` — cover the new prop.
- `frontend/specs/assets/js/components/elements/CharacterCardSpec.js` — update the PC "no overlay buttons" assertion to account for the new info-bar wrapper.
- Any existing spec covering `CharacterHelper#renderPicture` / `CharacterCardHelper#renderPhoto` — update to assert `infoBarItems` threading.

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

Run through the containerized toolchain (e.g. `docker-compose run frontend npm run lint` / `npm run coverage`), never `npm`/`yarn` directly on the host.

## Notes

- Entirely within the `frontend` agent's scope — no backend/infra/proxy/product/security review needed (no new endpoint, no access-rule change, purely a presentational addition using data already exposed to the frontend).
- Do not extend `ActionsOverlay`/action-button gating in this issue — that is explicitly deferred to a future issue per the discussion.
- The rules class (`InfoBarRules`) takes the whole character object rather than precomputed booleans specifically so future info items (beyond page/role) can react to any character field without changing its call signature.
