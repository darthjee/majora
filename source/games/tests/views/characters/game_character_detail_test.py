"""Tests for the PC/NPC detail view (GET detail / PATCH update / hidden-NPC gate).

Field-level serialization (every field, every can_edit permutation) is covered by
`games/tests/serializers/test_character_detail.py` and `test_character_update.py`.
This module only owns what those serializer tests cannot: routing, status codes,
the request/token permission pipeline, and view-specific response shape (e.g.
headers). See `docs/agents/security-guidelines.md` section 8 for why
`test_patch_ignores_non_editable_fields` must stay.
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


class _BaseCharacterUpdateViewTest(TokenAuthRequestMixin):
    """Shared PATCH behavior for the PC and NPC update endpoints."""

    npc = None
    segment = None
    character_name = None
    character_role = None
    character_description = None
    new_name = None
    new_role = None
    new_public_description = None
    new_private_description = None
    new_money = None

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

    def _editor_token(self):
        """Return a token belonging to a user allowed to edit the character."""
        raise NotImplementedError

    def _url(self):
        """Return the update URL for the fixture character."""
        return f'/games/test-game/{self.segment}/{self.character.id}.json'

    def _patch(self, client, payload, token=None):
        """Issue a PATCH request to the character update endpoint, optionally with a token."""
        return self.patch(client, self._url(), payload, token=token)

    def test_patch_without_token_returns_401(self, client):
        """Test that PATCH without a token is rejected with 401."""
        response = self._patch(client, {'name': self.new_name})
        assert response.status_code == 401

    def test_patch_with_unrelated_user_returns_403(self, client):
        """Test that PATCH from an unrelated user's token is rejected with 403."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)

        response = self._patch(client, {'name': self.new_name}, token=token)

        assert response.status_code == 403
        self.character.refresh_from_db()
        assert self.character.name == self.character_name

    def test_patch_updates_multiple_fields(self, client):
        """Test that an authorized PATCH updates several editable fields in one request."""
        token = self._editor_token()

        response = self._patch(
            client,
            {
                'name': self.new_name,
                'role': self.new_role,
                'public_description': self.new_public_description,
                'private_description': self.new_private_description,
                'money': self.new_money,
            },
            token=token,
        )

        assert_json_response(response, 200, name=self.new_name, money=self.new_money)
        self.character.refresh_from_db()
        assert self.character.name == self.new_name
        assert self.character.private_description == self.new_private_description

    def test_patch_negative_money_returns_400(self, client):
        """Test that PATCH with a negative money value is rejected with 400."""
        token = self._editor_token()

        response = self._patch(client, {'money': -1}, token=token)

        data = assert_json_response(response, 400)
        assert 'money' in data['errors']
        self.character.refresh_from_db()
        assert self.character.money == 0

    def test_patch_ignores_non_editable_fields(self, client):
        """Test that fields outside the allowed set are silently ignored.

        This is the view-level regression test required for update serializers by
        docs/agents/security-guidelines.md section 8 — `game` here is a
        relationship/ownership field and must never be settable via a generic
        update payload.
        """
        token = self._editor_token()
        other_game = GameFactory(name='Other Game', game_slug='other-game')

        response = self._patch(
            client,
            {'name': self.new_name, 'npc': not self.npc, 'game': other_game.id},
            token=token,
        )

        assert response.status_code == 200
        self.character.refresh_from_db()
        assert self.character.name == self.new_name
        assert self.character.npc is self.npc
        assert self.character.game_id == self.game.id


@pytest.mark.django_db
class TestGameNpcUpdateView(_BaseCharacterUpdateViewTest):
    """Tests for the NPC update (PATCH) endpoint."""

    npc = True
    segment = 'npcs'
    character_name = 'Gandalf'
    character_role = 'Wizard'
    character_description = 'A wandering wizard.'
    new_name = 'Saruman'
    new_role = 'Wizard'
    new_public_description = 'The White Wizard.'
    new_private_description = 'Secret wizard lore.'
    new_money = 200

    def _editor_token(self):
        """Return a superuser's token."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        return Token.objects.create(user=superuser)

    def test_patch_with_connected_player_user_returns_403(self, client):
        """Test that owning a Player never grants edit access to an NPC."""
        owner = UserFactory(username='owner', password='secret-password')
        self.player.user = owner
        self.player.save()
        token = Token.objects.create(user=owner)

        response = self._patch(client, {'name': self.new_name}, token=token)

        assert response.status_code == 403
        self.character.refresh_from_db()
        assert self.character.name == self.character_name


@pytest.mark.django_db
class TestGamePcUpdateView(_BaseCharacterUpdateViewTest):
    """Tests for the PC update (PATCH) endpoint."""

    npc = False
    segment = 'pcs'
    character_name = 'Aragorn'
    character_role = 'Ranger'
    character_description = 'The future king of Gondor.'
    new_name = 'Strider'
    new_role = 'Ranger King'
    new_public_description = 'King of Gondor.'
    new_private_description = 'Secret backstory.'
    new_money = 150

    def setup_method(self):
        """Set up a game, an owning player/user, and the PC."""
        super().setup_method()
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()

    def _editor_token(self):
        """Return the owning player's user token."""
        return Token.objects.create(user=self.owner)

    def test_patch_with_superuser_token_returns_200(self, client):
        """Test that PATCH from a superuser's token is allowed."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = self._patch(client, {'name': self.new_name}, token=token)

        assert response.status_code == 200
        self.character.refresh_from_db()
        assert self.character.name == self.new_name


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
