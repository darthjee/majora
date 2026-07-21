"""Tests for the NPC documents view."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterDocument
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameDocumentFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameNpcDocumentsView(TokenAuthRequestMixin):
    """Tests for the GET /games/<slug>/npcs/<id>/documents.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the documents list URL for the given character (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/npcs/{character_id}/documents.json'

    def test_returns_empty_list_when_no_documents(self, client):
        """Test that an empty list is returned when the character has no documents."""
        response = client.get(self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_id_game_document_id_name_photo_path_fields(self, client):
        """Test that list documents include the correct fields."""
        game_document = GameDocumentFactory(
            game=self.game, name='Ancient Scroll', description='A crumbling scroll.',
        )
        character_document = CharacterDocument.objects.create(
            character=self.character, game_document=game_document,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == character_document.id
        assert data[0]['game_document_id'] == game_document.id
        assert data[0]['name'] == 'Ancient Scroll'
        assert data[0]['photo_path'] is None

    def test_does_not_include_description(self, client):
        """Test that description is not exposed on the index endpoint."""
        game_document = GameDocumentFactory(
            game=self.game, name='Ancient Scroll', description='A crumbling scroll.',
        )
        CharacterDocument.objects.create(character=self.character, game_document=game_document)
        response = client.get(self._url())
        data = json.loads(response.content)
        assert 'description' not in data[0]

    def test_excludes_hidden_documents(self, client):
        """Test that a hidden character document is excluded from the response."""
        game_document = GameDocumentFactory(game=self.game, name='Secret Scroll')
        CharacterDocument.objects.create(
            character=self.character, game_document=game_document, hidden=True,
        )
        response = client.get(self._url())
        assert json.loads(response.content) == []

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get(self._url(character_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_character_in_wrong_game(self, client):
        """Test that 404 is returned when the character belongs to a different game."""
        GameFactory(name='Other Game', game_slug='other-game')
        response = client.get(self._url(game_slug='other-game'))
        assert response.status_code == 404

    def test_returns_404_for_opposite_role_id(self, client):
        """Test that 404 is returned when the id belongs to the opposite role."""
        other = CharacterFactory(name='Other', game=self.game, npc=False)
        response = client.get(self._url(character_id=other.id))
        assert response.status_code == 404

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get(self._url())
        assert response['page'] == '1'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-documents',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = client.get(url)
        assert response.status_code == 200

    def test_response_does_not_include_x_skip_cache_header(self, client):
        """Test that a visible NPC's response does not include X-Skip-Cache."""
        response = client.get(self._url())
        assert 'X-Skip-Cache' not in response


@pytest.mark.django_db
class TestGameNpcDocumentsHidden(TokenAuthRequestMixin):
    """Tests for the hidden-NPC visibility gate in game_npc_documents."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.hidden_npc = CharacterFactory(
            name='Secret NPC', game=self.game, npc=True, hidden=True,
        )
        game_document = GameDocumentFactory(game=self.game, name='Hidden Scroll')
        CharacterDocument.objects.create(character=self.hidden_npc, game_document=game_document)

    def _url(self, character=None):
        """Return the documents list URL for the given character (defaults to the hidden NPC)."""
        character = character or self.hidden_npc
        return f'/games/test-game/npcs/{character.id}/documents.json'

    def test_hidden_npc_documents_returns_404_for_anonymous(self, client):
        """Test that an anonymous request to a hidden NPC's documents gets 404."""
        response = self.get(client, self._url())
        assert response.status_code == 404

    def test_hidden_npc_documents_returns_404_for_regular_user(self, client):
        """Test that a non-DM authenticated user gets 404 for a hidden NPC's documents."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 404

    def test_hidden_npc_documents_returns_200_for_dm(self, client):
        """Test that a DM can access a hidden NPC's documents."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_hidden_npc_documents_returns_200_for_superuser(self, client):
        """Test that a superuser can access a hidden NPC's documents."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_hidden_npc_documents_response_includes_x_skip_cache_header_for_dm(self, client):
        """Test that a DM's response for a hidden NPC's documents includes X-Skip-Cache: true."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response['X-Skip-Cache'] == 'true'

    def test_hidden_npc_documents_404_response_includes_x_skip_cache_header(self, client):
        """Test that a 404 response for a hidden NPC's documents includes X-Skip-Cache: true."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'
