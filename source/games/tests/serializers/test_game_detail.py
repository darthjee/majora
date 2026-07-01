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
            photo='http://example.com/cover.png',
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

    def test_serializes_photo(self):
        """Test that the photo field is serialized."""
        data = GameDetailSerializer(self.game).data
        assert data['photo'] == 'http://example.com/cover.png'

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
        """Test that nested photos are serialized with id and url fields."""
        GamePhoto.objects.create(url='http://example.com/img1.jpg', game=self.game)
        GamePhoto.objects.create(url='http://example.com/img2.jpg', game=self.game)
        data = GameDetailSerializer(self.game).data
        assert len(data['photos']) == 2
        urls = [photo['url'] for photo in data['photos']]
        assert 'http://example.com/img1.jpg' in urls
        assert 'http://example.com/img2.jpg' in urls
        for photo in data['photos']:
            assert 'id' in photo
            assert 'url' in photo
