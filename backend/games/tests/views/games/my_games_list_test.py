"""Tests for the my-games list view."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    ConversationFactory,
    ConversationParticipantFactory,
    GameFactory,
    MessageFactory,
    MessageVisualisationFactory,
    PlayerFactory,
    UserFactory,
)

MY_GAMES_URL = '/my-games.json'


@pytest.mark.django_db
class TestMyGamesListView(TokenAuthRequestMixin):
    """Tests for GET /my-games.json."""

    def setup_method(self):
        """Set up a requesting user and a token for it."""
        self.user = UserFactory(username='alice', password='secret-password')
        self.token = Token.objects.create(user=self.user)

    def test_unauthenticated_returns_401(self, client):
        """Test that an unauthenticated request returns 401."""
        response = self.get(client, MY_GAMES_URL)
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_returns_empty_list_when_user_has_no_games(self, client):
        """Test that a user with no Player rows gets an empty list."""
        response = self.get(client, MY_GAMES_URL, token=self.token)
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_dm_item_has_null_character(self, client):
        """Test that a DM's item reports role 'dm' and a null character."""
        game = GameFactory(name='Curse of Strahd', game_slug='curse-of-strahd')
        PlayerFactory(game=game, user=self.user, is_dm=True)
        response = self.get(client, MY_GAMES_URL, token=self.token)
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['role'] == 'dm'
        assert data[0]['character'] is None
        assert data[0]['game'] == {
            'name': 'Curse of Strahd',
            'game_slug': 'curse-of-strahd',
            'cover_photo_path': None,
        }

    def test_player_with_no_character_has_null_character(self, client):
        """Test that a player who owns no PC yet gets a null character."""
        game = GameFactory(game_slug='no-pc-game')
        PlayerFactory(game=game, user=self.user, is_dm=False)
        response = self.get(client, MY_GAMES_URL, token=self.token)
        data = json.loads(response.content)
        assert data[0]['role'] == 'player'
        assert data[0]['character'] is None

    def test_player_with_character_gets_it_serialized(self, client):
        """Test that a player's owned PC is serialized as {name, photo_url}."""
        game = GameFactory(game_slug='pc-game')
        player = PlayerFactory(game=game, user=self.user, is_dm=False)
        character = CharacterFactory(game=game, name='Aramil', npc=False)
        player.characters.add(character)
        response = self.get(client, MY_GAMES_URL, token=self.token)
        data = json.loads(response.content)
        assert data[0]['character'] == {'name': 'Aramil', 'photo_url': None}

    def test_conversations_default_to_zero(self, client):
        """Test that a game with no followed conversations reports zero counts."""
        game = GameFactory(game_slug='quiet-game')
        PlayerFactory(game=game, user=self.user, is_dm=True)
        response = self.get(client, MY_GAMES_URL, token=self.token)
        data = json.loads(response.content)
        assert data[0]['conversations'] == {'count': 0, 'unread_count': 0}

    def test_conversation_count_across_multiple_games(self, client):
        """Test that conversation counts are bucketed correctly per game."""
        game_one = GameFactory(game_slug='game-one')
        game_two = GameFactory(game_slug='game-two')
        player_one = PlayerFactory(game=game_one, user=self.user, is_dm=True)
        player_two = PlayerFactory(game=game_two, user=self.user, is_dm=True)

        other_user = UserFactory(username='other', password='secret-password')
        other_player_one = PlayerFactory(game=game_one, user=other_user, is_dm=False)

        shared_conversation = ConversationFactory(owner=player_one)
        ConversationParticipantFactory(conversation=shared_conversation, player=player_one)
        ConversationParticipantFactory(conversation=shared_conversation, player=other_player_one)

        game_two_only_conversation = ConversationFactory(owner=player_two)
        ConversationParticipantFactory(conversation=game_two_only_conversation, player=player_two)

        response = self.get(client, MY_GAMES_URL, token=self.token)
        data = json.loads(response.content)
        by_slug = {item['game']['game_slug']: item['conversations'] for item in data}
        assert by_slug['game-one'] == {'count': 1, 'unread_count': 0}
        assert by_slug['game-two'] == {'count': 1, 'unread_count': 0}

    def test_unread_count_only_counts_unseen_messages_for_the_user(self, client):
        """Test that unread_count only reflects the requesting user's unseen messages."""
        game = GameFactory(game_slug='chat-game')
        player = PlayerFactory(game=game, user=self.user, is_dm=True)
        conversation = ConversationFactory(owner=player)
        ConversationParticipantFactory(conversation=conversation, player=player)
        message = MessageFactory(conversation=conversation, player=player)
        MessageVisualisationFactory(message=message, player=player, not_seen=True)

        response = self.get(client, MY_GAMES_URL, token=self.token)
        data = json.loads(response.content)
        assert data[0]['conversations'] == {'count': 1, 'unread_count': 1}

    def test_seen_messages_do_not_count_as_unread(self, client):
        """Test that a conversation with only seen messages reports unread_count 0."""
        game = GameFactory(game_slug='seen-game')
        player = PlayerFactory(game=game, user=self.user, is_dm=True)
        conversation = ConversationFactory(owner=player)
        ConversationParticipantFactory(conversation=conversation, player=player)
        message = MessageFactory(conversation=conversation, player=player)
        MessageVisualisationFactory(message=message, player=player, not_seen=False)

        response = self.get(client, MY_GAMES_URL, token=self.token)
        data = json.loads(response.content)
        assert data[0]['conversations'] == {'count': 1, 'unread_count': 0}

    def test_does_not_include_games_the_user_is_not_a_player_in(self, client):
        """Test that games the user has no Player row in are excluded."""
        GameFactory(game_slug='unrelated-game')
        response = self.get(client, MY_GAMES_URL, token=self.token)
        assert json.loads(response.content) == []

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('my-games-list')
        response = self.get(client, url, token=self.token)
        assert response.status_code == 200

    def test_url_by_name_matches_expected_path(self, client):
        """Test that the my-games-list URL name resolves to /my-games.json."""
        assert reverse('my-games-list') == '/my-games.json'
