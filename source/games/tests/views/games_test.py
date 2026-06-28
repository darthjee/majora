"""Tests for games views."""

import json

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import Game, GameMaster, Link


@pytest.mark.django_db
class TestGamesListView:
    """Tests for the games list endpoint."""

    def test_returns_empty_list(self, client):
        """Test that an empty list is returned when no games exist."""
        response = client.get('/games.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_games(self, client):
        """Test that created games are returned in the list."""
        Game.objects.create(name='Game One', game_slug='game-one')
        Game.objects.create(name='Game Two', game_slug='game-two')
        response = client.get('/games.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2
        slugs = [g['game_slug'] for g in data]
        assert 'game-one' in slugs
        assert 'game-two' in slugs

    def test_returns_photo_field(self, client):
        """Test that the photo field is included in the list response."""
        Game.objects.create(name='Visual Game', game_slug='visual-game', photo='http://example.com/cover.png')
        response = client.get('/games.json')
        data = json.loads(response.content)
        assert data[0]['photo'] == 'http://example.com/cover.png'

    def test_photo_field_is_null_when_not_set(self, client):
        """Test that photo is null in the response when not set."""
        Game.objects.create(name='No Photo', game_slug='no-photo')
        response = client.get('/games.json')
        data = json.loads(response.content)
        assert data[0]['photo'] is None

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('games-list')
        response = client.get(url)
        assert response.status_code == 200

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get('/games.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get('/games.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get('/games.json?per_page=5')
        assert response['per_page'] == '5'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            Game.objects.create(name=f'Game {i}', game_slug=f'game-{i}')
        response = client.get('/games.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_per_page_param(self, client):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            Game.objects.create(name=f'Game {i}', game_slug=f'game-{i}')
        response = client.get('/games.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2


@pytest.mark.django_db
class TestGamesCreateView:
    """Tests for the POST /games.json endpoint."""

    def setup_method(self):
        """Set up an authenticated user and token."""
        self.user = User.objects.create_user(username='creator', password='secret-password')
        self.token = Token.objects.create(user=self.user)

    def _post(self, client, payload, token=None):
        """Issue a POST request to the games list endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.post(
            '/games.json',
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_valid_post_returns_201(self, client):
        """Test that a valid POST returns HTTP 201."""
        response = self._post(client, {'name': 'New Adventure'}, token=self.token)
        assert response.status_code == 201

    def test_valid_post_returns_game_detail_body(self, client):
        """Test that the response body matches GameDetailSerializer output."""
        response = self._post(client, {'name': 'New Adventure'}, token=self.token)
        data = json.loads(response.content)
        assert data['name'] == 'New Adventure'
        assert 'game_slug' in data
        assert 'photo' in data
        assert 'description' in data
        assert 'links' in data
        assert 'photos' in data

    def test_game_slug_is_auto_generated(self, client):
        """Test that game_slug is generated from name automatically."""
        response = self._post(client, {'name': 'My Epic Campaign'}, token=self.token)
        data = json.loads(response.content)
        assert data['game_slug'] == 'my-epic-campaign'

    def test_post_without_name_returns_400(self, client):
        """Test that omitting name returns HTTP 400 with field errors."""
        response = self._post(client, {'description': 'No name given'}, token=self.token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_post_without_token_returns_401(self, client):
        """Test that a POST without an auth token returns HTTP 401."""
        response = self._post(client, {'name': 'Unauthorized Game'})
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_url_accessible_by_name(self, client):
        """Test that the games-list URL name resolves correctly for POST."""
        url = reverse('games-list')
        assert url == '/games.json'

    def test_post_with_optional_fields(self, client):
        """Test that optional fields photo and description are accepted."""
        payload = {
            'name': 'Full Game',
            'photo': 'http://example.com/cover.png',
            'description': 'A detailed campaign.',
        }
        response = self._post(client, payload, token=self.token)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert data['photo'] == 'http://example.com/cover.png'
        assert data['description'] == 'A detailed campaign.'

    def test_post_with_null_photo(self, client):
        """Test that photo can be explicitly set to null."""
        response = self._post(client, {'name': 'No Photo Game', 'photo': None}, token=self.token)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert data['photo'] is None


@pytest.mark.django_db
class TestGameDetailView:
    """Tests for the game detail endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Epic Quest', game_slug='epic-quest')

    def test_returns_game_detail(self, client):
        """Test that game detail is returned for a valid game_slug."""
        response = client.get('/games/epic-quest.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Epic Quest'
        assert data['game_slug'] == 'epic-quest'
        assert 'photo' in data

    def test_returns_description_field(self, client):
        """Test that description is included in the detail response."""
        self.game.description = 'A heroic adventure in Middle Earth.'
        self.game.save()
        response = client.get('/games/epic-quest.json')
        data = json.loads(response.content)
        assert data['description'] == 'A heroic adventure in Middle Earth.'

    def test_description_is_empty_string_when_not_set(self, client):
        """Test that description defaults to empty string."""
        response = client.get('/games/epic-quest.json')
        data = json.loads(response.content)
        assert data['description'] == ''

    def test_returns_404_for_unknown_slug(self, client):
        """Test that 404 is returned for a non-existent game_slug."""
        response = client.get('/games/unknown-game.json')
        assert response.status_code == 404

    def test_includes_links(self, client):
        """Test that game detail includes associated links."""
        Link.objects.create(text='Rulebook', url='http://example.com/rules', game=self.game)
        response = client.get('/games/epic-quest.json')
        data = json.loads(response.content)
        assert len(data['links']) == 1
        assert data['links'][0]['text'] == 'Rulebook'


@pytest.mark.django_db
class TestGameDetailPatchView:
    """Tests for the PATCH game detail endpoint."""

    def setup_method(self):
        """Set up a game, a DM, and a non-DM user."""
        self.game = Game.objects.create(
            name='Epic Quest',
            game_slug='epic-quest',
            description='Original description.',
        )
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)

    def _patch(self, client, payload, token=None):
        """Issue a PATCH request to the game detail endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.patch(
            '/games/epic-quest.json',
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_patch_without_token_returns_401(self, client):
        """Test that PATCH without a token is rejected with 401."""
        response = self._patch(client, {'name': 'New Name'})
        assert response.status_code == 401

    def test_patch_with_non_dm_user_returns_403(self, client):
        """Test that PATCH from a regular non-DM user is rejected with 403."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._patch(client, {'name': 'New Name'}, token=token)
        assert response.status_code == 403
        self.game.refresh_from_db()
        assert self.game.name == 'Epic Quest'

    def test_patch_with_dm_token_returns_200(self, client):
        """Test that PATCH from a DM's token updates the game and returns 200."""
        response = self._patch(
            client,
            {
                'name': 'Updated Quest',
                'description': 'Updated description.',
                'photo': 'http://example.com/new.png',
            },
            token=self.dm_token,
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Updated Quest'
        assert data['description'] == 'Updated description.'
        self.game.refresh_from_db()
        assert self.game.name == 'Updated Quest'

    def test_patch_with_superuser_token_returns_200(self, client):
        """Test that PATCH from a superuser's token updates the game and returns 200."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._patch(client, {'name': 'Super Quest'}, token=token)
        assert response.status_code == 200
        self.game.refresh_from_db()
        assert self.game.name == 'Super Quest'

    def test_patch_with_invalid_payload_returns_400(self, client):
        """Test that an invalid payload is rejected with 400."""
        response = self._patch(
            client, {'photo': 'not-a-url'}, token=self.dm_token
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'photo' in data['errors']

    def test_patch_does_not_change_game_slug(self, client):
        """Test that game_slug is not changed even if included in the payload."""
        response = self._patch(
            client, {'name': 'New Name', 'game_slug': 'hacked-slug'}, token=self.dm_token
        )
        assert response.status_code == 200
        self.game.refresh_from_db()
        assert self.game.game_slug == 'epic-quest'

    def test_patch_partial_body_only_changes_given_fields(self, client):
        """Test that a partial PATCH body only updates the provided field."""
        response = self._patch(client, {'name': 'Partial Update'}, token=self.dm_token)
        assert response.status_code == 200
        self.game.refresh_from_db()
        assert self.game.name == 'Partial Update'
        assert self.game.description == 'Original description.'


@pytest.mark.django_db
class TestGameAccessView:
    """Tests for the game access endpoint."""

    def setup_method(self):
        """Set up a game and a DM user."""
        self.game = Game.objects.create(name='Epic Quest', game_slug='epic-quest')
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)

    def _get(self, client, token=None):
        """Issue a GET request to the game access endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get('/games/epic-quest/access.json', **extra)

    def test_non_existent_slug_returns_200_with_can_edit_false(self, client):
        """Test that a non-existent game slug returns 200 with can_edit false."""
        response = client.get('/games/no-such-game/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_unauthenticated_returns_200_with_can_edit_false(self, client):
        """Test that an unauthenticated request returns 200 with can_edit false."""
        response = self._get(client)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_dm_returns_200_with_can_edit_true(self, client):
        """Test that the game DM returns 200 with can_edit true."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_non_dm_user_returns_200_with_can_edit_false(self, client):
        """Test that a non-DM authenticated user returns 200 with can_edit false."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_superuser_returns_200_with_can_edit_true(self, client):
        """Test that a superuser returns 200 with can_edit true."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._get(client)
        assert response['X-Skip-Cache'] == 'true'

    def test_unauthenticated_returns_null_user_context_fields(self, client):
        """Test that unauthenticated request returns null for username, is_superuser, is_dm."""
        response = self._get(client)
        data = json.loads(response.content)
        assert data['username'] is None
        assert data['is_superuser'] is None
        assert data['is_dm'] is None

    def test_dm_returns_correct_user_context_fields(self, client):
        """Test that DM request returns correct username, is_superuser=False, is_dm=True."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'dm_user'
        assert data['is_superuser'] is False
        assert data['is_dm'] is True

    def test_superuser_returns_correct_user_context_fields(self, client):
        """Test that superuser request returns correct username, is_superuser=True, is_dm=False."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'admin'
        assert data['is_superuser'] is True
        assert data['is_dm'] is False

    def test_non_dm_user_returns_correct_user_context_fields(self, client):
        """Test non-DM user returns correct username, is_superuser=False, is_dm=False."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'other'
        assert data['is_superuser'] is False
        assert data['is_dm'] is False
