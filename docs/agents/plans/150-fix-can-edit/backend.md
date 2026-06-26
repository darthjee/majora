# Backend Plan: Fix Can Edit

Main plan: [plan.md](plan.md)

## Shared contracts

None — this agent adds tests only. No API or model change is made.

## Implementation Steps

### Step 1 — Add regression test: DM who is also the PC owner

In `source/games/tests/views/characters_test.py`, inside `TestGamePcAccessView`, add a test method:

```python
def test_dm_who_is_also_owner_returns_can_edit_true(self, client):
    """Test that a user who is both DM and character owner returns can_edit true."""
    self.dm_user.player_set  # the dm_user gets a Player linked to the character
    dm_player = Player.objects.create(name='DM Player')
    dm_player.user = self.dm_user
    dm_player.save()
    self.character.player = dm_player
    self.character.save()
    token = Token.objects.create(user=self.dm_user)
    response = self._get(client, token=token)
    assert response.status_code == 200
    data = json.loads(response.content)
    assert data['can_edit'] is True
```

The current setup creates `self.dm_user` with a `GameMaster` record. This test additionally links the same user to the character's player, so the user is simultaneously DM and character owner — verifying that the OR logic in `can_be_edited_by` still returns `True`.

### Step 2 — Add regression test: DM who is also the NPC game's PC owner

In `TestGameNpcAccessView`, add a test method verifying that a user who is both DM and PC player owner can still edit NPCs (i.e. DM access holds):

```python
def test_dm_who_is_also_pc_owner_returns_can_edit_true(self, client):
    """Test that a user who is DM and also owns a PC in the game returns can_edit true for NPC."""
    self.dm_user.player_set  # ensure dm_user has a Player
    dm_player = Player.objects.create(name='DM Player')
    dm_player.user = self.dm_user
    dm_player.save()
    Character.objects.create(name='DM PC', game=self.game, player=dm_player, npc=False)
    token = Token.objects.create(user=self.dm_user)
    response = self._get(client, token=token)
    assert response.status_code == 200
    data = json.loads(response.content)
    assert data['can_edit'] is True
```

## Files to Change

- `source/games/tests/views/characters_test.py` — add two new test methods in `TestGamePcAccessView` and `TestGameNpcAccessView`

## CI Checks

- `source/`: `docker-compose run majora_backend poetry run pytest source/games/tests/views/characters_test.py` (CI job: `pytest`)

## Notes

- No production code changes are required. The `can_be_edited_by` logic in `source/games/models/character.py` already handles the combined DM+owner case via the OR in the `editors` property; the test just documents and guards that behaviour.
- The existing setup in `TestGamePcAccessView.setup_method` already creates a separate `self.owner` and `self.dm_user`; the new test needs to make `self.dm_user` also the character's player.
