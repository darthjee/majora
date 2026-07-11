"""Tests for the CharacterEditPermission and GameEditPermission classes."""

import pytest
from django.contrib.auth.models import AnonymousUser
from rest_framework.test import APIRequestFactory

from games.models import Task
from games.permissions import (
    CharacterEditPermission,
    GameEditPermission,
    NpcPlayerEditPermission,
    TaskEditPermission,
)
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    GameMasterFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


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
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.player = PlayerFactory(name='Bob')
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.character = CharacterFactory(
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
        other_user = UserFactory(username='other', password='secret-password')
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
        superuser = SuperUserFactory(username='admin', password='secret-password')
        request = _make_request(superuser)
        assert CharacterEditPermission.check(request, self.character) is None


@pytest.mark.django_db
class TestNpcPlayerEditPermissionCheck:
    """Tests for NpcPlayerEditPermission.check()."""

    def setup_method(self):
        """Set up a game, a DM, a player of the game, and an NPC."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.player_user = UserFactory(username='player_user', password='secret-password')
        self.player = PlayerFactory(name='Bob', user=self.player_user)
        self.player.games.add(self.game)
        self.npc = CharacterFactory(name='Gandalf', game=self.game, npc=True)

    def test_returns_401_response_for_anonymous_user(self):
        """Test that an anonymous user gets a 401 error response."""
        request = _make_request(AnonymousUser())
        response = NpcPlayerEditPermission.check(request, self.npc)
        assert response.status_code == 401
        assert response.data == {'errors': {'detail': ['authentication required']}}

    def test_returns_401_response_for_none_user(self):
        """Test that a None user gets a 401 error response."""
        request = _make_request(None)
        response = NpcPlayerEditPermission.check(request, self.npc)
        assert response.status_code == 401

    def test_returns_403_response_for_unrelated_user(self):
        """Test that an authenticated user who is neither a player nor an editor gets 403."""
        other_user = UserFactory(username='other', password='secret-password')
        request = _make_request(other_user)
        response = NpcPlayerEditPermission.check(request, self.npc)
        assert response.status_code == 403
        assert response.data == {'errors': {'detail': ['not allowed']}}

    def test_returns_none_for_player_of_the_game(self):
        """Test that a player linked to the NPC's game via Player.games passes the check."""
        request = _make_request(self.player_user)
        assert NpcPlayerEditPermission.check(request, self.npc) is None

    def test_returns_none_for_dm(self):
        """Test that a DM of the game passes the check."""
        request = _make_request(self.dm_user)
        assert NpcPlayerEditPermission.check(request, self.npc) is None

    def test_returns_none_for_superuser(self):
        """Test that a superuser passes the check."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        request = _make_request(superuser)
        assert NpcPlayerEditPermission.check(request, self.npc) is None


@pytest.mark.django_db
class TestGameEditPermissionCheck:
    """Tests for GameEditPermission.check()."""

    def setup_method(self):
        """Set up a game and a DM user."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)

    def test_returns_401_for_anonymous_user(self):
        """Test that an anonymous user gets a 401 error response."""
        request = _make_request(AnonymousUser())
        response = GameEditPermission.check(request, self.game)
        assert response.status_code == 401
        assert response.data == {'errors': {'detail': ['authentication required']}}

    def test_returns_401_for_none_user(self):
        """Test that a None user gets a 401 error response."""
        request = _make_request(None)
        response = GameEditPermission.check(request, self.game)
        assert response.status_code == 401

    def test_returns_403_for_non_editor(self):
        """Test that an authenticated non-DM gets a 403 error response."""
        other_user = UserFactory(username='other', password='secret-password')
        request = _make_request(other_user)
        response = GameEditPermission.check(request, self.game)
        assert response.status_code == 403
        assert response.data == {'errors': {'detail': ['not allowed']}}

    def test_returns_none_for_dm(self):
        """Test that a DM of the game passes the check."""
        request = _make_request(self.dm_user)
        assert GameEditPermission.check(request, self.game) is None

    def test_returns_none_for_superuser(self):
        """Test that a superuser passes the check."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        request = _make_request(superuser)
        assert GameEditPermission.check(request, self.game) is None


@pytest.mark.django_db
class TestTaskEditPermissionCheck:
    """Tests for TaskEditPermission.check()."""

    def setup_method(self):
        """Set up a game, a task, and a DM user."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.task = Task.objects.create(game=self.game, short_description='Prep the ambush')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)

    def test_returns_401_for_anonymous_user(self):
        """Test that an anonymous user gets a 401 error response."""
        request = _make_request(AnonymousUser())
        response = TaskEditPermission.check(request, self.task)
        assert response.status_code == 401
        assert response.data == {'errors': {'detail': ['authentication required']}}

    def test_returns_401_for_none_user(self):
        """Test that a None user gets a 401 error response."""
        request = _make_request(None)
        response = TaskEditPermission.check(request, self.task)
        assert response.status_code == 401

    def test_returns_403_for_non_editor(self):
        """Test that an authenticated non-DM gets a 403 error response."""
        other_user = UserFactory(username='other', password='secret-password')
        request = _make_request(other_user)
        response = TaskEditPermission.check(request, self.task)
        assert response.status_code == 403
        assert response.data == {'errors': {'detail': ['not allowed']}}

    def test_returns_none_for_dm(self):
        """Test that a DM of the task's game passes the check."""
        request = _make_request(self.dm_user)
        assert TaskEditPermission.check(request, self.task) is None

    def test_returns_none_for_superuser(self):
        """Test that a superuser passes the check."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        request = _make_request(superuser)
        assert TaskEditPermission.check(request, self.task) is None
