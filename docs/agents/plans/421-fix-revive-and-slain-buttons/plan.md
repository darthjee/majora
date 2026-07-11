# Plan: Fix revive and slain buttons

Issue: [421-fix-revive-and-slain-buttons.md](../../issues/421-fix-revive-and-slain-buttons.md)

## Overview
The real/public revive-slain buttons on the NPC show page render based on incomplete character state: the DM-only ("full") response is fetched but only its `private_description` field is merged back into page state, so `slain` and `public_slain` end up coming from the public serializer instead (which aliases `slain` to `public_slain` and omits `public_slain` entirely). This plan fixes the merge to apply the full response generically, and adds regression coverage for both the show page and the list page.

## Context
- Confirmed root cause (show page): `frontend/assets/js/components/pages/controllers/CharacterController.js` — `loadCharacter()` fetches the base character via the public `CharacterDetailSerializer` (`slain` aliased to `public_slain`, no `public_slain` field), then, when `can_edit` is true, fetches `CharacterFullSerializer` data (correct `slain` + `public_slain`) via `fetchCharacterFull`/`loadFullCharacter`. `handleFullResponse()` → `mergePrivateDescription()` only copies `private_description` out of that full response, discarding every other field the full serializer adds (`slain`, `public_slain`, `allegiance`, `public_allegiance`).
- The list page (`frontend/assets/js/components/pages/controllers/GameNpcsController.js`) replaces the whole NPC array with the full DM data wholesale when available (`#applyAuthNpcs`), rather than partially merging fields — this pattern was not found to reproduce the same bug on inspection. Since the reported symptom covers both pages, add explicit regression coverage there too and fix anything an actual toggle-and-rerender exercises turn up.
- Scope is frontend-only: the backend serializers (`CharacterDetailSerializer`, `CharacterFullSerializer`, `CharacterListSerializer`, `CharacterFullListSerializer`) already return correct data; translation keys/text are correct and out of scope (per the issue).

## Implementation Steps

### Step 1 — Generalize the full-response merge on the show page
In `frontend/assets/js/components/pages/controllers/CharacterController.js`, replace the narrow `mergePrivateDescription` (which only copies `private_description`) with a merge that applies every field from the full response onto the character state (`{ ...character, ...full }`), so `slain`, `public_slain`, `allegiance`, `public_allegiance`, and `private_description` all come from the authoritative full response when it's available. Rename the method to reflect the broader behavior (e.g. `mergeFullCharacter`) and update `handleFullResponse` accordingly. Update the JSDoc.

### Step 2 — Verify the list page against a live toggle cycle
Using the `frontend` dev server, load the NPC list page as a user with edit access, and confirm: initial load shows the correct button per `slain`/`public_slain` for a few NPCs in different states; toggling either button (confirming the modal) updates that NPC's card to show the opposite button immediately after refresh, without affecting the other pair. If a discrepancy is found here (e.g. a stale card before the list refetch resolves, or the `X-Skip-Cache` full fetch not consistently winning the race in `#applyNpcsResult`), fix it in `GameNpcsController.js`/`GameNpcs.jsx` following the same "always fully apply the authoritative field set" principle as Step 1. Do the same live check on the NPC show page to confirm Step 1's fix.

### Step 3 — Regression tests
- Extend `frontend/specs/assets/js/components/pages/controllers/CharacterControllerSpec.js` (or equivalent) to cover: full-response fetch merging `slain`/`public_slain`/`allegiance`/`public_allegiance` into character state, not just `private_description`; and the existing `can_edit: false` / full-fetch-failure fallback paths still leaving `character` untouched beyond what the base fetch provided.
- Extend `frontend/specs/assets/js/components/pages/helpers/CharacterHelperSlainSpec.js` and `frontend/specs/assets/js/components/elements/helpers/CharacterCardHelperSpec.js` if needed so the icon/label assertions there are driven by a character object shaped like what `CharacterController`/`GameNpcsController` now actually produce (i.e. real `slain` + `public_slain`, not stand-in fixtures that always happened to look correct).
- If Step 2 uncovers a list-page-specific bug, add a matching spec under `frontend/specs/assets/js/components/pages/controllers/GameNpcsControllerSpec.js`.

## Files to Change
- `frontend/assets/js/components/pages/controllers/CharacterController.js` — generalize `mergePrivateDescription` into a full-response merge (Step 1).
- `frontend/specs/assets/js/components/pages/controllers/CharacterControllerSpec.js` — new/updated specs for the merge behavior (Step 3).
- `frontend/assets/js/components/pages/controllers/GameNpcsController.js` and/or `frontend/assets/js/components/pages/GameNpcs.jsx` — only if Step 2's live check finds a real list-page bug.
- `frontend/specs/assets/js/components/pages/controllers/GameNpcsControllerSpec.js` — only if the above applies.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- Do not touch `frontend/assets/i18n/*.yaml` or any backend serializer/view — both are already correct and explicitly out of scope per the issue.
- `CharacterHelper.jsx`'s and `CharacterCardHelper.jsx`'s `#buildSecondaryButtons` icon/label logic already exactly matches the spec in the issue (verified during discussion) — no changes expected there; the bug is entirely in what character data reaches them.
- Step 2 is exploratory: if the live check finds no list-page bug, skip the corresponding file changes in Step 3's last bullet and note in the PR description that the list page was verified correct as-is.
