"""Tests for the player-facing NPC slain-toggle PATCH on the plain NPC detail endpoint.

`PATCH /games/<game_slug>/npcs/<id>.json` was restored to accept a narrow
`{"slain": true|false}` payload (issue #416), on top of the post-#428 GET-only shape,
allowed for any player of the game (per the same computation backing `is_player`) or an
existing `CharacterEditPermission` editor (GM/superuser). See
`docs/agents/security-guidelines.md` section 8 for why the "ignores non-editable fields"
test must stay.
"""

import pytest
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    GameMasterFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)
from games.tests.views.support import assert_json_response


@pytest.mark.django_db
class TestGameNpcSlainUpdateView(TokenAuthRequestMixin):
    """Tests for the narrow player-facing PATCH on `/games/<game_slug>/npcs/<id>.json`."""

    def setup_method(self):
        """Set up a game, a DM, a player linked to the game, and an NPC."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.player_user = UserFactory(username='player_user', password='secret-password')
        self.player = PlayerFactory(name='Bob', user=self.player_user)
        self.player.games.add(self.game)
        self.npc = CharacterFactory(name='Gandalf', game=self.game, npc=True)

    def _url(self, character=None):
        """Return the plain NPC detail URL for the given character (defaults to the fixture)."""
        character = character or self.npc
        return f'/games/test-game/npcs/{character.id}.json'

    def _patch(self, client, payload, token=None, character=None):
        """Issue a PATCH request to the plain NPC detail endpoint."""
        return self.patch(client, self._url(character=character), payload, token=token)

    def test_patch_without_token_returns_401(self, client):
        """Test that PATCH without a token is rejected with 401."""
        response = self._patch(client, {'slain': True})
        assert response.status_code == 401

    def test_patch_by_player_of_game_returns_200(self, client):
        """Test that a player of the game (via Player.games) can toggle slain."""
        token = Token.objects.create(user=self.player_user)

        response = self._patch(client, {'slain': True}, token=token)

        assert_json_response(response, 200, slain=True)
        self.npc.refresh_from_db()
        assert self.npc.public_slain is True

    def test_patch_by_dm_returns_200(self, client):
        """Test that a GameMaster of the game can also use this endpoint."""
        token = Token.objects.create(user=self.dm_user)

        response = self._patch(client, {'slain': True}, token=token)

        assert_json_response(response, 200, slain=True)

    def test_patch_by_superuser_returns_200(self, client):
        """Test that a superuser can also use this endpoint."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = self._patch(client, {'slain': True}, token=token)

        assert_json_response(response, 200, slain=True)

    def test_patch_by_unrelated_user_returns_403(self, client):
        """Test that an authenticated user who is neither a player nor an editor gets 403."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)

        response = self._patch(client, {'slain': True}, token=token)

        assert response.status_code == 403
        self.npc.refresh_from_db()
        assert self.npc.public_slain is False

    def test_patch_sets_public_slain_and_leaves_real_slain_untouched(self, client):
        """Test that {"slain": true} sets public_slain but not the real slain field."""
        token = Token.objects.create(user=self.player_user)

        response = self._patch(client, {'slain': True}, token=token)

        assert response.status_code == 200
        self.npc.refresh_from_db()
        assert self.npc.public_slain is True
        assert self.npc.slain is False

    def test_patch_sets_public_slain_back_to_false(self, client):
        """Test that {"slain": false} reverts a slain NPC's public_slain to False."""
        self.npc.public_slain = True
        self.npc.save()
        token = Token.objects.create(user=self.player_user)

        response = self._patch(client, {'slain': False}, token=token)

        assert_json_response(response, 200, slain=False)
        self.npc.refresh_from_db()
        assert self.npc.public_slain is False

    def test_patch_ignores_non_editable_fields(self, client):
        """Test that fields outside `slain` are silently ignored.

        This is the view-level regression test required for update serializers by
        `docs/agents/security-guidelines.md` section 8.
        """
        token = Token.objects.create(user=self.player_user)

        response = self._patch(
            client,
            {
                'slain': True,
                'name': 'Saruman',
                'money': 999,
                'public_allegiance': 'enemy',
            },
            token=token,
        )

        assert response.status_code == 200
        self.npc.refresh_from_db()
        assert self.npc.public_slain is True
        assert self.npc.name == 'Gandalf'
        assert self.npc.money == 0
        assert self.npc.public_allegiance == 'neutral'

    def test_patch_response_matches_get_detail_shape(self, client):
        """Test that the PATCH response has the same shape as the GET detail response."""
        token = Token.objects.create(user=self.player_user)

        get_response = self.get(client, self._url())
        patch_response = self._patch(client, {'slain': True}, token=token)

        get_data = assert_json_response(get_response, 200)
        patch_data = assert_json_response(patch_response, 200)
        assert set(patch_data.keys()) == set(get_data.keys())

    def test_patch_response_includes_x_skip_cache_header(self, client):
        """Test that the PATCH response includes the X-Skip-Cache: true header."""
        token = Token.objects.create(user=self.player_user)
        response = self._patch(client, {'slain': True}, token=token)
        assert response['X-Skip-Cache'] == 'true'

    def test_patch_on_pc_id_returns_404(self, client):
        """Test that this NPC-only endpoint returns 404 for a PC id."""
        pc = CharacterFactory(name='Aragorn', game=self.game, npc=False)
        token = Token.objects.create(user=self.player_user)

        response = self._patch(client, {'slain': True}, token=token, character=pc)

        assert response.status_code == 404


@pytest.mark.django_db
class TestGameNpcSlainUpdateHiddenGate(TokenAuthRequestMixin):
    """Tests for the hidden-NPC gate on the player-facing slain-toggle PATCH."""

    def setup_method(self):
        """Set up a game, a DM, a player linked to the game, and a hidden NPC."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.player_user = UserFactory(username='player_user', password='secret-password')
        self.player = PlayerFactory(name='Bob', user=self.player_user)
        self.player.games.add(self.game)
        self.hidden_npc = CharacterFactory(
            name='Secret NPC', game=self.game, npc=True, hidden=True
        )

    def _url(self):
        """Return the plain NPC detail URL for the hidden NPC fixture."""
        return f'/games/test-game/npcs/{self.hidden_npc.id}.json'

    def test_patch_hidden_npc_by_player_returns_404(self, client):
        """Test that a player of the game (not an editor) gets 404 for a hidden NPC."""
        token = Token.objects.create(user=self.player_user)

        response = self.patch(client, self._url(), {'slain': True}, token=token)

        assert response.status_code == 404

    def test_patch_hidden_npc_by_dm_returns_200(self, client):
        """Test that a DM can still PATCH a hidden NPC's slain state."""
        token = Token.objects.create(user=self.dm_user)

        response = self.patch(client, self._url(), {'slain': True}, token=token)

        assert response.status_code == 200
