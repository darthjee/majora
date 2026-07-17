# Broaden PC money-edit access to any player in the game

## Context

Issue #615 ("Staff Can Edit Pc Money") added a quick "Edit money" link on the PC/NPC
show pages, backed by new `PUT /games/:game_slug/pcs/:id/money` and
`PUT /games/:game_slug/npcs/:id/money` endpoints, gated by
`backend/games/permissions.py::CharacterMoneyEditPermission`. It was implemented and
merged via PR #624 (commit 98b89d5).

`CharacterMoneyEditPermission.is_allowed` currently grants access to: superusers, the
character's owning player, and any GameMaster of the game (all via
`character.can_be_edited_by(user)`), plus any Staff account (`user.is_staff`, checked
globally) — deliberately with **no** "any player of the game" leniency, per the class's
own docstring and the note added to `docs/agents/product.md` in that same PR.

The product owner has since clarified that, for **PCs specifically**, any player of the
game (not just the PC's own owning player) should be able to edit that PC's money —
mirroring the leniency `CharacterPhotoUploadPermission` already grants for PC photo
uploads (issue #619):

```python
is_player_of_game = character.game.players.filter(user=user).exists()
return user.is_staff or is_player_of_game or character.can_be_edited_by(user)
```

This change must stay **PC-only**. NPCs must NOT gain an "any player of the game" grant
for money editing — NPCs have no owner concept, and money-edit access for NPCs must
remain admin/dm/staff-only, with no player leniency at all. Because
`CharacterMoneyEditPermission` is shared by both the PC and NPC money endpoints (unlike
`CharacterPhotoUploadPermission`, which is PC-only simply by virtue of only being wired
to the PC photo endpoint), the PC-only condition needs to be an explicit check in the
code (e.g. `character.is_pc`), not something implied by routing.

Also relevant: `CharacterDetailSerializer.get_can_edit_money`
(`backend/games/serializers/characters/character_detail.py`) calls
`CharacterMoneyEditPermission.is_allowed(user, obj)` directly, with a `request.user`
that may be `None` or `AnonymousUser`. Any fix must remain safe for that case — the
current code guards this via `bool(user and user.is_staff) or
character.can_be_edited_by(user)`, where `can_be_edited_by` itself null/anonymous-guards.
The new "any player of the game" branch must preserve this same safety.

## What needs to be done

- **Backend**: Update `CharacterMoneyEditPermission.is_allowed` in
  `backend/games/permissions.py` so that, when `character.is_pc` is true, any player of
  `character.game` (i.e. `character.game.players.filter(user=user).exists()`) is also
  granted access — in addition to the existing superuser/owner/DM/staff grants. NPCs
  must continue to follow the current, narrower rule (admin/dm/staff-only, no
  any-player leniency). Keep the anonymous/`None`-user safety that
  `CharacterDetailSerializer.get_can_edit_money` depends on.
- **Backend tests**: Update `backend/games/tests/permissions_test.py` to cover the new
  behavior — any player of the game can edit a PC's money; a player of the game who is
  not the owner still cannot edit an NPC's money; existing superuser/owner/DM/staff
  cases continue to pass for both PCs and NPCs.
- **Docs**: Correct `docs/agents/product.md` and
  `docs/agents/access-control/user-roles.md` (both updated by PR #624 to document the
  original, narrower owner-only rule) to reflect the new PC rule: any player of the
  game may edit a PC's money, while NPC money editing remains admin/dm/staff-only.

## Acceptance criteria

- [ ] `CharacterMoneyEditPermission.is_allowed` grants money-edit access on a **PC** to
      any player of that PC's game, in addition to the existing superuser/owner/DM/staff
      grants.
- [ ] `CharacterMoneyEditPermission.is_allowed` does **not** grant this "any player of
      the game" leniency for **NPCs** — NPC money-edit access remains
      admin/dm/staff-only, exactly as before.
- [ ] `CharacterDetailSerializer.get_can_edit_money` continues to work safely when
      `request.user` is `None` or `AnonymousUser`.
- [ ] `backend/games/tests/permissions_test.py` covers: a non-owner player of the game
      editing a PC's money (allowed), a non-owner player of the game editing an NPC's
      money (still forbidden), and the pre-existing superuser/owner/DM/staff cases for
      both PCs and NPCs.
- [ ] `docs/agents/product.md` and `docs/agents/access-control/user-roles.md` are
      updated to document the corrected PC-only "any player of the game" rule for money
      editing.

## Prior context

- Issue #615 — introduced the money-edit endpoints and `CharacterMoneyEditPermission`.
- PR #624 (commit 98b89d5) — implemented issue #615, including the owner-only rule and
  its documentation, which this issue corrects for PCs.
