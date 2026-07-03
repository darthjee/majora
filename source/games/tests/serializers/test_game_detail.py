"""Tests for the GameDetailSerializer."""

import pytest

from games.models import Game, GamePhoto, Link
from games.serializers import GameDetailSerializer


@pytest.mark.django_db
class TestGameDetailSerializer:

    """Tests for the GameDetailSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(
            name='Test Game',
            game_slug='test-game',
            description='A grand adventure.',
        )

    def test_serializes_name(self):
        """Test that the name field is serialized."""
        data = GameDetailSerializer(self.game).data
        assert data['name'] == 'Test Game'

    def test_serializes_game_slug(self):
        """Test that the game_slug field is serialized."""
        data = GameDetailSerializer(self.game).data
        assert data['game_slug'] == 'test-game'

    def test_serializes_description(self):
        """Test that the description field is serialized."""
        data = GameDetailSerializer(self.game).data
        assert data['description'] == 'A grand adventure.'

    def test_serializes_empty_links(self):
        """Test that links is an empty list when the game has no links."""
        data = GameDetailSerializer(self.game).data
        assert data['links'] == []

    def test_serializes_nested_links(self):
        """Test that nested links are serialized with their fields."""
        Link.objects.create(text='Wiki', url='http://example.com/wiki', content_object=self.game)
        Link.objects.create(text='Forum', url='http://example.com/forum', content_object=self.game)
        data = GameDetailSerializer(self.game).data
        assert len(data['links']) == 2
        texts = [link['text'] for link in data['links']]
        assert 'Wiki' in texts
        assert 'Forum' in texts

    def test_serializes_empty_photos(self):
        """Test that photos is an empty list when the game has no photos."""
        data = GameDetailSerializer(self.game).data
        assert data['photos'] == []

    def test_serializes_nested_photos(self):
        """Test that nested photos are serialized with an id field."""
        photo1 = GamePhoto.objects.create(path='photos/games/test-game/img1.jpg', game=self.game)
        photo2 = GamePhoto.objects.create(path='photos/games/test-game/img2.jpg', game=self.game)
        data = GameDetailSerializer(self.game).data
        assert len(data['photos']) == 2
        ids = [photo['id'] for photo in data['photos']]
        assert photo1.id in ids
        assert photo2.id in ids

    def test_serializes_cover_photo_path_as_none_when_unset(self):
        """Test that cover_photo_path is null when the game has no cover photo."""
        data = GameDetailSerializer(self.game).data
        assert data['cover_photo_path'] is None

    def test_serializes_cover_photo_path_when_set(self):
        """Test that cover_photo_path equals the cover photo's path when set."""
        photo = GamePhoto.objects.create(path='photos/games/test-game/cover.jpg', game=self.game)
        self.game.cover_photo = photo
        self.game.save()
        data = GameDetailSerializer(self.game).data
        assert data['cover_photo_path'] == 'photos/games/test-game/cover.jpg'
