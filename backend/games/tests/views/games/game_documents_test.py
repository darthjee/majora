"""Tests for the game documents view."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterDocument, GameDocument
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameDocumentFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


class TestGameDocumentsView(TestCase):
    """Tests for the GET /games/<slug>/documents.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')

    def test_returns_empty_list_when_no_documents(self):
        """Test that an empty list is returned when the game has no documents."""
        response = self.client.get('/games/test-game/documents.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_only_game_documents(self):
        """Test that only documents belonging to the game are returned."""
        GameDocumentFactory(game=self.game, name='Ancient Scroll')
        GameDocumentFactory(game=self.other_game, name='Treaty of Kings')
        response = self.client.get('/games/test-game/documents.json')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Ancient Scroll'

    def test_returns_id_name_photo_path_fields(self):
        """Test that list documents include id, name, and photo_path fields."""
        document = GameDocumentFactory(
            game=self.game, name='Ancient Scroll', description='A crumbling scroll.',
        )
        response = self.client.get('/games/test-game/documents.json')
        data = json.loads(response.content)
        assert data[0]['id'] == document.id
        assert data[0]['name'] == 'Ancient Scroll'
        assert data[0]['photo_path'] is None

    def test_does_not_include_description(self):
        """Test that description is not exposed on the index endpoint."""
        GameDocumentFactory(
            game=self.game, name='Ancient Scroll', description='A crumbling scroll.',
        )
        response = self.client.get('/games/test-game/documents.json')
        data = json.loads(response.content)
        assert 'description' not in data[0]

    def test_excludes_hidden_documents(self):
        """Test that a hidden game document is excluded from the response."""
        GameDocumentFactory(game=self.game, name='Secret Letter', hidden=True)
        response = self.client.get('/games/test-game/documents.json')
        data = json.loads(response.content)
        assert data == []

    def test_includes_visible_documents_alongside_hidden_ones(self):
        """Test that non-hidden documents are still returned when hidden ones exist too."""
        visible = GameDocumentFactory(game=self.game, name='Visible Letter')
        GameDocumentFactory(game=self.game, name='Secret Letter', hidden=True)
        response = self.client.get('/games/test-game/documents.json')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == visible.id

    def test_does_not_include_hidden_field(self):
        """Test that the hidden field is not exposed on the player-facing list."""
        GameDocumentFactory(game=self.game, name='Letter')
        response = self.client.get('/games/test-game/documents.json')
        data = json.loads(response.content)
        assert 'hidden' not in data[0]

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        response = self.client.get('/games/unknown-game/documents.json')
        assert response.status_code == 404

    def test_response_includes_page_header(self):
        """Test that the response includes the page header."""
        response = self.client.get('/games/test-game/documents.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self):
        """Test that the response includes the total pages header."""
        response = self.client.get('/games/test-game/documents.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self):
        """Test that the response includes the per_page header."""
        response = self.client.get('/games/test-game/documents.json?per_page=5')
        assert response['per_page'] == '5'

    def test_respects_page_param(self):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            GameDocumentFactory(game=self.game, name=f'Document {i}')
        response = self.client.get('/games/test-game/documents.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('game-documents', kwargs={'game_slug': 'test-game'})
        response = self.client.get(url)
        assert response.status_code == 200

    def test_returns_documents_ordered_by_id(self):
        """Test that documents are returned ordered by id."""
        first = GameDocumentFactory(game=self.game, name='First Document')
        second = GameDocumentFactory(game=self.game, name='Second Document')
        response = self.client.get('/games/test-game/documents.json')
        data = json.loads(response.content)
        assert [document['id'] for document in data] == [first.id, second.id]


class TestGameDocumentsCreate(TokenAuthRequestMixin, TestCase):
    """Tests for POST /games/<slug>/documents.json (issue #758)."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, a player of the game, and an unrelated user."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Bob', user=cls.player_user, game=cls.game)
        cls.other_user = UserFactory(username='other', password='secret-password')

    def _url(self, game_slug='test-game'):
        """Return the documents list/create URL for the given game slug."""
        return f'/games/{game_slug}/documents.json'

    def _post(self, client, payload, token=None):
        """Issue a POST request to create a game document, optionally with a token."""
        return self.post(client, self._url(), payload, token=token)

    def test_dm_can_create_document(self):
        """Test that the game's DM can create a bare GameDocument."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(
            self.client,
            {'name': 'Ancient Scroll', 'description': 'A crumbling scroll.', 'hidden': True},
            token=token,
        )
        assert response.status_code == 201
        data = json.loads(response.content)
        assert data['name'] == 'Ancient Scroll'
        assert data['description'] == 'A crumbling scroll.'
        assert data['hidden'] is True
        assert data['photo_path'] is None

    def test_create_persists_only_game_document(self):
        """Test that the create endpoint persists a GameDocument and no CharacterDocument."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(
            self.client,
            {'name': 'Ancient Scroll', 'description': 'A crumbling scroll.'},
            token=token,
        )
        data = json.loads(response.content)
        game_document = GameDocument.objects.get(id=data['id'])
        assert game_document.game == self.game
        assert game_document.name == 'Ancient Scroll'
        assert game_document.description == 'A crumbling scroll.'
        assert not CharacterDocument.objects.filter(game_document=game_document).exists()

    def test_create_defaults_description_and_hidden(self):
        """Test that description defaults to '' and hidden defaults to False."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(self.client, {'name': 'Ancient Scroll'}, token=token)
        data = json.loads(response.content)
        assert data['description'] == ''
        assert data['hidden'] is False

    def test_superuser_can_create_document(self):
        """Test that a superuser can create a bare GameDocument."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._post(self.client, {'name': 'Ancient Scroll'}, token=token)
        assert response.status_code == 201

    def test_staff_can_create_document(self):
        """Test that a global Staff account can create a bare GameDocument."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        token = Token.objects.create(user=staff_user)
        response = self._post(self.client, {'name': 'Ancient Scroll'}, token=token)
        assert response.status_code == 201

    def test_unauthenticated_returns_401(self):
        """Test that a request without a token is rejected with 401."""
        response = self._post(self.client, {'name': 'Ancient Scroll'})
        assert response.status_code == 401

    def test_regular_player_returns_403(self):
        """Test that a regular player of the game is rejected with 403."""
        token = Token.objects.create(user=self.player_user)
        response = self._post(self.client, {'name': 'Ancient Scroll'}, token=token)
        assert response.status_code == 403

    def test_unrelated_user_returns_403(self):
        """Test that an authenticated user unrelated to the game is rejected with 403."""
        token = Token.objects.create(user=self.other_user)
        response = self._post(self.client, {'name': 'Ancient Scroll'}, token=token)
        assert response.status_code == 403

    def test_missing_name_returns_400(self):
        """Test that a missing name returns 400."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(self.client, {}, token=token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_blank_name_returns_400(self):
        """Test that a blank name returns 400."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(self.client, {'name': ''}, token=token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_name_too_long_returns_400(self):
        """Test that a name longer than 200 chars returns 400."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(self.client, {'name': 'x' * 201}, token=token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_returns_404_for_unknown_game_slug(self):
        """Test that a non-existent game slug returns 404."""
        token = Token.objects.create(user=self.dm_user)
        response = self.post(
            self.client, self._url(game_slug='unknown-game'), {'name': 'Ancient Scroll'},
            token=token,
        )
        assert response.status_code == 404
