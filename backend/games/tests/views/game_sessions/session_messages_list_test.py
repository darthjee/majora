"""Tests for the session messages list view (GET list / POST create)."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import GameSession, GameSessionMessage
from games.session_message_paginator import PAGE_SIZE
from games.tests.factories import (
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
    UserProfileFactory,
)


class TestSessionMessagesListView(TestCase):
    """Tests for the GET /games/<slug>/sessions/<id>/messages.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a session, a DM, a player, a superuser, and an outsider."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')
        cls.session = GameSession.objects.create(game=cls.game, title='Session One')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        UserProfileFactory(user=cls.dm_user, display_name='dm_display')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)
        cls.player_user = UserFactory(username='player_user', password='secret-password')
        cls.player = PlayerFactory(name='Bob', user=cls.player_user, game=cls.game)
        cls.player_token = Token.objects.create(user=cls.player_user)
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.outsider = UserFactory(username='outsider', password='secret-password')
        cls.outsider_token = Token.objects.create(user=cls.outsider)

    def _get(self, token=None, game_slug=None, session_id=None, query=''):
        """Issue a GET request to the session messages list endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        slug = game_slug or self.game.game_slug
        sid = session_id if session_id is not None else self.session.id
        url = f'/games/{slug}/sessions/{sid}/messages.json{query}'
        return self.client.get(url, **extra)

    def test_unauthenticated_get_returns_401(self):
        """Test that a GET without a token returns 401."""
        response = self._get()
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_outsider_get_returns_403(self):
        """Test that a GET from a user unrelated to the game returns 403."""
        response = self._get(token=self.outsider_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_player_can_list(self):
        """Test that a player of the game can list messages."""
        response = self._get(token=self.player_token)
        assert response.status_code == 200

    def test_dm_can_list(self):
        """Test that the DM of the game can list messages."""
        response = self._get(token=self.dm_token)
        assert response.status_code == 200

    def test_superuser_can_list(self):
        """Test that a superuser can list messages."""
        response = self._get(token=self.superuser_token)
        assert response.status_code == 200

    def test_returns_empty_list_when_no_messages(self):
        """Test that an empty list is returned when the session has no messages."""
        response = self._get(token=self.dm_token)
        assert json.loads(response.content) == []

    def test_returns_only_session_messages(self):
        """Test that only messages linked to the session are returned."""
        other_session = GameSession.objects.create(game=self.game, title='Other Session')
        GameSessionMessage.objects.create(
            session=self.session, user=self.dm_user, content='In this session'
        )
        GameSessionMessage.objects.create(
            session=other_session, user=self.dm_user, content='In another session'
        )
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['content'] == 'In this session'

    def test_returns_expected_payload_shape(self):
        """Test that each item exposes id, content, user (name/avatar_url), created_at."""
        GameSessionMessage.objects.create(
            session=self.session, user=self.dm_user, content='Hello there'
        )
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        item = data[0]
        assert set(item.keys()) == {'id', 'content', 'user', 'created_at'}
        assert item['content'] == 'Hello there'
        assert item['user']['name'] == 'dm_display'
        assert 'avatar_url' in item['user']
        assert set(item['user'].keys()) == {'name', 'avatar_url'}

    def test_user_name_is_the_display_name_not_the_real_username(self):
        """Test that the exposed author name never leaks the real username/login credential."""
        GameSessionMessage.objects.create(
            session=self.session, user=self.dm_user, content='Hello there'
        )
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        assert data[0]['user']['name'] != self.dm_user.username

    def test_returns_most_recent_first(self):
        """Test that messages are returned most-recent-first."""
        first = GameSessionMessage.objects.create(
            session=self.session, user=self.dm_user, content='First'
        )
        second = GameSessionMessage.objects.create(
            session=self.session, user=self.dm_user, content='Second'
        )
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        assert [item['id'] for item in data] == [second.id, first.id]

    def test_response_includes_next_entry_id_header(self):
        """Test that NEXT-ENTRY-ID points at the oldest message still on the returned page."""
        messages = [
            GameSessionMessage.objects.create(
                session=self.session, user=self.dm_user, content=f'Message {i}'
            )
            for i in range(PAGE_SIZE + 1)
        ]
        response = self._get(token=self.dm_token)
        oldest_on_page = messages[1]  # messages[0] is older than the whole page
        assert response['NEXT-ENTRY-ID'] == str(oldest_on_page.id)

    def test_response_has_empty_next_entry_id_when_no_older_messages_remain(self):
        """Test that NEXT-ENTRY-ID is empty when everything fits on a single page."""
        GameSessionMessage.objects.create(
            session=self.session, user=self.dm_user, content='Hello there'
        )
        response = self._get(token=self.dm_token)
        assert response['NEXT-ENTRY-ID'] == ''

    def test_response_includes_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache header."""
        response = self._get(token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_next_entry_id_query_param_returns_next_page(self):
        """Test that ?next-entry-id=<id> paginates to older messages."""
        for i in range(PAGE_SIZE + 5):
            GameSessionMessage.objects.create(
                session=self.session, user=self.dm_user, content=f'Message {i}'
            )
        first_response = self._get(token=self.dm_token)
        cursor = first_response['NEXT-ENTRY-ID']

        second_response = self._get(token=self.dm_token, query=f'?next-entry-id={cursor}')
        data = json.loads(second_response.content)

        assert data[0]['id'] == int(cursor)
        assert len(data) == 6
        assert second_response['NEXT-ENTRY-ID'] == ''

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        response = self._get(token=self.dm_token, game_slug='unknown-game')
        assert response.status_code == 404

    def test_returns_404_for_unknown_session_id(self):
        """Test that 404 is returned for a non-existent session id."""
        response = self._get(token=self.dm_token, session_id=999999)
        assert response.status_code == 404

    def test_returns_404_when_session_belongs_to_different_game(self):
        """Test that 404 is returned when session_id does not belong to game_slug."""
        response = self._get(
            token=self.dm_token, game_slug=self.other_game.game_slug, session_id=self.session.id
        )
        assert response.status_code == 404

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'session-messages-list',
            kwargs={'game_slug': 'test-game', 'session_id': self.session.id},
        )
        response = self.client.get(url, HTTP_AUTHORIZATION=f'Token {self.dm_token.key}')
        assert response.status_code == 200


class TestSessionMessagesCreateView(TestCase):
    """Tests for the POST /games/<slug>/sessions/<id>/messages.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a session, a DM, a player, a superuser, and an outsider."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.session = GameSession.objects.create(game=cls.game, title='Session One')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        UserProfileFactory(user=cls.dm_user, display_name='dm_display')
        cls.dm_player = PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)
        cls.player_user = UserFactory(username='player_user', password='secret-password')
        cls.player = PlayerFactory(name='Bob', user=cls.player_user, game=cls.game)
        cls.player_token = Token.objects.create(user=cls.player_user)
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.outsider = UserFactory(username='outsider', password='secret-password')
        cls.outsider_token = Token.objects.create(user=cls.outsider)

    def _post(self, payload, token=None, game_slug=None, session_id=None):
        """Issue a POST request to the session messages list endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        slug = game_slug or self.game.game_slug
        sid = session_id if session_id is not None else self.session.id
        url = f'/games/{slug}/sessions/{sid}/messages.json'
        return self.client.post(
            url, data=json.dumps(payload), content_type='application/json', **extra,
        )

    def test_unauthenticated_post_returns_401(self):
        """Test that a POST without a token returns 401."""
        response = self._post({'content': 'Hello there'})
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_outsider_post_returns_403(self):
        """Test that a POST from a user unrelated to the game returns 403."""
        response = self._post({'content': 'Hello there'}, token=self.outsider_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_superuser_who_is_not_a_player_or_dm_post_returns_403(self):
        """Test that a superuser with no game link cannot post (no bypass)."""
        response = self._post({'content': 'Hello there'}, token=self.superuser_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_player_can_create_message(self):
        """Test that a player of the game can create a message and receives 201."""
        response = self._post({'content': 'Hello there'}, token=self.player_token)
        assert response.status_code == 201

    def test_dm_can_create_message(self):
        """Test that the DM of the game can create a message and receives 201."""
        response = self._post({'content': 'Hello there'}, token=self.dm_token)
        assert response.status_code == 201

    def test_create_returns_message_detail(self):
        """Test that the response body contains the message payload shape."""
        response = self._post({'content': 'Hello there'}, token=self.dm_token)
        data = json.loads(response.content)
        assert data['content'] == 'Hello there'
        assert data['user']['name'] == 'dm_display'
        assert 'id' in data
        assert 'created_at' in data

    def test_missing_content_returns_400(self):
        """Test that a POST without content returns 400."""
        response = self._post({}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'content' in data['errors']

    def test_overlong_content_returns_400(self):
        """Test that a POST with content exceeding the max length returns 400."""
        response = self._post({'content': 'x' * 5001}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'content' in data['errors']

    def test_created_message_persists_to_database(self):
        """Test that the created message is persisted and linked to the session and user."""
        self._post({'content': 'Hello there'}, token=self.dm_token)
        assert GameSessionMessage.objects.filter(
            session=self.session, user=self.dm_user, content='Hello there'
        ).exists()

    def test_message_from_player_is_linked_to_player(self):
        """Test that a message posted by a player links to that Player record."""
        self._post({'content': 'Hello there'}, token=self.player_token)
        message = GameSessionMessage.objects.get(user=self.player_user)
        assert message.player == self.player

    def test_message_from_dm_has_dm_player(self):
        """Test that a message posted by the DM links its own Player record.

        Player.is_dm=True is the single source of truth for DM status, so the DM is
        always also a Player of the game.
        """
        self._post({'content': 'Hello there'}, token=self.dm_token)
        message = GameSessionMessage.objects.get(user=self.dm_user)
        assert message.player == self.dm_player

    def test_response_includes_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache header."""
        response = self._post({'content': 'Hello there'}, token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_post_returns_404_for_unknown_game_slug(self):
        """Test that POST returns 404 for a non-existent game slug."""
        response = self._post(
            {'content': 'Hello there'}, token=self.dm_token, game_slug='unknown-game',
        )
        assert response.status_code == 404
