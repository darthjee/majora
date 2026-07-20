# Backend Plan: Staff should be able to edit treasure

Main plan: [plan.md](plan.md)

## Shared contracts

- Produce `can_exchange_treasure` (boolean) on `CharacterDetailSerializer`, returned by
  `GET /games/:game_slug/pcs/:id.json` and `GET /games/:game_slug/npcs/:id.json`. `true` for
  superuser, that game's DM, (PC only) the character's owning player, or any global Staff
  account. No "any player of the game" leniency (unlike `CharacterMoneyEditPermission`).
- `acquire/all.json` must remain untouched (still `GameEditPermission`-gated, no staff bypass) —
  do not add staff to `GameEditPermission` or to the `build_treasure_acquire_all_view` check.

## Implementation Steps

### Step 1 — Add `CharacterTreasureExchangePermission`

In `backend/games/permissions.py`, add a new permission class, placed near
`CharacterMoneyEditPermission` (around line 95-130):

```python
class CharacterTreasureExchangePermission(_EditPermission):
    """Encapsulate checks for the PC/NPC treasure acquire/sell endpoints (issue #712).

    Grants the same access as CharacterEditPermission (superuser, the character's owning
    player, or a GameMaster of the game) plus any Staff account (globally). Unlike
    CharacterMoneyEditPermission, deliberately has no "any player of the game" leniency —
    per the issue's clarified Staff principle (admin-like power, but no access to
    secret/hidden content), and the acquire/all.json hidden-treasure variant stays gated by
    GameEditPermission only, so Staff never gains access to hidden treasures through this.
    """

    @classmethod
    def check(cls, request, character):
        """Return an error Response if `request.user` may not exchange treasure for `character`."""
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, character))

    @classmethod
    def is_allowed(cls, user, character):
        """Return whether `user` may acquire/sell treasure on behalf of `character`."""
        if not user or not user.is_authenticated:
            return False
        if user.is_staff:
            return True
        return character.can_be_edited_by(user)
```

Follow the existing docstring conventions in this file (see `CharacterMoneyEditPermission` and
`CharacterPhotoUploadPermission` immediately above it for style/tone).

### Step 2 — Wire the new permission into the acquire/sell views

In `backend/games/views/game/_treasure_exchange.py`, `_authorize_and_parse` (around line 51-61)
currently calls `CharacterEditPermission.check(request, character)`. Change this call to
`CharacterTreasureExchangePermission.check(request, character)` (update the import at the top of
the file accordingly). This function is shared by both `character_treasure_acquire` and
`character_treasure_sell`, and by both the PC and NPC routes (`build_treasure_acquire_view`/
`build_treasure_sell_view` in `backend/games/views/game/_character_shared.py`), so this single
change covers all four non-hidden endpoints:
- `POST /games/:game_slug/pcs/:id/treasures/acquire.json`
- `POST /games/:game_slug/pcs/:id/treasures/sell.json`
- `POST /games/:game_slug/npcs/:id/treasures/acquire.json`
- `POST /games/:game_slug/npcs/:id/treasures/sell.json`

Do **not** change `build_treasure_acquire_all_view` (`_character_shared.py`, around line 204-217)
— it already gates on `GameEditPermission` (DM/superuser only, no staff bypass) *before* calling
`character_treasure_acquire(..., allow_hidden=True)`, so staff will correctly still get a 403 on
`acquire/all.json` without any further change, even though that call internally now goes through
the new permission class too.

### Step 3 — Expose `can_exchange_treasure` on the character detail serializer

In `backend/games/serializers/characters/character_detail.py`:
- Import `CharacterTreasureExchangePermission` alongside the existing
  `CharacterMoneyEditPermission` import (line 6).
- Add `'can_exchange_treasure'` to `Meta.fields` (near `'can_edit_money'`, line 42).
- Add a `get_can_exchange_treasure` method mirroring `get_can_edit_money` (lines 57-61):

```python
def get_can_exchange_treasure(self, obj):
    """Return whether the requesting user (from context) may exchange treasure for this character."""
    request = self.context.get('request')
    user = request.user if request else None
    return CharacterTreasureExchangePermission.is_allowed(user, obj)
```

### Step 4 — Tests

- `backend/games/tests/permissions_test.py` — add a test class for
  `CharacterTreasureExchangePermission`, mirroring the existing `CharacterMoneyEditPermission`
  test class in the same file: cover unauthenticated (401), staff-bypass (True regardless of
  ownership/DM status), superuser, DM, PC owner, a non-owning/non-DM authenticated player (should
  be `False`, unlike `CharacterMoneyEditPermission` which allows any player for PCs), and an NPC
  case (DM/superuser/staff only, no owner concept).
- `backend/games/tests/views/game/pcs/detail/treasures/game_pc_treasure_acquire_test.py` and
  `game_pc_treasure_sell_test.py` — add a case asserting a Staff user (not the owner, not the DM)
  can successfully acquire/sell.
- `backend/games/tests/views/game/npcs/detail/treasures/game_npc_treasure_acquire_test.py` and
  `game_npc_treasure_sell_test.py` — same, for NPCs.
- `backend/games/tests/views/game/pcs/detail/treasures/game_pc_treasure_acquire_all_test.py` (and
  the NPC equivalent) — add/confirm a case asserting a Staff user (not DM/superuser) still gets
  403 on the `/all.json` hidden-treasure variant.
- `backend/games/tests/serializers/characters/character_detail_test.py` — add coverage for
  `can_exchange_treasure`, mirroring the existing `can_edit_money` test cases (true for
  staff/superuser/DM/owner, false for an unrelated authenticated player on a PC that isn't
  theirs).

## Files to Change

- `backend/games/permissions.py` — add `CharacterTreasureExchangePermission`.
- `backend/games/views/game/_treasure_exchange.py` — swap `CharacterEditPermission` for the new
  permission class in `_authorize_and_parse`.
- `backend/games/serializers/characters/character_detail.py` — add `can_exchange_treasure`
  field + getter.
- `backend/games/tests/permissions_test.py` — new test class.
- `backend/games/tests/views/game/pcs/detail/treasures/game_pc_treasure_acquire_test.py`,
  `game_pc_treasure_sell_test.py`, `game_pc_treasure_acquire_all_test.py` — staff-access cases.
- `backend/games/tests/views/game/npcs/detail/treasures/game_npc_treasure_acquire_test.py`,
  `game_npc_treasure_sell_test.py`, `game_npc_treasure_acquire_all_test.py` — staff-access cases.
- `backend/games/tests/serializers/characters/character_detail_test.py` —
  `can_exchange_treasure` coverage.
- `docs/agents/access-control/user-roles.md` — add the new carve-out to the Staff row's list of
  documented exceptions (alongside PC photo upload, character money edit, poll/session-message
  view access).
- `docs/agents/access-control/common-rules.md` — add a `CharacterTreasureExchange` row to the
  named-permission-patterns table, next to `CharacterMoneyEdit`.
- `docs/agents/access-control/character-treasure.md` — update the "Treasure acquire/sell
  endpoints" table's "Who can call" column for the four non-`/all.json` rows from
  `CharacterEdit` to `CharacterTreasureExchange`, and note the staff carve-out inline (the
  `/all.json` rows and their surrounding prose stay as-is).

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/` (CI job: `pytest_views_characters`)
- `backend`: `poetry run pytest games/tests/ --ignore=games/tests/views/` (CI job: `pytest_all`,
  covers `permissions_test.py` and `character_detail_test.py`)

## Notes

- `character.can_be_edited_by(user)` already resolves correctly for both PCs (DM, superuser, or
  owning player) and NPCs (DM or superuser only, since NPCs have no `player` set) — no PC/NPC
  branching needed inside the new permission class itself, unlike `CharacterMoneyEditPermission`
  which needs an explicit `character.is_pc` check for its "any player" leniency.
- Confirm during implementation that `character.game` is already select-related/prefetched on the
  path into `_authorize_and_parse` (it was already required by the existing
  `CharacterEditPermission` check, so this should be a no-op change in query cost).
