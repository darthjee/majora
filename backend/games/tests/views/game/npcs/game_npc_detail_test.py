"""Tests for the NPC detail view (GET detail / hidden-NPC gate / player-facing update PATCH).

Field-level serialization (every field, every can_edit permutation) is covered by
`games/tests/serializers/test_character_detail.py`. This module only owns what those
serializer tests cannot: routing, status codes, the request/token permission pipeline,
and view-specific response shape (e.g. headers).

`PATCH /games/<game_slug>/npcs/<id>.json` accepts a narrow
`{"name", "role", "public_description", "allegiance", "slain", "links"}` payload (issue #416,
widened by #445, #578), allowed for any player of the game (per the same computation backing
`is_player`) or an existing `CharacterEditPermission` editor (GM/superuser). See
`docs/agents/security-guidelines.md` section 8 for why the "ignores non-editable
fields" test must stay.
"""

import pytest
from django.test import TestCase
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
class TestGameNpcDetailView(TokenAuthRequestMixin):
    """Tests for the NPC detail endpoint (GET)."""

    def setup_method(self):
        """Set up a game, a player, and an NPC."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.player = PlayerFactory(name='Bob')
        self.character = CharacterFactory(
            name='Gandalf',
            game=self.game,
            player=None,
            role='Wizard',
            public_description='A wandering wizard.',
            npc=True,
        )

    def _url(self, character=None, game_slug='test-game'):
        """Return the detail URL for the given character (defaults to the fixture)."""
        character = character or self.character
        return f'/games/{game_slug}/npcs/{character.id}.json'

    def test_returns_character_detail(self, client):
        """Test that character detail is returned for a valid character_id."""
        response = self.get(client, self._url())
        assert_json_response(response, 200, name='Gandalf', game_slug='test-game')

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = self.get(client, '/games/test-game/npcs/99999.json')
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

    def test_returns_404_for_pc_id(self, client):
        """Test that 404 is returned when the id belongs to a PC."""
        pc = CharacterFactory(name='Aragorn', game=self.game, player=self.player, npc=False)
        response = self.get(client, self._url(character=pc))
        assert response.status_code == 404

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'

    def test_includes_treasure_value_summed_across_treasures(self, client):
        """Test that treasure_value sums total_value across the NPC's treasure rows."""
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
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
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


class TestGameNpcPlayerUpdateView(TokenAuthRequestMixin, TestCase):
    """Tests for the narrow player-facing PATCH on `/games/<game_slug>/npcs/<id>.json`."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, a player linked to the game, and an NPC."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.player_user = UserFactory(username='player_user', password='secret-password')
        cls.player = PlayerFactory(name='Bob', user=cls.player_user, game=cls.game)
        cls.npc = CharacterFactory(name='Gandalf', game=cls.game, npc=True)

    def _url(self, character=None):
        """Return the plain NPC detail URL for the given character (defaults to the fixture)."""
        character = character or self.npc
        return f'/games/test-game/npcs/{character.id}.json'

    def _patch(self, client, payload, token=None, character=None):
        """Issue a PATCH request to the plain NPC detail endpoint."""
        return self.patch(client, self._url(character=character), payload, token=token)

    def test_patch_without_token_returns_401(self):
        """Test that PATCH without a token is rejected with 401."""
        response = self._patch(self.client, {'slain': True})
        assert response.status_code == 401

    def test_patch_by_player_of_game_returns_200(self):
        """Test that a player of the game (via Player.game) can toggle slain."""
        token = Token.objects.create(user=self.player_user)

        response = self._patch(self.client, {'slain': True}, token=token)

        assert_json_response(response, 200, slain=True)
        self.npc.refresh_from_db()
        assert self.npc.public_slain is True

    def test_patch_by_dm_returns_200(self):
        """Test that a GameMaster of the game can also use this endpoint."""
        token = Token.objects.create(user=self.dm_user)

        response = self._patch(self.client, {'slain': True}, token=token)

        assert_json_response(response, 200, slain=True)

    def test_patch_by_superuser_returns_200(self):
        """Test that a superuser can also use this endpoint."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = self._patch(self.client, {'slain': True}, token=token)

        assert_json_response(response, 200, slain=True)

    def test_patch_public_description_by_player_of_game_returns_200(self):
        """Test that a player of the game can update `public_description`."""
        token = Token.objects.create(user=self.player_user)

        response = self._patch(
            self.client, {'public_description': 'A wandering wizard.'}, token=token
        )

        assert_json_response(response, 200, public_description='A wandering wizard.')
        self.npc.refresh_from_db()
        assert self.npc.public_description == 'A wandering wizard.'

    def test_patch_name_and_role_by_player_of_game_returns_200(self):
        """Test that a player of the game can update `name` and `role`."""
        token = Token.objects.create(user=self.player_user)

        response = self._patch(
            self.client, {'name': 'Saruman', 'role': 'Dark Wizard'}, token=token
        )

        assert_json_response(response, 200, name='Saruman', role='Dark Wizard')
        self.npc.refresh_from_db()
        assert self.npc.name == 'Saruman'
        assert self.npc.role == 'Dark Wizard'

    def test_patch_allegiance_by_player_of_game_returns_200(self):
        """Test that a player of the game can update `allegiance` (writes public_allegiance)."""
        token = Token.objects.create(user=self.player_user)

        response = self._patch(self.client, {'allegiance': 'enemy'}, token=token)

        assert response.status_code == 200
        self.npc.refresh_from_db()
        assert self.npc.public_allegiance == 'enemy'
        assert self.npc.allegiance == 'neutral'

    def test_patch_links_by_player_of_game_returns_200(self):
        """Test that a player of the game can create a link via `links`."""
        token = Token.objects.create(user=self.player_user)

        response = self._patch(
            self.client,
            {'links': [{'text': 'Loot table', 'url': 'http://example.com/loot'}]},
            token=token,
        )

        assert response.status_code == 200
        assert self.npc.links.filter(url='http://example.com/loot').exists()

    def test_patch_combined_fields_by_player_of_game_returns_200(self):
        """Test that a player of the game can update every new field together."""
        token = Token.objects.create(user=self.player_user)

        response = self._patch(
            self.client,
            {
                'name': 'Saruman',
                'role': 'Dark Wizard',
                'public_description': 'A wandering wizard.',
                'allegiance': 'ally',
                'slain': True,
                'links': [{'text': 'Loot table', 'url': 'http://example.com/loot'}],
            },
            token=token,
        )

        assert response.status_code == 200
        self.npc.refresh_from_db()
        assert self.npc.name == 'Saruman'
        assert self.npc.role == 'Dark Wizard'
        assert self.npc.public_description == 'A wandering wizard.'
        assert self.npc.public_allegiance == 'ally'
        assert self.npc.public_slain is True
        assert self.npc.links.filter(url='http://example.com/loot').exists()

    def test_patch_public_description_by_dm_returns_200(self):
        """Test that a GameMaster can also update `public_description`."""
        token = Token.objects.create(user=self.dm_user)

        response = self._patch(
            self.client, {'public_description': 'A wandering wizard.'}, token=token
        )

        assert response.status_code == 200

    def test_patch_allegiance_by_superuser_returns_200(self):
        """Test that a superuser can also update `allegiance`."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = self._patch(self.client, {'allegiance': 'ally'}, token=token)

        assert response.status_code == 200

    def test_patch_by_unrelated_user_returns_403(self):
        """Test that an authenticated user who is neither a player nor an editor gets 403."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)

        response = self._patch(self.client, {'slain': True}, token=token)

        assert response.status_code == 403
        self.npc.refresh_from_db()
        assert self.npc.public_slain is False

    def test_patch_sets_public_slain_and_leaves_real_slain_untouched(self):
        """Test that {"slain": true} sets public_slain but not the real slain field."""
        token = Token.objects.create(user=self.player_user)

        response = self._patch(self.client, {'slain': True}, token=token)

        assert response.status_code == 200
        self.npc.refresh_from_db()
        assert self.npc.public_slain is True
        assert self.npc.slain is False

    def test_patch_sets_public_slain_back_to_false(self):
        """Test that {"slain": false} reverts a slain NPC's public_slain to False."""
        self.npc.public_slain = True
        self.npc.save()
        token = Token.objects.create(user=self.player_user)

        response = self._patch(self.client, {'slain': False}, token=token)

        assert_json_response(response, 200, slain=False)
        self.npc.refresh_from_db()
        assert self.npc.public_slain is False

    def test_patch_ignores_non_editable_fields(self):
        """Test that fields outside the curated player field set are silently ignored.

        This is the view-level regression test required for update serializers by
        `docs/agents/security-guidelines.md` section 8.
        """
        token = Token.objects.create(user=self.player_user)

        response = self._patch(
            self.client,
            {
                'slain': True,
                'money': 999,
                'private_description': 'Secretly Saruman.',
                'public_allegiance': 'enemy',
                'allegiance': 'enemy',
            },
            token=token,
        )

        assert response.status_code == 200
        self.npc.refresh_from_db()
        assert self.npc.public_slain is True
        assert self.npc.money == 0
        assert self.npc.private_description == ''
        assert self.npc.public_allegiance == 'enemy'
        assert self.npc.allegiance == 'neutral'

    def test_patch_response_matches_get_detail_shape(self):
        """Test that the PATCH response has the same shape as the GET detail response."""
        token = Token.objects.create(user=self.player_user)

        get_response = self.get(self.client, self._url())
        patch_response = self._patch(self.client, {'slain': True}, token=token)

        get_data = assert_json_response(get_response, 200)
        patch_data = assert_json_response(patch_response, 200)
        assert set(patch_data.keys()) == set(get_data.keys())

    def test_patch_response_includes_x_skip_cache_header(self):
        """Test that the PATCH response includes the X-Skip-Cache: true header."""
        token = Token.objects.create(user=self.player_user)
        response = self._patch(self.client, {'slain': True}, token=token)
        assert response['X-Skip-Cache'] == 'true'

    def test_patch_on_pc_id_returns_404(self):
        """Test that this NPC-only endpoint returns 404 for a PC id."""
        pc = CharacterFactory(name='Aragorn', game=self.game, npc=False)
        token = Token.objects.create(user=self.player_user)

        response = self._patch(self.client, {'slain': True}, token=token, character=pc)

        assert response.status_code == 404


class TestGameNpcPlayerUpdateHiddenGate(TokenAuthRequestMixin, TestCase):
    """Tests for the hidden-NPC gate on the narrow player-facing update PATCH."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, a player linked to the game, and a hidden NPC."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.player_user = UserFactory(username='player_user', password='secret-password')
        cls.player = PlayerFactory(name='Bob', user=cls.player_user, game=cls.game)
        cls.hidden_npc = CharacterFactory(
            name='Secret NPC', game=cls.game, npc=True, hidden=True
        )

    def _url(self):
        """Return the plain NPC detail URL for the hidden NPC fixture."""
        return f'/games/test-game/npcs/{self.hidden_npc.id}.json'

    def test_patch_hidden_npc_by_player_returns_404(self):
        """Test that a player of the game (not an editor) gets 404 for a hidden NPC."""
        token = Token.objects.create(user=self.player_user)

        response = self.patch(self.client, self._url(), {'slain': True}, token=token)

        assert response.status_code == 404

    def test_patch_hidden_npc_by_dm_returns_200(self):
        """Test that a DM can still PATCH a hidden NPC's slain state."""
        token = Token.objects.create(user=self.dm_user)

        response = self.patch(self.client, self._url(), {'slain': True}, token=token)

        assert response.status_code == 200
