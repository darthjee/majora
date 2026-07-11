"""Tests for the PC/NPC detail view (GET detail / hidden-NPC gate).

Field-level serialization (every field, every can_edit permutation) is covered by
`games/tests/serializers/test_character_detail.py`. This module only owns what those
serializer tests cannot: routing, status codes, the request/token permission pipeline,
and view-specific response shape (e.g. headers). PATCH-endpoint tests moved to
`game_character_full_test.py` (issue #428), since the update action now lives on
`full.json`; see `docs/agents/security-guidelines.md` section 8 for why
`test_patch_ignores_non_editable_fields` must stay (now over there).
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


class _BaseCharacterDetailViewTest(TokenAuthRequestMixin):
    """Shared GET behavior for the PC and NPC detail endpoints."""

    npc = None
    segment = None
    character_name = None
    character_role = None
    character_description = None

    def setup_method(self):
        """Set up a game, a player, and a character (NPC or PC)."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.player = PlayerFactory(name='Bob')
        self.character = CharacterFactory(
            name=self.character_name,
            game=self.game,
            player=None if self.npc else self.player,
            role=self.character_role,
            public_description=self.character_description,
            npc=self.npc,
        )

    def _url(self, character=None, game_slug='test-game'):
        """Return the detail URL for the given character (defaults to the fixture)."""
        character = character or self.character
        return f'/games/{game_slug}/{self.segment}/{character.id}.json'

    def test_returns_character_detail(self, client):
        """Test that character detail is returned for a valid character_id."""
        response = self.get(client, self._url())
        assert_json_response(response, 200, name=self.character_name, game_slug='test-game')

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = self.get(client, f'/games/test-game/{self.segment}/99999.json')
        assert response.status_code == 404

    def test_returns_404_for_character_in_wrong_game(self, client):
        """Test that 404 is returned when character belongs to a different game."""
        GameFactory(name='Other Game', game_slug='other-game')
        response = self.get(client, self._url(game_slug='other-game'))
        assert response.status_code == 404

    def test_can_edit_is_false_for_anonymous_request(self, client):
        """Test that can_edit is false when the request has no token."""
        response = self.get(client, self._url())
        assert_json_response(response, 200, can_edit=False)

    def test_can_edit_is_true_for_superuser(self, client):
        """Test that can_edit is true when the token belongs to a superuser."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert_json_response(response, 200, can_edit=True)

@pytest.mark.django_db
class TestGameNpcDetailView(_BaseCharacterDetailViewTest):
    """Tests for the NPC detail endpoint."""

    npc = True
    segment = 'npcs'
    character_name = 'Gandalf'
    character_role = 'Wizard'
    character_description = 'A wandering wizard.'

    def test_returns_404_for_pc_id(self, client):
        """Test that 404 is returned when the id belongs to a PC."""
        pc = CharacterFactory(name='Aragorn', game=self.game, player=self.player, npc=False)
        response = self.get(client, self._url(character=pc))
        assert response.status_code == 404

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'


@pytest.mark.django_db
class TestGamePcDetailView(_BaseCharacterDetailViewTest):
    """Tests for the PC detail endpoint."""

    npc = False
    segment = 'pcs'
    character_name = 'Aragorn'
    character_role = 'Ranger'
    character_description = 'The future king of Gondor.'

    def test_returns_404_for_npc_id(self, client):
        """Test that 404 is returned when the id belongs to an NPC."""
        npc = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        response = self.get(client, self._url(character=npc))
        assert response.status_code == 404

    def test_can_edit_is_true_for_connected_player_user(self, client):
        """Test that can_edit is true when the token belongs to the character's player's user."""
        user = UserFactory(username='owner', password='secret-password')
        self.player.user = user
        self.player.save()
        token = Token.objects.create(user=user)
        response = self.get(client, self._url(), token=token)
        assert_json_response(response, 200, can_edit=True)


@pytest.mark.django_db
class TestGameNpcDetailHidden(TokenAuthRequestMixin):
    """Tests for the hidden-NPC visibility gate in game_npc_detail.

    Kept in full: these are the access-control tests for NPC visibility, required
    to stay intact per docs/agents/security-guidelines.md section 8.
    """

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.hidden_npc = CharacterFactory(
            name='Secret NPC', game=self.game, npc=True, hidden=True
        )

    def _url(self, character=None):
        """Return the detail URL for the given character (defaults to the hidden NPC)."""
        character = character or self.hidden_npc
        return f'/games/test-game/npcs/{character.id}.json'

    def test_hidden_npc_returns_404_for_anonymous(self, client):
        """Test that an anonymous request to a hidden NPC gets 404."""
        response = self.get(client, self._url())
        assert response.status_code == 404

    def test_hidden_npc_returns_404_for_regular_user(self, client):
        """Test that a non-DM authenticated user gets 404 for a hidden NPC."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 404

    def test_hidden_npc_returns_200_for_dm(self, client):
        """Test that a DM can access a hidden NPC detail."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert_json_response(response, 200, name='Secret NPC')

    def test_hidden_npc_returns_200_for_superuser(self, client):
        """Test that a superuser can access a hidden NPC detail."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert_json_response(response, 200, name='Secret NPC')

    def test_visible_npc_returns_200_for_anonymous(self, client):
        """Test that a visible NPC is still accessible to anonymous users."""
        visible_npc = CharacterFactory(name='Visible NPC', game=self.game, npc=True, hidden=False)
        response = self.get(client, self._url(character=visible_npc))
        assert response.status_code == 200

    def test_hidden_npc_response_includes_x_skip_cache_header_for_dm(self, client):
        """Test that a DM's response for a hidden NPC includes X-Skip-Cache: true."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response['X-Skip-Cache'] == 'true'

    def test_hidden_npc_404_response_includes_x_skip_cache_header_for_anonymous(self, client):
        """Test that an anonymous 404 response for a hidden NPC includes X-Skip-Cache: true."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'
