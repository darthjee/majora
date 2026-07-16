"""Tests for the PC detail view (GET detail).

Field-level serialization (every field, every can_edit permutation) is covered by
`games/tests/serializers/test_character_detail.py`. This module only owns what those
serializer tests cannot: routing, status codes, the request/token permission pipeline,
and view-specific response shape (e.g. headers). PATCH-endpoint tests moved to
`game_pc_full_test.py` (issue #428), since the update action now lives on
`full.json`; see `docs/agents/security-guidelines.md` section 8 for why
`test_patch_ignores_non_editable_fields` must stay (now over there).
"""

import pytest
from rest_framework.authtoken.models import Token

from games.models import CharacterTreasure
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    TreasureFactory,
    UserFactory,
)
from games.tests.views.support import assert_json_response


@pytest.mark.django_db
class TestGamePcDetailView(TokenAuthRequestMixin):
    """Tests for the PC detail endpoint."""

    def setup_method(self):
        """Set up a game, a player, and a PC."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.player = PlayerFactory(name='Bob')
        self.character = CharacterFactory(
            name='Aragorn',
            game=self.game,
            player=self.player,
            role='Ranger',
            public_description='The future king of Gondor.',
            npc=False,
        )

    def _url(self, character=None, game_slug='test-game'):
        """Return the detail URL for the given character (defaults to the fixture)."""
        character = character or self.character
        return f'/games/{game_slug}/pcs/{character.id}.json'

    def test_returns_character_detail(self, client):
        """Test that character detail is returned for a valid character_id."""
        response = self.get(client, self._url())
        assert_json_response(response, 200, name='Aragorn', game_slug='test-game')

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = self.get(client, '/games/test-game/pcs/99999.json')
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

    def test_includes_treasure_value_summed_across_treasures(self, client):
        """Test that treasure_value sums total_value across the PC's treasure rows."""
        treasure_one = TreasureFactory(name='Potion', value=50)
        treasure_two = TreasureFactory(name='Sword', value=100)
        CharacterTreasure.objects.create(
            character=self.character, treasure=treasure_one, quantity=2, total_value=100,
        )
        CharacterTreasure.objects.create(
            character=self.character, treasure=treasure_two, quantity=1, total_value=100,
        )
        response = self.get(client, self._url())
        assert_json_response(response, 200, treasure_value=200)
