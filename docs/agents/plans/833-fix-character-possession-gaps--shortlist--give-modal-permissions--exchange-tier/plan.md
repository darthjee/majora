# Plan: Fix character possession gaps: shortlist, give-modal permissions, exchange tier

Issue: [833_fix-character-possession-gaps--shortlist--give-modal-permissions--exchange-tier.md](../../issues/833-fix-character-possession-gaps--shortlist--give-modal-permissions--exchange-tier.md)

## Overview

Three independent, previously-identified gaps left over from `CharacterPossession` (#1076/PR #1102):

1. Add the missing possession shortlist to the PC/NPC show pages (frontend + a couple of new translation keys).
2. Fix `GiveDocumentModal`/`GiveItemModal`/`GiveTreasureModal`'s `canGiveHidden` prop, which is currently derived from the resource's `regular.edit`/`can_edit` permission (staff+player) instead of the actual admin/dm/staff-only restricted-tier permission — causing live 403s for staff/player on the give-document modal. Fixable entirely on the frontend: all three controllers already fetch `AccessStore.ensureGameAccess(gameSlug)` for `canUploadPhoto`, which already exposes `is_superuser`/`is_dm`/`is_staff`/`is_player` — `canGiveHidden` should be derived from that same already-fetched `access` object (`is_superuser || is_dm || is_staff`, dropping `is_player`), not from `can_edit`. No new backend endpoint needed.
3. Make `_possession_exchange.py`'s acquire/remove permission vary `regular`/`restricted` by endpoint variant, mirroring `_document_exchange.py`, instead of being unconditionally `restricted` — so players can self-serve acquiring/removing their own possessions on the plain endpoint, matching what the issue originally asked for.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)
- [backend](backend.md)

## Shared contracts

None. The three fixes are fully independent and touch no shared API surface:

- **#1** and **#2** are frontend-only — both reuse existing endpoints/data (`pc-possessions`/`npc-possessions` collection endpoints already exist from #1076; `AccessStore.ensureGameAccess` is already fetched by all three controllers). Translator's work for #1 (two small translation additions) has no runtime dependency on the frontend agent's component work — either can land first.
- **#3** is backend-only. The frontend already selects the `regular`/`private` acquire/remove variant correctly for possessions (`AcquirePossessionTabController.js`/`RemovePossessionTabController.js` already pick `'private'` vs `'regular'` off an existing `canEdit`-style flag) — only the backend's permission check needs to start honoring that variant instead of ignoring it. No frontend change required for #3.
