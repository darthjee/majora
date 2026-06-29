"""Tests for the CharacterDetailSerializer."""

import pytest
from django.contrib.auth.models import AnonymousUser, User
from rest_framework.test import APIRequestFactory

from games.models import Character, CharacterLink, Game, GameMaster, Photo, Player
from games.serializers import CharacterDetailSerializer


@pytest.mark.django_db
class TestCharacterDetailSerializer:
    """Tests for the CharacterDetailSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.character = Character.objects.create(
            name='Frodo',
            game=self.game,
            avatar_url='http://example.com/frodo.png',
            role='Hobbit',
            public_description='A brave hobbit.',
            private_description='Secretly carries the ring.',
            npc=False,
        )
        self.factory = APIRequestFactory()

    def _serialize(self, user=None):
        """Build a request with the given user and serialize the character."""
        request = self.factory.get('/')
        request.user = user if user is not None else AnonymousUser()
        return CharacterDetailSerializer(self.character, context={'request': request}).data

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = self._serialize()
        assert data['id'] == self.character.id

    def test_serializes_name(self):
        """Test that the name field is serialized."""
        data = self._serialize()
        assert data['name'] == 'Frodo'

    def test_serializes_avatar_url(self):
        """Test that the avatar_url field is serialized."""
        data = self._serialize()
        assert data['avatar_url'] == 'http://example.com/frodo.png'

    def test_serializes_role(self):
        """Test that the role field is serialized."""
        data = self._serialize()
        assert data['role'] == 'Hobbit'

    def test_serializes_public_description(self):
        """Test that the public_description field is serialized."""
        data = self._serialize()
        assert data['public_description'] == 'A brave hobbit.'

    def test_serializes_is_pc(self):
        """Test that the is_pc property is serialized."""
        data = self._serialize()
        assert data['is_pc'] is True

    def test_serializes_game_slug(self):
        """Test that the game_slug field is sourced from the related game."""
        data = self._serialize()
        assert data['game_slug'] == 'test-game'

    def test_serializes_empty_photos(self):
        """Test that photos is an empty list when the character has no photos."""
        data = self._serialize()
        assert data['photos'] == []

    def test_serializes_nested_photos(self):
        """Test that nested photos are serialized with their fields."""
        Photo.objects.create(url='http://example.com/1.png', character=self.character)
        Photo.objects.create(url='http://example.com/2.png', character=self.character)
        data = self._serialize()
        assert len(data['photos']) == 2
        urls = [photo['url'] for photo in data['photos']]
        assert 'http://example.com/1.png' in urls
        assert 'http://example.com/2.png' in urls

    def test_serializes_empty_links(self):
        """Test that links is an empty list when the character has no links."""
        data = self._serialize()
        assert data['links'] == []

    def test_serializes_nested_links(self):
        """Test that nested links are serialized with their fields."""
        CharacterLink.objects.create(
            text='Wiki', url='http://example.com/wiki', character=self.character
        )
        CharacterLink.objects.create(
            text='Map', url='http://example.com/map', character=self.character
        )
        data = self._serialize()
        assert len(data['links']) == 2
        texts = [link['text'] for link in data['links']]
        assert 'Wiki' in texts
        assert 'Map' in texts

    def test_does_not_include_private_description(self):
        """Test that the private_description field is not exposed."""
        data = self._serialize()
        assert 'private_description' not in data

    def test_can_edit_is_false_for_anonymous_user(self):
        """Test that can_edit is false for an anonymous user."""
        data = self._serialize(AnonymousUser())
        assert data['can_edit'] is False

    def test_can_edit_is_true_for_superuser(self):
        """Test that can_edit is true for a superuser."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        data = self._serialize(superuser)
        assert data['can_edit'] is True

    def test_can_edit_is_true_for_connected_player_user(self):
        """Test that can_edit is true for the user linked to the character's player."""
        user = User.objects.create_user(username='owner', password='secret-password')
        player = Player.objects.create(name='Owner', user=user)
        self.character.player = player
        self.character.save()
        data = self._serialize(user)
        assert data['can_edit'] is True

    def test_can_edit_is_true_for_game_master(self):
        """Test that can_edit is true for a DM of the character's game."""
        dm_user = User.objects.create_user(username='dm', password='secret-password')
        GameMaster.objects.create(game=self.game, user=dm_user)
        data = self._serialize(dm_user)
        assert data['can_edit'] is True

    def test_can_edit_is_false_for_unrelated_user(self):
        """Test that can_edit is false for an unrelated authenticated user."""
        other_user = User.objects.create_user(username='other', password='secret-password')
        data = self._serialize(other_user)
        assert data['can_edit'] is False

    def test_can_edit_is_false_without_request_context(self):
        """Test that can_edit is false when no request is present in the context."""
        data = CharacterDetailSerializer(self.character, context={}).data
        assert data['can_edit'] is False
