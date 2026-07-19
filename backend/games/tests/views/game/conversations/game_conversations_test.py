"""Tests for the game conversations list view."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.factories import (
    ConversationFactory,
    ConversationParticipantFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


class TestGameConversationsView(TestCase):
    """Tests for the GET /games/<slug>/conversations.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, two players sharing a conversation, and a third who does not."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')

        cls.player_user = UserFactory(username='player_user', password='secret-password')
        cls.player = PlayerFactory(name='Alice', game=cls.game, user=cls.player_user)
        cls.player_token = Token.objects.create(user=cls.player_user)

        cls.other_player_user = UserFactory(
            username='other_player_user', password='secret-password',
        )
        cls.other_player = PlayerFactory(
            name='Bob', game=cls.game, user=cls.other_player_user,
        )

        cls.third_player = PlayerFactory(name='Carol', game=cls.game)

        cls.shared_conversation = ConversationFactory(title='Shared Chat', owner=cls.player)
        ConversationParticipantFactory(conversation=cls.shared_conversation, player=cls.player)
        ConversationParticipantFactory(
            conversation=cls.shared_conversation, player=cls.other_player,
        )

        cls.solo_conversation = ConversationFactory(title='Solo Chat', owner=cls.player)
        ConversationParticipantFactory(conversation=cls.solo_conversation, player=cls.player)
        ConversationParticipantFactory(conversation=cls.solo_conversation, player=cls.third_player)

        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.staff_user = UserFactory(
            username='staff_user', password='secret-password', is_staff=True,
        )
        cls.staff_token = Token.objects.create(user=cls.staff_user)
        cls.outsider = UserFactory(username='outsider', password='secret-password')
        cls.outsider_token = Token.objects.create(user=cls.outsider)

    def _get(self, token=None, game_slug=None, player_id=None, query=None):
        """Issue a GET request to the game conversations list endpoint."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        game_slug = game_slug or self.game.game_slug
        if query is None:
            player_id = self.other_player.id if player_id is None else player_id
            query = f'?player_id={player_id}'
        url = f'/games/{game_slug}/conversations.json{query}'
        return self.client.get(url, **extra)

    def test_unauthenticated_get_returns_401(self):
        """Test that a GET without a token returns 401."""
        response = self._get()
        assert response.status_code == 401

    def test_outsider_get_returns_403(self):
        """Test that a GET from a user unrelated to the game returns 403."""
        response = self._get(token=self.outsider_token)
        assert response.status_code == 403

    def test_superuser_get_returns_403(self):
        """Test that a superuser with no game link gets 403 (no bypass, issue #695)."""
        response = self._get(token=self.superuser_token)
        assert response.status_code == 403

    def test_staff_get_returns_403(self):
        """Test that a staff user with no game link gets 403 (no bypass, issue #695)."""
        response = self._get(token=self.staff_token)
        assert response.status_code == 403

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        response = self._get(token=self.player_token, game_slug='unknown-game')
        assert response.status_code == 404

    def test_missing_player_id_returns_400(self):
        """Test that a missing player_id query param returns 400."""
        response = self._get(token=self.player_token, query='')
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'player_id' in data['errors']

    def test_invalid_player_id_returns_400(self):
        """Test that a non-numeric player_id query param returns 400."""
        response = self._get(token=self.player_token, query='?player_id=not-a-number')
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'player_id' in data['errors']

    def test_unknown_player_id_returns_404(self):
        """Test that an unknown numeric player_id returns 404."""
        response = self._get(token=self.player_token, player_id=999999)
        assert response.status_code == 404

    def test_cross_game_player_id_returns_404(self):
        """Test that a player_id belonging to a different game returns 404."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_game_player = PlayerFactory(name='Dave', game=other_game)
        response = self._get(token=self.player_token, player_id=other_game_player.id)
        assert response.status_code == 404

    def test_returns_only_conversations_both_players_share(self):
        """Test that only the conversation both players participate in is returned."""
        response = self._get(token=self.player_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == self.shared_conversation.id

    def test_excludes_conversation_only_requester_is_in(self):
        """Test that a conversation the target player doesn't participate in is excluded."""
        response = self._get(token=self.player_token)
        data = json.loads(response.content)
        returned_ids = [item['id'] for item in data]
        assert self.solo_conversation.id not in returned_ids

    def test_returns_expected_fields(self):
        """Test that list items include only id, title."""
        response = self._get(token=self.player_token)
        data = json.loads(response.content)
        assert set(data[0].keys()) == {'id', 'title'}

    def test_response_includes_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache header."""
        response = self._get(token=self.player_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_response_includes_page_header(self):
        """Test that the response includes the page header."""
        response = self._get(token=self.player_token)
        assert response['page'] == '1'

    def test_respects_per_page_param(self):
        """Test that ?per_page=N limits the number of results returned."""
        second_shared_conversation = ConversationFactory(title='Second Shared Chat')
        ConversationParticipantFactory(
            conversation=second_shared_conversation, player=self.player,
        )
        ConversationParticipantFactory(
            conversation=second_shared_conversation, player=self.other_player,
        )
        response = self._get(
            token=self.player_token,
            query=f'?player_id={self.other_player.id}&per_page=1',
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_ordered_most_recent_first(self):
        """Test that results are ordered by -id (most recent first)."""
        second_shared_conversation = ConversationFactory(title='Second Shared Chat')
        ConversationParticipantFactory(
            conversation=second_shared_conversation, player=self.player,
        )
        ConversationParticipantFactory(
            conversation=second_shared_conversation, player=self.other_player,
        )
        response = self._get(token=self.player_token)
        data = json.loads(response.content)
        assert [item['id'] for item in data] == [
            second_shared_conversation.id, self.shared_conversation.id,
        ]

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('game-conversations', kwargs={'game_slug': 'test-game'})
        response = self.client.get(
            f'{url}?player_id={self.other_player.id}',
            HTTP_AUTHORIZATION=f'Token {self.player_token.key}',
        )
        assert response.status_code == 200
