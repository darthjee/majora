"""Tests for the GameLinkSerializer."""

from django.test import TestCase

from games.models import GameLink
from games.serializers import GameLinkSerializer
from games.tests.factories import GameFactory


class TestGameLinkSerializer(TestCase):
    """Tests for the GameLinkSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.link = GameLink.objects.create(
            text='Official Wiki', url='http://example.com/wiki', game=cls.game
        )

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = GameLinkSerializer(self.link).data
        assert data['id'] == self.link.id

    def test_serializes_text(self):
        """Test that the text field is serialized."""
        data = GameLinkSerializer(self.link).data
        assert data['text'] == 'Official Wiki'

    def test_serializes_url(self):
        """Test that the url field is serialized."""
        data = GameLinkSerializer(self.link).data
        assert data['url'] == 'http://example.com/wiki'

    def test_does_not_include_game(self):
        """Test that the game field is not exposed."""
        data = GameLinkSerializer(self.link).data
        assert 'game' not in data

    def test_serializes_link_type_when_unset(self):
        """Test that link_type serializes as an empty string when unset."""
        data = GameLinkSerializer(self.link).data
        assert data['link_type'] == ''

    def test_serializes_link_type_when_set(self):
        """Test that link_type is serialized when set."""
        self.link.link_type = GameLink.LINK_TYPE_LOOTSTUDIO
        self.link.save()
        data = GameLinkSerializer(self.link).data
        assert data['link_type'] == 'lootstudio'
