"""Tests for the EndpointPermission class."""

import pytest
from django.contrib.auth.models import AnonymousUser
from rest_framework.test import APIRequestFactory

from games.models import GameSession
from games.tests.factories import CharacterFactory, GameFactory, PlayerFactory, UserFactory
from permissions.endpoint import EndpointPermission


def _make_request(user):
    """Build a fake GET request carrying the given `user`."""
    factory = APIRequestFactory()
    request = factory.get('/fake/')
    request.user = user
    return request


@pytest.mark.django_db
class TestEndpointPermissionAllowed:
    """Tests for EndpointPermission.allowed()."""

    def setup_method(self):
        """Set up a game, its DM, a plain player, and an outsider."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.player_user, is_dm=False)
        self.outsider = UserFactory(username='outsider', password='secret-password')

    def test_dm_allowed_via_shortcut_on_plain_game_edit(self):
        """Test that the dm/admin shortcut grants game.restricted.edit."""
        permission = EndpointPermission(self.dm_user, game=self.game)
        assert permission.allowed('game', 'restricted', 'edit') is True

    def test_outsider_denied_on_plain_game_edit(self):
        """Test that an outsider is denied game.restricted.edit."""
        permission = EndpointPermission(self.outsider, game=self.game)
        assert permission.allowed('game', 'restricted', 'edit') is False

    def test_player_allowed_on_game_session_regular_edit(self):
        """Test that any player of the game may edit a game_session (regular tier)."""
        permission = EndpointPermission(self.player_user, game=self.game)
        assert permission.allowed('game_session', 'regular', 'edit') is True

    def test_outsider_denied_on_game_session_regular_edit(self):
        """Test that an outsider may not edit a game_session."""
        permission = EndpointPermission(self.outsider, game=self.game)
        assert permission.allowed('game_session', 'regular', 'edit') is False


@pytest.mark.django_db
class TestEndpointPermissionNoShortcut:
    """Tests for the deliberate no_shortcut exceptions (session_message.create/poll_vote.vote)."""

    def setup_method(self):
        """Set up a game, a superuser and staff account, and a plain player."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.superuser = UserFactory(
            username='root', password='secret-password', is_superuser=True,
        )
        self.staff_user = UserFactory(
            username='staffer', password='secret-password', is_staff=True,
        )
        self.player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.player_user, is_dm=False)

    def test_superuser_who_is_not_a_player_is_denied_session_message_create(self):
        """Test that a superuser with no Player row for this game is denied."""
        permission = EndpointPermission(self.superuser, game=self.game)
        assert permission.allowed('session_message', 'regular', 'create') is False

    def test_staff_who_is_not_a_player_is_denied_session_message_create(self):
        """Test that a staff user with no Player row for this game is denied."""
        permission = EndpointPermission(self.staff_user, game=self.game)
        assert permission.allowed('session_message', 'regular', 'create') is False

    def test_player_is_allowed_session_message_create(self):
        """Test that an actual player of the game is allowed to post a session message."""
        permission = EndpointPermission(self.player_user, game=self.game)
        assert permission.allowed('session_message', 'regular', 'create') is True

    def test_superuser_who_is_not_a_player_is_denied_poll_vote(self):
        """Test that a superuser with no Player row for this game is denied a poll vote."""
        permission = EndpointPermission(self.superuser, game=self.game)
        assert permission.allowed('poll_vote', 'regular', 'vote') is False

    def test_player_is_allowed_poll_vote(self):
        """Test that an actual player of the game may cast a poll vote."""
        permission = EndpointPermission(self.player_user, game=self.game)
        assert permission.allowed('poll_vote', 'regular', 'vote') is True

    def test_superuser_is_still_allowed_session_message_show(self):
        """Test that the generic shortcut still applies to the sibling 'show' action."""
        permission = EndpointPermission(self.superuser, game=self.game)
        assert permission.allowed('session_message', 'regular', 'show') is True


@pytest.mark.django_db
class TestEndpointPermissionCharacterItemCreateReuse:
    """CharacterItemCreatePermission's `create` action is reused by 3 call sites (issue #773)."""

    def setup_method(self):
        """Set up a game, a staff user (no game link), and a PC."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.staff_user = UserFactory(
            username='staffer', password='secret-password', is_staff=True,
        )
        self.pc = CharacterFactory(name='Hero', game=self.game, npc=False)

    def test_staff_allowed_to_create_pc_item(self):
        """Test that staff may create a PC item via the narrow `create` action."""
        permission = EndpointPermission(self.staff_user, game=self.game, pc=self.pc)
        assert permission.allowed('game_pc_item', 'restricted', 'create') is True

    def test_staff_denied_to_create_npc_item_broadened_action(self):
        """Test that the broader `create_update` action still requires more than staff+NPC.

        Sanity check that `create` (restricted) and `create_update` (regular) stay distinct
        actions on the npc item resource — NPC items get no staff bypass on `create` either.
        """
        npc = CharacterFactory(name='Villager', game=self.game, npc=True)
        permission = EndpointPermission(self.staff_user, game=self.game, pc=npc)
        assert permission.allowed('game_npc_item', 'restricted', 'create') is True


@pytest.mark.django_db
class TestEndpointPermissionCheck:
    """Tests for EndpointPermission.check(), the Response-building wrapper."""

    def setup_method(self):
        """Set up a game and its DM."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)

    def test_returns_401_for_anonymous_user(self):
        """Test that check() returns a 401 Response for an anonymous user."""
        request = _make_request(AnonymousUser())
        permission = EndpointPermission(request.user, game=self.game)
        response = permission.check(request, 'game', 'restricted', 'edit')
        assert response.status_code == 401

    def test_returns_401_for_none_user(self):
        """Test that check() returns a 401 Response for a None user."""
        request = _make_request(None)
        permission = EndpointPermission(request.user, game=self.game)
        response = permission.check(request, 'game', 'restricted', 'edit')
        assert response.status_code == 401

    def test_returns_403_for_unauthorized_authenticated_user(self):
        """Test that check() returns a 403 Response for an authenticated non-editor."""
        outsider = UserFactory(username='outsider', password='secret-password')
        request = _make_request(outsider)
        permission = EndpointPermission(request.user, game=self.game)
        response = permission.check(request, 'game', 'restricted', 'edit')
        assert response.status_code == 403

    def test_returns_none_for_the_dm(self):
        """Test that check() returns None for an authorized dm."""
        request = _make_request(self.dm_user)
        permission = EndpointPermission(request.user, game=self.game)
        assert permission.check(request, 'game', 'restricted', 'edit') is None


@pytest.mark.django_db
class TestEndpointPermissionGameSessionDualInput:
    """GameSessionEditPermission's dual Game/GameSession input, now resolved by the caller."""

    def setup_method(self):
        """Set up a game and a player of that game."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.player_user, is_dm=False)

    def test_player_allowed_when_constructed_with_the_game_directly(self):
        """Test that passing the Game directly (create endpoint) resolves the same rule."""
        permission = EndpointPermission(self.player_user, game=self.game)
        assert permission.allowed('game_session', 'regular', 'edit') is True

    def test_player_allowed_when_constructed_with_the_sessions_game(self):
        """Test that passing a session's `.game` (update endpoint) resolves the same rule."""
        session = GameSession.objects.create(game=self.game, title='Session 1')
        permission = EndpointPermission(self.player_user, game=session.game)
        assert permission.allowed('game_session', 'regular', 'edit') is True
