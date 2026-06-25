"""Tests for the CharacterEditPermission class."""

import pytest
from django.contrib.auth.models import AnonymousUser, User
from rest_framework.test import APIRequestFactory

from games.models import Character, Game, GameMaster, Player
from games.permissions import CharacterEditPermission


def _make_request(user):
    """Build a fake GET request carrying the given `user`."""
    factory = APIRequestFactory()
    request = factory.get('/fake/')
    request.user = user
    return request


@pytest.mark.django_db
class TestCharacterEditPermissionCheck:
    """Tests for CharacterEditPermission.check()."""

    def setup_method(self):
        """Set up a game, a DM, an owning player and an NPC character."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.player = Player.objects.create(name='Bob')
        self.owner = User.objects.create_user(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.character = Character.objects.create(
            name='Aragorn', game=self.game, player=self.player, npc=False
        )

    def test_returns_401_response_for_anonymous_user(self):
        """Test that an anonymous user gets a 401 error response."""
        request = _make_request(AnonymousUser())
        response = CharacterEditPermission.check(request, self.character)
        assert response.status_code == 401
        assert response.data == {'errors': {'detail': ['authentication required']}}

    def test_returns_401_response_for_none_user(self):
        """Test that a None user gets a 401 error response."""
        request = _make_request(None)
        response = CharacterEditPermission.check(request, self.character)
        assert response.status_code == 401

    def test_returns_403_response_for_non_editor(self):
        """Test that an authenticated non-editor gets a 403 error response."""
        other_user = User.objects.create_user(username='other', password='secret-password')
        request = _make_request(other_user)
        response = CharacterEditPermission.check(request, self.character)
        assert response.status_code == 403
        assert response.data == {'errors': {'detail': ['not allowed']}}

    def test_returns_none_for_owning_player(self):
        """Test that the character's owning player passes the check."""
        request = _make_request(self.owner)
        assert CharacterEditPermission.check(request, self.character) is None

    def test_returns_none_for_dm(self):
        """Test that a DM of the game passes the check."""
        request = _make_request(self.dm_user)
        assert CharacterEditPermission.check(request, self.character) is None

    def test_returns_none_for_superuser(self):
        """Test that a superuser passes the check."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        request = _make_request(superuser)
        assert CharacterEditPermission.check(request, self.character) is None
