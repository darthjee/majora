"""Tests for the LinkSerializer."""

import pytest

from games.models import Link
from games.serializers import LinkSerializer
from games.tests.factories import GameFactory


@pytest.mark.django_db
class TestLinkSerializer:
    """Tests for the LinkSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.link = Link.objects.create(
            text='Official Wiki', url='http://example.com/wiki', content_object=self.game
        )

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = LinkSerializer(self.link).data
        assert data['id'] == self.link.id

    def test_serializes_text(self):
        """Test that the text field is serialized."""
        data = LinkSerializer(self.link).data
        assert data['text'] == 'Official Wiki'

    def test_serializes_url(self):
        """Test that the url field is serialized."""
        data = LinkSerializer(self.link).data
        assert data['url'] == 'http://example.com/wiki'

    def test_does_not_include_content_type(self):
        """Test that the content_type field is not exposed."""
        data = LinkSerializer(self.link).data
        assert 'content_type' not in data

    def test_serializes_link_type_when_unset(self):
        """Test that link_type serializes as an empty string when unset."""
        data = LinkSerializer(self.link).data
        assert data['link_type'] == ''

    def test_serializes_link_type_when_set(self):
        """Test that link_type is serialized when set."""
        self.link.link_type = Link.LINK_TYPE_LOOTSTUDIO
        self.link.save()
        data = LinkSerializer(self.link).data
        assert data['link_type'] == 'lootstudio'
