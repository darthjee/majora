"""Tests for the entity-agnostic PC permissions-check endpoint (issue #926)."""

import json

import pytest

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import CharacterFactory, GameFactory, PlayerFactory, UserFactory


@pytest.mark.django_db
class TestGamePcPermissionsView(TokenAuthRequestMixin):
    """Tests for the GET /permissions/game_pc.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.player = PlayerFactory(name='Bob')
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.character = CharacterFactory(
            name='Aragorn', game=self.game, player=self.player, npc=False
        )

    def _url(self, query=''):
        """Return the PC permissions-check URL, optionally with a query string."""
        url = '/permissions/game_pc.json'
        if query:
            url = f'{url}?{query}'
        return url

    def _all_false(self):
        """Return the expected all-False permissions dict."""
        return {
            'can_edit': False,
            'can_create_item': False,
            'can_upload_item_photo': False,
            'can_exchange_treasure': False,
            'can_set_profile_photo': False,
            'can_delete_photo': False,
        }

    def _all_true(self):
        """Return the expected all-True permissions dict."""
        return {
            'can_edit': True,
            'can_create_item': True,
            'can_upload_item_photo': True,
            'can_exchange_treasure': True,
            'can_set_profile_photo': True,
            'can_delete_photo': True,
        }

    def test_no_role_returns_all_false(self, client):
        """Test that a request with no role param returns every permission False."""
        response = self.get(client, self._url())
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data == self._all_false()

    def test_response_omits_x_skip_cache_header(self, client):
        """Test that a role-simulated response never sets X-Skip-Cache."""
        response = self.get(client, self._url())
        assert 'X-Skip-Cache' not in response

    def test_dm_can_edit(self, client):
        """Test that ?role=dm grants every permission True."""
        response = self.get(client, self._url(query='role=dm'))
        data = json.loads(response.content)
        assert data == self._all_true()

    def test_superuser_can_edit(self, client):
        """Test that ?role=superuser grants every permission True."""
        response = self.get(client, self._url(query='role=superuser'))
        data = json.loads(response.content)
        assert data == self._all_true()

    def test_anonymous_cannot_edit(self, client):
        """Test that an unauthenticated request gets every permission False."""
        response = self.get(client, self._url())
        data = json.loads(response.content)
        assert data == self._all_false()

    def test_unrecognized_role_does_not_fall_back_to_real_identity(self, client):
        """Test that an unrecognized role still switches to the role-simulated path."""
        response = self.get(client, self._url(query='role=bogus'))
        data = json.loads(response.content)
        assert data == self._all_false()

    def test_owner_can_edit(self, client):
        """Test that ?role=owner grants every permission True except can_delete_photo."""
        response = self.get(client, self._url(query='role=owner'))
        data = json.loads(response.content)
        assert data == {
            'can_edit': True,
            'can_create_item': True,
            'can_upload_item_photo': True,
            'can_exchange_treasure': True,
            'can_set_profile_photo': True,
            'can_delete_photo': False,
        }

    def test_staff_can_create_item_but_cannot_edit(self, client):
        """Test that ?role=staff grants the Staff-bypassed permissions, not can_edit."""
        response = self.get(client, self._url(query='role=staff'))
        data = json.loads(response.content)
        assert data == {
            'can_edit': False,
            'can_create_item': True,
            'can_upload_item_photo': True,
            'can_exchange_treasure': True,
            'can_set_profile_photo': True,
            'can_delete_photo': True,
        }

    def test_regular_player_can_create_item_and_upload_photo_but_cannot_edit(self, client):
        """Test that ?role=player (#864) gets the player-leniency permissions."""
        response = self.get(client, self._url(query='role=player'))
        data = json.loads(response.content)
        assert data == {
            'can_edit': False,
            'can_create_item': True,
            'can_upload_item_photo': True,
            'can_exchange_treasure': False,
            'can_set_profile_photo': True,
            'can_delete_photo': False,
        }

    def test_response_is_identical_regardless_of_which_characters_exist(self, client):
        """Test that the response for a given role doesn't depend on any real PC in the DB."""
        response_before = self.get(client, self._url(query='role=owner'))
        other_player = PlayerFactory(name='Sam')
        CharacterFactory(name='Legolas', game=self.game, player=other_player, npc=False)
        response_after = self.get(client, self._url(query='role=owner'))
        assert response_before.content == response_after.content
