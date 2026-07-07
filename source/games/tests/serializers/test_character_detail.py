"""Tests for the CharacterDetailSerializer."""

import pytest
from django.contrib.auth.models import AnonymousUser
from rest_framework.test import APIRequestFactory

from games.models import CharacterLink, CharacterPhoto
from games.serializers import CharacterDetailSerializer
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    GameMasterFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestCharacterDetailSerializer:
    """Tests for the CharacterDetailSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(
            name='Frodo',
            game=self.game,
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

    def test_serializes_empty_photos(self):
        """Test that photos is an empty list when the character has no photos."""
        data = self._serialize()
        assert data['photos'] == []

    def test_serializes_nested_photos(self):
        """Test that nested photos are serialized with an id field."""
        photo1 = CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/img1.jpg', character=self.character
        )
        photo2 = CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/img2.jpg', character=self.character
        )
        data = self._serialize()
        assert len(data['photos']) == 2
        ids = [photo['id'] for photo in data['photos']]
        assert photo1.id in ids
        assert photo2.id in ids

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
        superuser = SuperUserFactory(username='admin', password='secret-password')
        data = self._serialize(superuser)
        assert data['can_edit'] is True

    def test_can_edit_is_true_for_connected_player_user(self):
        """Test that can_edit is true for the user linked to the character's player."""
        user = UserFactory(username='owner', password='secret-password')
        player = PlayerFactory(name='Owner', user=user)
        self.character.player = player
        self.character.save()
        data = self._serialize(user)
        assert data['can_edit'] is True

    def test_can_edit_is_true_for_game_master(self):
        """Test that can_edit is true for a DM of the character's game."""
        dm_user = UserFactory(username='dm', password='secret-password')
        GameMasterFactory(game=self.game, user=dm_user)
        data = self._serialize(dm_user)
        assert data['can_edit'] is True

    def test_can_edit_is_false_for_unrelated_user(self):
        """Test that can_edit is false for an unrelated authenticated user."""
        other_user = UserFactory(username='other', password='secret-password')
        data = self._serialize(other_user)
        assert data['can_edit'] is False

    def test_can_edit_is_false_without_request_context(self):
        """Test that can_edit is false when no request is present in the context."""
        data = CharacterDetailSerializer(self.character, context={}).data
        assert data['can_edit'] is False

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

    def test_serializes_slain_as_false_by_default(self):
        """Test that slain defaults to False."""
        data = self._serialize()
        assert data['slain'] is False

    def test_serializes_slain_as_true_when_set(self):
        """Test that slain reflects the model value when True."""
        self.character.slain = True
        self.character.save()
        data = self._serialize()
        assert data['slain'] is True

    def test_serializes_allegiance_as_neutral_by_default(self):
        """Test that allegiance defaults to 'neutral'."""
        data = self._serialize()
        assert data['allegiance'] == 'neutral'

    def test_serializes_allegiance_sourced_from_public_allegiance(self):
        """Test that allegiance is sourced from public_allegiance, not the real field."""
        self.character.allegiance = 'enemy'
        self.character.public_allegiance = 'ally'
        self.character.save()
        data = self._serialize()
        assert data['allegiance'] == 'ally'
