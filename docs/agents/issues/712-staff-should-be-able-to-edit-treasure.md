# Issue: Staff should be able to edit treasure

## Description
Staff should be able to perform treasure exchange (acquire/sell) for both PCs and NPCs, the same way DMs, superusers, and (for PCs) the owning player already can. This follows the project's existing Staff-role principle: staff have admin-like powers over non-sensitive game content, but are deliberately excluded from anything that would expose secret/spoiler content or admin-and-owner-only information — since a staff account is also a regular player who could be in the same game.

## Problem
Investigation of the current codebase found:
- `PUT /games/:game_slug/pcs/:id/money.json` (and the NPC equivalent), gated by `CharacterMoneyEditPermission` (`backend/games/permissions.py`), already grants staff (globally), any player of the game (for PCs), and the standard superuser/DM/owner chain. The frontend's "Edit money" link already calls this endpoint and is already gated by `can_edit_money`, which already includes staff. **The "money update" portion of this issue is already fully implemented — no change needed.**
- `POST /games/:game_slug/pcs/:id/treasures/acquire.json` / `.../sell.json`, and the NPC equivalents, are still gated by the plain `CharacterEditPermission` (superuser, the game's DM(s), or — PCs only — the owning player). There is no staff bypass. The frontend's "Exchange Treasure" button (shared by `PcCharacterTreasures.jsx` and `NpcCharacterTreasures.jsx` via `CharacterTreasures.jsx`) is gated by the character's `can_edit` field, which reflects that same permission — so staff cannot see or use the button/modal for a character they don't own and aren't the DM of.
- The DM-only hidden-treasure variant (`treasures/acquire/all.json`, gated by `GameEditPermission` in addition to `CharacterEditPermission`) is unaffected by this issue — staff must NOT gain access to hidden/unreleased treasures through it, per the "no spoilers" principle above.

## Expected Behavior
- Staff members (Django `is_staff=True`) can see and use the "Exchange Treasure" button/modal on both a PC's and an NPC's treasures page (`/#/games/:game_slug/pcs/:id/treasures`, `/#/games/:game_slug/npcs/:id/treasures`), even when they are not the DM or (for PCs) the owning player.
- Staff can successfully call `POST /games/:game_slug/pcs/:id/treasures/acquire.json`, `.../sell.json`, and the NPC equivalents, for any character.
- Staff still cannot acquire hidden treasures via `treasures/acquire/all.json` — that stays DM/superuser-only, unchanged.
- No change is needed to the money-edit endpoints or UI — staff access there already works.

## Solution
- Add a staff bypass to the PC/NPC treasure acquire/sell authorization path only (not `acquire/all.json`), mirroring the existing `CharacterMoneyEditPermission` staff-bypass pattern in `backend/games/permissions.py` — but, per the clarified Staff principle, deliberately *without* the "any player of the game" leniency `CharacterMoneyEditPermission` grants for PCs; this stays a strict admin-like (superuser/DM/owner + staff) bypass for both PCs and NPCs.
- Expose a permission-aware field on the character detail serializer (mirroring `can_edit_money`) so the frontend can gate the "Exchange Treasure" button precisely, instead of reusing the unrelated `can_edit` field.
- Update `CharacterTreasures.jsx` (`buildExchangeCharacter`) to use that new field.
- Update `docs/agents/access-control/user-roles.md`, `common-rules.md`, and `character-treasure.md` to document the new carve-out, consistent with how `CharacterMoneyEdit`/`CharacterPhotoUpload` are already documented there.

## Benefits
Staff can help players exchange treasure for PCs and NPCs without needing DM intervention, consistent with the access already granted for money editing, while staying within the project's existing "staff = admin-like, minus spoilers" boundary.
