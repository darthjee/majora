"""Tests for the CharacterLink model."""

from django.test import TestCase

from games.models import CharacterLink
from games.tests.factories import CharacterFactory, GameFactory


class TestCharacterLink(TestCase):
    """Tests for the CharacterLink model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game)

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

    def test_character_link_creation_with_link_type(self):
        """Test that a character link can be created with a link_type set."""
        link = CharacterLink.objects.create(
            text='LootStudio Loot',
            url='http://example.com/loot',
            character=self.character,
            link_type=CharacterLink.LINK_TYPE_LOOTSTUDIO,
        )
        assert link.link_type == 'lootstudio'

    def test_character_link_creation_with_link_type_diary(self):
        """Test that a character link can be created with the diary link_type."""
        link = CharacterLink.objects.create(
            text='Frodo Diary',
            url='http://example.com/diary',
            character=self.character,
            link_type=CharacterLink.LINK_TYPE_DIARY,
        )
        assert link.link_type == 'diary'

    def test_character_link_creation_with_link_type_music(self):
        """Test that a character link can be created with the music link_type."""
        link = CharacterLink.objects.create(
            text='Theme Song',
            url='http://example.com/music',
            character=self.character,
            link_type=CharacterLink.LINK_TYPE_MUSIC,
        )
        assert link.link_type == 'music'

    def test_character_link_creation_with_link_type_stl(self):
        """Test that a character link can be created with the stl link_type."""
        link = CharacterLink.objects.create(
            text='Mini Model',
            url='http://example.com/model.stl',
            character=self.character,
            link_type=CharacterLink.LINK_TYPE_STL,
        )
        assert link.link_type == 'stl'

    def test_character_link_creation_with_link_type_background(self):
        """Test that a character link can be created with the background link_type."""
        link = CharacterLink.objects.create(
            text='World Lore',
            url='http://example.com/lore',
            character=self.character,
            link_type=CharacterLink.LINK_TYPE_BACKGROUND,
        )
        assert link.link_type == 'background'

    def test_character_link_creation_with_link_type_reference(self):
        """Test that a character link can be created with the reference link_type."""
        link = CharacterLink.objects.create(
            text='Rules Reference',
            url='http://example.com/reference',
            character=self.character,
            link_type=CharacterLink.LINK_TYPE_REFERENCE,
        )
        assert link.link_type == 'reference'

    def test_character_link_default_link_type_is_blank(self):
        """Test that link_type defaults to an empty string when not set."""
        link = CharacterLink.objects.create(
            text='Character Wiki',
            url='http://example.com/frodo',
            character=self.character,
        )
        assert link.link_type == ''

    def test_character_link_str(self):
        """Test that str() of a character link returns the text field."""
        link = CharacterLink(
            text='Backstory',
            url='http://example.com/backstory',
            character=self.character,
        )
        assert str(link) == 'Backstory'
