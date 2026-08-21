"""Tests for the NPC document photos-list view."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterDocument, GameDocumentPhoto
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
class TestGameNpcDocumentPhotosView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/npcs/<id>/documents/<document_id>/photos.json."""

    def setup_method(self):
        """Set up a game, an NPC, a game document, and a held CharacterDocument."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.game_document = GameDocumentFactory(game=self.game, name='Ancient Scroll')
        self.character_document = CharacterDocument.objects.create(
            character=self.character, game_document=self.game_document,
        )

    def _url(self, document_id=None, character_id=None, game_slug='test-game'):
        """Return the photos list URL for the given document (defaults to the fixture)."""
        document_id = document_id if document_id is not None else self.character_document.id
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/npcs/{character_id}/documents/{document_id}/photos.json'

    def test_returns_empty_list_when_no_photos(self, client):
        """Test that an empty list is returned when the document has no photos."""
        response = client.get(self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_only_ready_photos_with_character_document_id(self, client):
        """Test that list items include the character_document_id and mirror the game photo."""
        photo = GameDocumentPhoto.objects.create(
            path='photos/games/test-game/documents/1/scroll.png',
            game_document=self.game_document,
            ready=True,
        )
        GameDocumentPhoto.objects.create(
            path='photos/games/test-game/documents/1/draft.png',
            game_document=self.game_document,
            ready=False,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == photo.id
        assert data[0]['character_document_id'] == self.character_document.id

    def test_visible_even_when_game_document_is_hidden(self, client):
        """Test that a held document's photos stay visible even if the GameDocument is hidden."""
        self.game_document.hidden = True
        self.game_document.save()
        GameDocumentPhoto.objects.create(
            path='photos/games/test-game/documents/1/scroll.png',
            game_document=self.game_document,
            ready=True,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert len(data) == 1

    def test_returns_404_for_hidden_character_document(self, client):
        """Test that a hidden CharacterDocument's photos are not visible on the public route."""
        hidden_document = CharacterDocument.objects.create(
            character=self.character, game_document=GameDocumentFactory(game=self.game),
            hidden=True,
        )
        response = client.get(self._url(document_id=hidden_document.id))
        assert response.status_code == 404

    def test_returns_empty_list_for_incognito_character(self, client):
        """Test that an incognito character's photos list resolves to an empty list."""
        self.character.incognito = True
        self.character.save()
        GameDocumentPhoto.objects.create(
            path='photos/games/test-game/documents/1/scroll.png',
            game_document=self.game_document,
            ready=True,
        )
        response = client.get(self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_404_for_unknown_document(self, client):
        """Test that 404 is returned for a non-existent document id."""
        response = client.get(self._url(document_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get(self._url(character_id=99999))
        assert response.status_code == 404

    def test_response_does_not_include_x_skip_cache_header(self, client):
        """Test that a visible NPC's response does not include X-Skip-Cache."""
        response = client.get(self._url())
        assert 'X-Skip-Cache' not in response

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-document-photos',
            kwargs={
                'game_slug': 'test-game',
                'character_id': self.character.id,
                'document_id': self.character_document.id,
            },
        )
        response = client.get(url)
        assert response.status_code == 200


@pytest.mark.django_db
class TestGameNpcDocumentPhotosHidden(TokenAuthRequestMixin):
    """Tests for the hidden-NPC visibility gate in game_npc_document_photos."""

    def setup_method(self):
        """Set up a hidden NPC holding a document with a photo."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.hidden_npc = CharacterFactory(
            name='Secret NPC', game=self.game, npc=True, hidden=True,
        )
        self.game_document = GameDocumentFactory(game=self.game, name='Hidden Scroll')
        self.character_document = CharacterDocument.objects.create(
            character=self.hidden_npc, game_document=self.game_document,
        )
        GameDocumentPhoto.objects.create(
            path='photos/games/test-game/documents/1/secret.png',
            game_document=self.game_document,
            ready=True,
        )

    def _url(self):
        """Return the photos list URL for the hidden NPC's held document."""
        return (
            f'/games/test-game/npcs/{self.hidden_npc.id}'
            f'/documents/{self.character_document.id}/photos.json'
        )

    def test_hidden_npc_document_photos_returns_404_for_anonymous(self, client):
        """Test that an anonymous request to a hidden NPC's document photos gets 404."""
        response = self.get(client, self._url())
        assert response.status_code == 404

    def test_hidden_npc_document_photos_returns_200_for_dm(self, client):
        """Test that a DM can access a hidden NPC's document photos."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_hidden_npc_document_photos_returns_200_for_superuser(self, client):
        """Test that a superuser can access a hidden NPC's document photos."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200

    def test_hidden_npc_document_photos_404_response_includes_x_skip_cache_header(self, client):
        """Test that a 404 response for a hidden NPC's document photos includes X-Skip-Cache."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'
