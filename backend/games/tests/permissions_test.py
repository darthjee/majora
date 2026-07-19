"""Tests for the CharacterEditPermission and GameEditPermission classes."""

from django.contrib.auth.models import AnonymousUser
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from games.models import GameSession, Task
from games.permissions import (
    CharacterEditPermission,
    CharacterMoneyEditPermission,
    GameEditPermission,
    NpcPlayerEditPermission,
    PlayerPermission,
    SessionMessagePermission,
    TaskEditPermission,
)
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
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


class TestCharacterEditPermissionCheck(TestCase):
    """Tests for CharacterEditPermission.check()."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, an owning player and an NPC character."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.player = PlayerFactory(name='Bob', game=cls.game)
        cls.owner = UserFactory(username='owner', password='secret-password')
        cls.player.user = cls.owner
        cls.player.save()
        cls.character = CharacterFactory(
            name='Aragorn', game=cls.game, player=cls.player, npc=False
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


class TestCharacterMoneyEditPermissionCheck(TestCase):
    """Tests for CharacterMoneyEditPermission.check() and .is_allowed()."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, an owning player/PC, an NPC, and a regular player."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.player = PlayerFactory(name='Bob', game=cls.game)
        cls.owner = UserFactory(username='owner', password='secret-password')
        cls.player.user = cls.owner
        cls.player.save()
        cls.character = CharacterFactory(
            name='Aragorn', game=cls.game, player=cls.player, npc=False
        )
        cls.npc = CharacterFactory(name='Gandalf', game=cls.game, npc=True)
        cls.regular_player_user = UserFactory(
            username='regular_player', password='secret-password',
        )
        cls.regular_player = PlayerFactory(
            name='Alice', user=cls.regular_player_user, game=cls.game
        )

    def test_returns_401_response_for_anonymous_user(self):
        """Test that an anonymous user gets a 401 error response."""
        request = _make_request(AnonymousUser())
        response = CharacterMoneyEditPermission.check(request, self.character)
        assert response.status_code == 401
        assert response.data == {'errors': {'detail': ['authentication required']}}

    def test_returns_401_response_for_none_user(self):
        """Test that a None user gets a 401 error response."""
        request = _make_request(None)
        response = CharacterMoneyEditPermission.check(request, self.character)
        assert response.status_code == 401

    def test_returns_none_for_superuser(self):
        """Test that a superuser passes the check."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        request = _make_request(superuser)
        assert CharacterMoneyEditPermission.check(request, self.character) is None

    def test_returns_none_for_dm(self):
        """Test that a DM of the game passes the check."""
        request = _make_request(self.dm_user)
        assert CharacterMoneyEditPermission.check(request, self.character) is None

    def test_returns_none_for_staff_on_pc(self):
        """Test that a global Staff account passes the check on a PC."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        request = _make_request(staff_user)
        assert CharacterMoneyEditPermission.check(request, self.character) is None

    def test_returns_none_for_staff_on_npc(self):
        """Test that a global Staff account passes the check on an NPC."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        request = _make_request(staff_user)
        assert CharacterMoneyEditPermission.check(request, self.npc) is None

    def test_returns_none_for_pcs_owning_player(self):
        """Test that the PC's owning player passes the check."""
        request = _make_request(self.owner)
        assert CharacterMoneyEditPermission.check(request, self.character) is None

    def test_returns_none_for_regular_player_on_pc_they_do_not_own(self):
        """Test that any player of the game passes the check on a PC they do not own."""
        request = _make_request(self.regular_player_user)
        assert CharacterMoneyEditPermission.check(request, self.character) is None

    def test_returns_403_for_regular_player_on_npc(self):
        """Test that a regular player of the game gets 403 on an NPC (no player bypass)."""
        request = _make_request(self.regular_player_user)
        response = CharacterMoneyEditPermission.check(request, self.npc)
        assert response.status_code == 403
        assert response.data == {'errors': {'detail': ['not allowed']}}

    def test_returns_403_for_unrelated_authenticated_user(self):
        """Test that an authenticated user unrelated to the game gets a 403 error response."""
        other_user = UserFactory(username='other', password='secret-password')
        request = _make_request(other_user)
        response = CharacterMoneyEditPermission.check(request, self.character)
        assert response.status_code == 403
        assert response.data == {'errors': {'detail': ['not allowed']}}

    def test_is_allowed_returns_true_for_owning_player(self):
        """Test that is_allowed returns True for the PC's owning player."""
        assert CharacterMoneyEditPermission.is_allowed(self.owner, self.character) is True

    def test_is_allowed_returns_true_for_any_player_of_game_on_pc(self):
        """Test that is_allowed returns True for any player of the game on a PC."""
        assert (
            CharacterMoneyEditPermission.is_allowed(self.regular_player_user, self.character)
            is True
        )

    def test_is_allowed_returns_false_for_any_player_of_game_on_npc(self):
        """Test that is_allowed returns False for a non-owner player of the game on an NPC."""
        assert (
            CharacterMoneyEditPermission.is_allowed(self.regular_player_user, self.npc)
            is False
        )

    def test_is_allowed_returns_false_for_unrelated_user(self):
        """Test that is_allowed returns False for an unrelated authenticated user."""
        other_user = UserFactory(username='other2', password='secret-password')
        assert CharacterMoneyEditPermission.is_allowed(other_user, self.character) is False

    def test_is_allowed_returns_false_for_none_user(self):
        """Test that is_allowed returns False for a None user."""
        assert CharacterMoneyEditPermission.is_allowed(None, self.character) is False

    def test_is_allowed_returns_false_for_anonymous_user(self):
        """Test that is_allowed returns False for an AnonymousUser."""
        assert CharacterMoneyEditPermission.is_allowed(AnonymousUser(), self.character) is False


class TestNpcPlayerEditPermissionCheck(TestCase):
    """Tests for NpcPlayerEditPermission.check()."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, a player of the game, and an NPC."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.player_user = UserFactory(username='player_user', password='secret-password')
        cls.player = PlayerFactory(name='Bob', user=cls.player_user, game=cls.game)
        cls.npc = CharacterFactory(name='Gandalf', game=cls.game, npc=True)

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
        """Test that a player linked to the NPC's game via Player.game passes the check."""
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


class TestGameEditPermissionCheck(TestCase):
    """Tests for GameEditPermission.check()."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game and a DM user."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)

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


class TestTaskEditPermissionCheck(TestCase):
    """Tests for TaskEditPermission.check()."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a task, and a DM user."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.task = Task.objects.create(game=cls.game, short_description='Prep the ambush')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)

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


class TestSessionMessagePermissionCheckView(TestCase):
    """Tests for SessionMessagePermission.check_view()."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a session, a DM, and a player."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.session = GameSession.objects.create(game=cls.game, title='Session One')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.player_user = UserFactory(username='player_user', password='secret-password')
        cls.player = PlayerFactory(name='Bob', user=cls.player_user, game=cls.game)

    def test_returns_401_for_anonymous_user(self):
        """Test that an anonymous user gets a 401 error response."""
        request = _make_request(AnonymousUser())
        response = SessionMessagePermission.check_view(request, self.session)
        assert response.status_code == 401
        assert response.data == {'errors': {'detail': ['authentication required']}}

    def test_returns_401_for_none_user(self):
        """Test that a None user gets a 401 error response."""
        request = _make_request(None)
        response = SessionMessagePermission.check_view(request, self.session)
        assert response.status_code == 401

    def test_returns_403_for_outsider(self):
        """Test that a user unrelated to the game gets a 403 error response."""
        outsider = UserFactory(username='outsider', password='secret-password')
        request = _make_request(outsider)
        response = SessionMessagePermission.check_view(request, self.session)
        assert response.status_code == 403
        assert response.data == {'errors': {'detail': ['not allowed']}}

    def test_returns_none_for_player(self):
        """Test that a player of the game passes the check."""
        request = _make_request(self.player_user)
        assert SessionMessagePermission.check_view(request, self.session) is None

    def test_returns_none_for_dm(self):
        """Test that a DM of the game passes the check."""
        request = _make_request(self.dm_user)
        assert SessionMessagePermission.check_view(request, self.session) is None

    def test_returns_none_for_superuser(self):
        """Test that a superuser passes the check."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        request = _make_request(superuser)
        assert SessionMessagePermission.check_view(request, self.session) is None

    def test_returns_none_for_staff(self):
        """Test that a staff user passes the check."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        request = _make_request(staff_user)
        assert SessionMessagePermission.check_view(request, self.session) is None


class TestSessionMessagePermissionCheckCreate(TestCase):
    """Tests for SessionMessagePermission.check_create()."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a session, a DM, and a player."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.session = GameSession.objects.create(game=cls.game, title='Session One')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.player_user = UserFactory(username='player_user', password='secret-password')
        cls.player = PlayerFactory(name='Bob', user=cls.player_user, game=cls.game)

    def test_returns_401_for_anonymous_user(self):
        """Test that an anonymous user gets a 401 error response."""
        request = _make_request(AnonymousUser())
        response = SessionMessagePermission.check_create(request, self.session)
        assert response.status_code == 401
        assert response.data == {'errors': {'detail': ['authentication required']}}

    def test_returns_401_for_none_user(self):
        """Test that a None user gets a 401 error response."""
        request = _make_request(None)
        response = SessionMessagePermission.check_create(request, self.session)
        assert response.status_code == 401

    def test_returns_403_for_outsider(self):
        """Test that a user unrelated to the game gets a 403 error response."""
        outsider = UserFactory(username='outsider', password='secret-password')
        request = _make_request(outsider)
        response = SessionMessagePermission.check_create(request, self.session)
        assert response.status_code == 403
        assert response.data == {'errors': {'detail': ['not allowed']}}

    def test_returns_403_for_superuser_who_is_not_a_player_or_dm(self):
        """Test that a superuser with no game link gets a 403 error response (no bypass)."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        request = _make_request(superuser)
        response = SessionMessagePermission.check_create(request, self.session)
        assert response.status_code == 403
        assert response.data == {'errors': {'detail': ['not allowed']}}

    def test_returns_403_for_staff_who_is_not_a_player_or_dm(self):
        """Test that a staff user with no game link gets a 403 error response (no bypass)."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        request = _make_request(staff_user)
        response = SessionMessagePermission.check_create(request, self.session)
        assert response.status_code == 403
        assert response.data == {'errors': {'detail': ['not allowed']}}

    def test_returns_none_for_player(self):
        """Test that a player of the game passes the check."""
        request = _make_request(self.player_user)
        assert SessionMessagePermission.check_create(request, self.session) is None

    def test_returns_none_for_dm(self):
        """Test that a DM of the game passes the check."""
        request = _make_request(self.dm_user)
        assert SessionMessagePermission.check_create(request, self.session) is None


class TestPlayerPermissionCheck(TestCase):
    """Tests for PlayerPermission.check()."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, and a player."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.player_user = UserFactory(username='player_user', password='secret-password')
        cls.player = PlayerFactory(name='Bob', user=cls.player_user, game=cls.game)

    def test_returns_401_response_for_anonymous_user(self):
        """Test that an anonymous user gets a 401 error response."""
        request = _make_request(AnonymousUser())
        response = PlayerPermission.check(request, self.game)
        assert response.status_code == 401
        assert response.data == {'errors': {'detail': ['authentication required']}}

    def test_returns_401_response_for_none_user(self):
        """Test that a None user gets a 401 error response."""
        request = _make_request(None)
        response = PlayerPermission.check(request, self.game)
        assert response.status_code == 401

    def test_returns_403_response_for_outsider(self):
        """Test that a user unrelated to the game gets a 403 error response."""
        outsider = UserFactory(username='outsider', password='secret-password')
        request = _make_request(outsider)
        response = PlayerPermission.check(request, self.game)
        assert response.status_code == 403
        assert response.data == {'errors': {'detail': ['not allowed']}}

    def test_returns_none_for_player(self):
        """Test that a player of the game passes the check."""
        request = _make_request(self.player_user)
        assert PlayerPermission.check(request, self.game) is None

    def test_returns_none_for_dm(self):
        """Test that a DM of the game passes the check."""
        request = _make_request(self.dm_user)
        assert PlayerPermission.check(request, self.game) is None

    def test_returns_403_for_superuser_who_is_not_a_player_or_dm(self):
        """Test that a superuser with no game link gets 403 (no bypass, issue #695)."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        request = _make_request(superuser)
        response = PlayerPermission.check(request, self.game)
        assert response.status_code == 403
        assert response.data == {'errors': {'detail': ['not allowed']}}

    def test_returns_403_for_staff_who_is_not_a_player_or_dm(self):
        """Test that a staff user with no game link gets 403 (no bypass, issue #695)."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        request = _make_request(staff_user)
        response = PlayerPermission.check(request, self.game)
        assert response.status_code == 403
        assert response.data == {'errors': {'detail': ['not allowed']}}
