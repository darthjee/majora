"""Tests for the PC/NPC full detail view."""

import json

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


class _BaseCharacterFullViewTest(TokenAuthRequestMixin):
    """Shared behavior for the PC and NPC full detail endpoints."""

    npc = None
    segment = None
    character_name = None
    character_role = None
    public_description = None
    private_description = None

    def setup_method(self):
        """Set up a game, a DM, a player, and a character (NPC or PC)."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.player = PlayerFactory(name='Bob')
        self.character = CharacterFactory(
            name=self.character_name,
            game=self.game,
            player=None if self.npc else self.player,
            role=self.character_role,
            public_description=self.public_description,
            private_description=self.private_description,
            npc=self.npc,
        )

    def _editor_token(self):
        """Return a token belonging to a user allowed to view the full character detail."""
        raise NotImplementedError

    def _url(self, character_id=None):
        """Return the full-detail URL for the given character id (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/test-game/{self.segment}/{character_id}/full.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that unauthenticated request returns 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_returns_403_for_non_editor(self, client):
        """Test that authenticated non-editor returns 403."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 403

    def test_returns_200_with_descriptions_for_editor(self, client):
        """Test that an authorized editor gets full detail including both descriptions."""
        token = self._editor_token()
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['public_description'] == self.public_description
        assert data['private_description'] == self.private_description

    def test_returns_200_with_descriptions_for_dm(self, client):
        """Test that a DM gets full detail including both descriptions."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['public_description'] == self.public_description
        assert data['private_description'] == self.private_description

    def test_returns_200_with_descriptions_for_superuser(self, client):
        """Test that a superuser gets full detail including both descriptions."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['public_description'] == self.public_description
        assert data['private_description'] == self.private_description

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        token = self._editor_token()
        response = self.get(client, self._url(), token=token)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        token = self._editor_token()
        response = self.get(client, self._url(character_id=99999), token=token)
        assert response.status_code == 404


@pytest.mark.django_db
class TestGameNpcFullView(_BaseCharacterFullViewTest):
    """Tests for the NPC full detail endpoint."""

    npc = True
    segment = 'npcs'
    character_name = 'Gandalf'
    character_role = 'Wizard'
    public_description = 'A wandering wizard.'
    private_description = 'The secret guardian of Middle Earth.'

    def _editor_token(self):
        """Return the DM's token (a DM is the NPC's editor)."""
        return Token.objects.create(user=self.dm_user)

    def test_returns_403_for_pc_player_who_is_not_dm(self, client):
        """Test that a PC player (not a DM) cannot access NPC full detail."""
        pc_user = UserFactory(username='alice', password='secret-password')
        self.player.user = pc_user
        self.player.save()
        CharacterFactory(name='Frodo', game=self.game, player=self.player, npc=False)
        token = Token.objects.create(user=pc_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 403

    def test_returns_404_for_pc_id(self, client):
        """Test that 404 is returned when the id belongs to a PC."""
        pc = CharacterFactory(name='Frodo', game=self.game, player=self.player, npc=False)
        token = self._editor_token()
        response = self.get(client, self._url(character_id=pc.id), token=token)
        assert response.status_code == 404


@pytest.mark.django_db
class TestGamePcFullView(_BaseCharacterFullViewTest):
    """Tests for the PC full detail endpoint."""

    npc = False
    segment = 'pcs'
    character_name = 'Aragorn'
    character_role = 'Ranger'
    public_description = 'The future king of Gondor.'
    private_description = 'Secret heir to the throne.'

    def setup_method(self):
        """Set up a game, an owning player/user, a DM, and the PC."""
        super().setup_method()
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()

    def _editor_token(self):
        """Return the PC's owning player's user token."""
        return Token.objects.create(user=self.owner)

    def test_returns_404_for_npc_id(self, client):
        """Test that 404 is returned when the id belongs to an NPC."""
        npc = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        token = self._editor_token()
        response = self.get(client, self._url(character_id=npc.id), token=token)
        assert response.status_code == 404
