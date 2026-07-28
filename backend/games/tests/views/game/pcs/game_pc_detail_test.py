"""Tests for the PC detail view (GET detail / PATCH regular update).

Field-level serialization (every field, every can_edit permutation) is covered by
`games/tests/serializers/test_character_detail.py`. This module only owns what those
serializer tests cannot: routing, status codes, the request/token permission pipeline,
and view-specific response shape (e.g. headers). The full-editor PATCH-endpoint tests
live in `game_pc_full_test.py` (issue #428), since that update action lives on
`full.json`; see `docs/agents/security-guidelines.md` section 8 for why
`test_patch_ignores_non_editable_fields` must stay (over there). This module's own
`TestGamePcRegularUpdateView` covers the narrower, player-writable PATCH endpoint added
by issue #865 (the same plain `pcs/:id.json` route as the GET tests above).
"""

import pytest
from rest_framework.authtoken.models import Token

from games.models import CharacterTreasure
from games.serializers.characters.character_link_write import MAX_LINKS
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

    def test_does_not_include_can_edit(self, client):
        """Test that the response never includes can_edit (moved to permissions.json)."""
        response = self.get(client, self._url())
        data = assert_json_response(response, 200)
        assert 'can_edit' not in data

    def test_returns_404_for_npc_id(self, client):
        """Test that 404 is returned when the id belongs to an NPC."""
        npc = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        response = self.get(client, self._url(character=npc))
        assert response.status_code == 404

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

    def test_response_does_not_include_x_skip_cache_header_for_non_hidden_pc(self, client):
        """Test that a non-hidden PC's response is safely cacheable (no X-Skip-Cache)."""
        response = self.get(client, self._url())
        assert 'X-Skip-Cache' not in response


@pytest.mark.django_db
class TestGamePcRegularUpdateView(TokenAuthRequestMixin):
    """Tests for the PC regular (player-writable) update endpoint (issue #865)."""

    def setup_method(self):
        """Set up a game, an owning player/user, a DM, a regular player, and the PC."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.player = PlayerFactory(name='Bob', game=self.game)
        self.character = CharacterFactory(
            name='Aragorn',
            game=self.game,
            player=self.player,
            role='Ranger',
            public_description='The future king of Gondor.',
            private_description='Secret heir to the throne.',
            npc=False,
        )
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.regular_player_user = UserFactory(
            username='regular_player', password='secret-password',
        )
        self.regular_player = PlayerFactory(
            name='Alice', user=self.regular_player_user, game=self.game
        )

    def _owner_token(self):
        """Return the PC's owning player's user token."""
        return Token.objects.create(user=self.owner)

    def _url(self, character_id=None):
        """Return the regular-update URL for the given character id (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/test-game/pcs/{character_id}.json'

    def _patch(self, client, payload, token=None):
        """Issue a PATCH request to the regular-update endpoint, optionally with a token."""
        return self.patch(client, self._url(), payload, token=token)

    def test_patch_without_token_returns_401(self, client):
        """Test that PATCH without a token is rejected with 401."""
        response = self._patch(client, {'name': 'Strider'})
        assert response.status_code == 401

    def test_patch_with_unrelated_user_returns_403(self, client):
        """Test that PATCH from an unrelated user's token is rejected with 403."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)

        response = self._patch(client, {'name': 'Strider'}, token=token)

        assert response.status_code == 403
        self.character.refresh_from_db()
        assert self.character.name == 'Aragorn'

    def test_patch_updates_fields_for_owning_player(self, client):
        """Test that the PC's owning player can update the regular field set."""
        token = self._owner_token()

        response = self._patch(
            client,
            {
                'name': 'Strider',
                'role': 'Ranger King',
                'public_description': 'King of Gondor.',
                'money': 150,
            },
            token=token,
        )

        assert_json_response(response, 200, name='Strider', money=150)
        self.character.refresh_from_db()
        assert self.character.name == 'Strider'
        assert self.character.role == 'Ranger King'
        assert self.character.public_description == 'King of Gondor.'
        assert self.character.money == 150

    def test_patch_updates_fields_for_dm(self, client):
        """Test that a DM of the game can update the regular field set."""
        token = Token.objects.create(user=self.dm_user)

        response = self._patch(client, {'name': 'Strider'}, token=token)

        assert_json_response(response, 200, name='Strider')
        self.character.refresh_from_db()
        assert self.character.name == 'Strider'

    def test_patch_updates_fields_for_superuser(self, client):
        """Test that a superuser (admin) can update the regular field set."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = self._patch(client, {'name': 'Strider'}, token=token)

        assert_json_response(response, 200, name='Strider')
        self.character.refresh_from_db()
        assert self.character.name == 'Strider'

    def test_patch_updates_fields_for_regular_player_of_the_game(self, client):
        """Test that any other player of the game (not the owner) can update the field set."""
        token = Token.objects.create(user=self.regular_player_user)

        response = self._patch(client, {'name': 'Strider'}, token=token)

        assert_json_response(response, 200, name='Strider')
        self.character.refresh_from_db()
        assert self.character.name == 'Strider'

    def test_patch_updates_fields_for_staff_user(self, client):
        """Test that a global Staff account (not otherwise related to the game) can edit."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        token = Token.objects.create(user=staff_user)

        response = self._patch(client, {'name': 'Strider'}, token=token)

        assert_json_response(response, 200, name='Strider')
        self.character.refresh_from_db()
        assert self.character.name == 'Strider'

    def test_patch_response_includes_full_detail_shape(self, client):
        """Test that the response body matches the CharacterDetailSerializer shape."""
        token = self._owner_token()

        response = self._patch(client, {'name': 'Strider'}, token=token)

        data = assert_json_response(response, 200)
        assert data['id'] == self.character.id
        assert data['name'] == 'Strider'

    def test_patch_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        token = self._owner_token()

        response = self._patch(client, {'name': 'Strider'}, token=token)

        assert response['X-Skip-Cache'] == 'true'

    def test_patch_negative_money_returns_400(self, client):
        """Test that PATCH with a negative money value is rejected with 400."""
        token = self._owner_token()

        response = self._patch(client, {'money': -1}, token=token)

        data = assert_json_response(response, 400)
        assert 'money' in data['errors']
        self.character.refresh_from_db()
        assert self.character.money == 0

    def test_patch_links_over_max_cap_returns_400(self, client):
        """Test that a links payload over the batch cap is rejected with 400."""
        token = self._owner_token()
        payload = [{'url': f'http://example.com/{i}'} for i in range(MAX_LINKS + 1)]

        response = self._patch(client, {'links': payload}, token=token)

        data = assert_json_response(response, 400)
        assert 'links' in data['errors']

    def test_patch_ignores_non_editable_fields(self, client):
        """Test that private_description/hidden/allegiance are silently ignored, not errored.

        This is the view-level regression test required for update serializers by
        docs/agents/security-guidelines.md section 8 — these fields belong only to the
        full-editor `full.json` endpoint's field set and must never be settable here.
        """
        token = self._owner_token()

        response = self._patch(
            client,
            {
                'name': 'Strider',
                'private_description': 'Leaked secret.',
                'hidden': True,
                'public_allegiance': 'enemy',
            },
            token=token,
        )

        assert response.status_code == 200
        self.character.refresh_from_db()
        assert self.character.name == 'Strider'
        assert self.character.private_description == 'Secret heir to the throne.'
        assert self.character.hidden is False
        assert self.character.public_allegiance == 'neutral'

    def test_patch_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        token = self._owner_token()

        response = self.patch(
            client, self._url(character_id=99999), {'name': 'Strider'}, token=token,
        )

        assert response.status_code == 404

    def test_patch_returns_404_for_npc_id(self, client):
        """Test that 404 is returned when the id belongs to an NPC."""
        npc = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        token = self._owner_token()

        response = self.patch(
            client, self._url(character_id=npc.id), {'name': 'Strider'}, token=token,
        )

        assert response.status_code == 404
