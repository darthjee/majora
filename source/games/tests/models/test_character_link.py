"""Tests for the CharacterLink model."""

import pytest

from games.models import CharacterLink
from games.tests.factories import CharacterFactory, GameFactory


@pytest.mark.django_db
class TestCharacterLink:
    """Tests for the CharacterLink model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Frodo', game=self.game)

    def test_character_link_creation(self):
        """Test that a character link can be created with text, url, and character FK."""
        link = CharacterLink.objects.create(
            text='Character Wiki',
            url='http://example.com/frodo',
            character=self.character,
        )
        assert link.text == 'Character Wiki'
        assert link.url == 'http://example.com/frodo'
        assert link.character == self.character

    def test_character_link_str(self):
        """Test that str() of a character link returns the text field."""
        link = CharacterLink(
            text='Backstory',
            url='http://example.com/backstory',
            character=self.character,
        )
        assert str(link) == 'Backstory'
