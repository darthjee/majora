"""Tests for the CharacterDetailSerializer."""

from django.contrib.auth.models import AnonymousUser
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from games.models import CharacterLink, CharacterPhoto, CharacterTreasure
from games.serializers import CharacterDetailSerializer
from games.tests.factories import CharacterFactory, GameFactory, TreasureFactory


class TestCharacterDetailSerializer(TestCase):
    """Tests for the CharacterDetailSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(
            name='Frodo',
            game=cls.game,
            role='Hobbit',
            public_description='A brave hobbit.',
            private_description='Secretly carries the ring.',
            npc=False,
        )
        cls.factory = APIRequestFactory()

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

    def test_serializes_role(self):
        """Test that the role field is serialized."""
        data = self._serialize()
        assert data['role'] == 'Hobbit'

    def test_serializes_role_as_none_when_not_set(self):
        """Test that role is null when the character has no role."""
        self.character.role = None
        self.character.save()
        data = self._serialize()
        assert data['role'] is None

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

    def test_does_not_include_can_edit(self):
        """Test that can_edit is not exposed (moved to permissions.json)."""
        data = self._serialize()
        assert 'can_edit' not in data

    def test_does_not_include_can_edit_money(self):
        """Test that can_edit_money is not exposed (moved to permissions.json)."""
        data = self._serialize()
        assert 'can_edit_money' not in data

    def test_does_not_include_can_exchange_treasure(self):
        """Test that can_exchange_treasure is not exposed (moved to permissions.json)."""
        data = self._serialize()
        assert 'can_exchange_treasure' not in data

    def test_does_not_include_can_set_profile_photo(self):
        """Test that can_set_profile_photo is not exposed (moved to permissions.json)."""
        data = self._serialize()
        assert 'can_set_profile_photo' not in data

    def test_does_not_include_can_delete_photo(self):
        """Test that can_delete_photo is not exposed (moved to permissions.json)."""
        data = self._serialize()
        assert 'can_delete_photo' not in data

    def test_serializes_profile_photo_path_as_none_when_unset(self):
        """Test that profile_photo_path is null when the character has no profile photo."""
        data = self._serialize()
        assert data['profile_photo_path'] is None

    def test_serializes_profile_photo_path_when_set(self):
        """Test that profile_photo_path equals the profile photo's path when set."""
        photo = CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/profile.jpg', character=self.character
        )
        self.character.profile_photo = photo
        self.character.save()
        data = self._serialize()
        assert data['profile_photo_path'] == 'photos/games/test-game/characters/1/profile.jpg'

    def test_serializes_profile_photo_id_as_none_when_unset(self):
        """Test that profile_photo_id is null when the character has no profile photo."""
        data = self._serialize()
        assert data['profile_photo_id'] is None

    def test_serializes_profile_photo_id_when_set(self):
        """Test that profile_photo_id equals the profile photo's id when set."""
        photo = CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/profile.jpg', character=self.character
        )
        self.character.profile_photo = photo
        self.character.save()
        data = self._serialize()
        assert data['profile_photo_id'] == photo.id

    def test_serializes_money(self):
        """Test that the money field is serialized."""
        self.character.money = 150
        self.character.save()
        data = self._serialize()
        assert data['money'] == 150

    def test_serializes_public_slain_as_false_by_default(self):
        """Test that public_slain defaults to False."""
        data = self._serialize()
        assert data['public_slain'] is False

    def test_serializes_public_slain_as_true_when_set(self):
        """Test that public_slain reflects the model value when True."""
        self.character.public_slain = True
        self.character.save()
        data = self._serialize()
        assert data['public_slain'] is True

    def test_does_not_include_private_slain(self):
        """Test that the private_slain field is not exposed."""
        data = self._serialize()
        assert 'private_slain' not in data

    def test_serializes_public_allegiance_as_neutral_by_default(self):
        """Test that public_allegiance defaults to 'neutral'."""
        data = self._serialize()
        assert data['public_allegiance'] == 'neutral'

    def test_serializes_public_allegiance_as_set(self):
        """Test that public_allegiance reflects the model value when set."""
        self.character.public_allegiance = 'ally'
        self.character.save()
        data = self._serialize()
        assert data['public_allegiance'] == 'ally'

    def test_does_not_include_private_allegiance(self):
        """Test that the private_allegiance field is not exposed."""
        data = self._serialize()
        assert 'private_allegiance' not in data

    def test_serializes_treasure_value_as_zero_when_no_treasures(self):
        """Test that treasure_value is 0 for a character with no treasure rows."""
        data = self._serialize()
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
        data = self._serialize()
        assert data['treasure_value'] == 200
