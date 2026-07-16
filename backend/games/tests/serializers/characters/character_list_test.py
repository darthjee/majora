"""Tests for the CharacterListSerializer."""

from django.test import TestCase

from games.models import CharacterPhoto, CharacterTreasure
from games.serializers import CharacterListSerializer
from games.tests.factories import CharacterFactory, GameFactory, TreasureFactory


class TestCharacterListSerializer(TestCase):
    """Tests for the CharacterListSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game)

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = CharacterListSerializer(self.character).data
        assert data['id'] == self.character.id

    def test_serializes_name(self):
        """Test that the name field is serialized."""
        data = CharacterListSerializer(self.character).data
        assert data['name'] == 'Frodo'

    def test_serializes_game_slug(self):
        """Test that the game_slug field is sourced from the related game."""
        data = CharacterListSerializer(self.character).data
        assert data['game_slug'] == 'test-game'

    def test_does_not_include_public_description(self):
        """Test that the public_description field is not exposed."""
        data = CharacterListSerializer(self.character).data
        assert 'public_description' not in data

    def test_serializes_profile_photo_path_as_none_when_unset(self):
        """Test that profile_photo_path is null when the character has no profile photo."""
        data = CharacterListSerializer(self.character).data
        assert data['profile_photo_path'] is None

    def test_serializes_profile_photo_path_when_set(self):
        """Test that profile_photo_path equals the profile photo's path when set."""
        photo = CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/profile.jpg', character=self.character
        )
        self.character.profile_photo = photo
        self.character.save()
        data = CharacterListSerializer(self.character).data
        assert data['profile_photo_path'] == 'photos/games/test-game/characters/1/profile.jpg'

    def test_serializes_slain_as_false_by_default(self):
        """Test that slain defaults to False."""
        data = CharacterListSerializer(self.character).data
        assert data['slain'] is False

    def test_serializes_slain_as_true_when_set(self):
        """Test that slain reflects the model value when True."""
        self.character.public_slain = True
        self.character.save()
        data = CharacterListSerializer(self.character).data
        assert data['slain'] is True

    def test_serializes_slain_sourced_from_public_slain(self):
        """Test that slain is sourced from public_slain, not the real field."""
        self.character.slain = True
        self.character.public_slain = False
        self.character.save()
        data = CharacterListSerializer(self.character).data
        assert data['slain'] is False

    def test_serializes_allegiance_as_neutral_by_default(self):
        """Test that allegiance defaults to 'neutral'."""
        data = CharacterListSerializer(self.character).data
        assert data['allegiance'] == 'neutral'

    def test_serializes_allegiance_sourced_from_public_allegiance(self):
        """Test that allegiance is sourced from public_allegiance, not the real field."""
        self.character.allegiance = 'enemy'
        self.character.public_allegiance = 'ally'
        self.character.save()
        data = CharacterListSerializer(self.character).data
        assert data['allegiance'] == 'ally'

    def test_serializes_treasure_value_as_zero_when_no_treasures(self):
        """Test that treasure_value is 0 for a character with no treasure rows."""
        data = CharacterListSerializer(self.character).data
        assert data['treasure_value'] == 0

    def test_serializes_treasure_value_summed_across_treasures(self):
        """Test that treasure_value sums total_value across the character's treasure rows."""
        treasure_one = TreasureFactory(name='Potion', value=50)
        treasure_two = TreasureFactory(name='Sword', value=100)
        CharacterTreasure.objects.create(
            character=self.character, treasure=treasure_one, quantity=2, total_value=100,
        )
        CharacterTreasure.objects.create(
            character=self.character, treasure=treasure_two, quantity=1, total_value=100,
        )
        data = CharacterListSerializer(self.character).data
        assert data['treasure_value'] == 200

    def test_serializes_treasure_value_from_annotation_when_present(self):
        """Test that treasure_value uses the queryset annotation instead of recomputing."""
        treasure = TreasureFactory(name='Potion', value=50)
        CharacterTreasure.objects.create(
            character=self.character, treasure=treasure, quantity=2, total_value=100,
        )
        self.character.treasure_value = 999
        data = CharacterListSerializer(self.character).data
        assert data['treasure_value'] == 999
