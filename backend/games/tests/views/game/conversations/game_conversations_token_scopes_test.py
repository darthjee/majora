"""End-to-end tests for the `@token_scopes` declaration of the conversations view (#1630)."""

import pytest
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from games.tests.factories import (
    ConversationFactory,
    ConversationParticipantFactory,
    GameFactory,
)
from games.tests.views.game._scoped_token_fixtures import ScopedTokenMixin

CONVERSATION_SCOPES = ['conversations:read', 'players:read']


@pytest.mark.django_db
class TestGameConversationsTokenScopes(ScopedTokenMixin):
    """conversations.json needs both `conversations:read` and `players:read`."""

    def setup_method(self):
        """Set up a game with two players sharing a conversation, and another game."""
        self.client = APIClient()
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.other_game = GameFactory(name='Other Game', game_slug='other-game')
        self.alice = self._member('alice')
        self.bob = self._member('bob')
        self.conversation = ConversationFactory(title='Shared Chat', owner=self.alice)
        ConversationParticipantFactory(conversation=self.conversation, player=self.alice)
        ConversationParticipantFactory(conversation=self.conversation, player=self.bob)

    def _url(self):
        """Return the conversations.json URL shared with bob."""
        return f'/games/test-game/conversations.json?player_id={self.bob.id}'

    def _get_as_alice(self, scopes, games=None):
        """GET the conversations list as alice with `scopes` and an optional game list."""
        return self._get(self._url(), self.alice.user, scopes, games)

    def test_both_scopes_are_allowed(self):
        """Test that conversations.json with both read scopes lists the shared conversation."""
        response = self._get_as_alice(CONVERSATION_SCOPES)
        assert response.status_code == 200
        assert [item['id'] for item in response.json()] == [self.conversation.id]

    def test_without_conversations_read_is_refused(self):
        """Test that conversations.json without `conversations:read` gives `scope_missing`."""
        self._assert_refused(self._get_as_alice(['players:read']), 'scope_missing')

    def test_without_players_read_is_refused(self):
        """Test that conversations.json without `players:read` gives `scope_missing`."""
        self._assert_refused(self._get_as_alice(['conversations:read']), 'scope_missing')

    def test_token_limited_to_another_game_is_refused(self):
        """Test that a token limited to another game gives `game_not_allowed`."""
        response = self._get_as_alice(CONVERSATION_SCOPES, games=[self.other_game])
        self._assert_refused(response, 'game_not_allowed')

    def test_legacy_token_is_unaffected(self):
        """Test that alice's legacy Token still lists the shared conversation."""
        token = Token.objects.create(user=self.alice.user)
        response = self.client.get(self._url(), HTTP_AUTHORIZATION=f'Token {token.key}')
        assert response.status_code == 200
