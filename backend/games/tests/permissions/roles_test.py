"""Tests for the Roles class."""

import pytest
from django.contrib.auth.models import AnonymousUser

from games.permissions.roles import Roles
from games.tests.factories import CharacterFactory, GameFactory, PlayerFactory, UserFactory


@pytest.mark.django_db
class TestRolesNoUser:
    """Tests for Roles() truth table row: no user given."""

    def setup_method(self):
        """Set up a game and character, even though no user is given."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Test PC', game=self.game, npc=False)

    def test_all_roles_is_empty_for_none_user(self):
        """Test that all_roles() is empty when user is None."""
        roles = Roles(user=None, game=self.game, pc=self.character)
        assert roles.all_roles() == []

    def test_all_roles_is_empty_for_anonymous_user(self):
        """Test that all_roles() is empty for an unauthenticated (Anonymous) user."""
        roles = Roles(user=AnonymousUser(), game=self.game, pc=self.character)
        assert roles.all_roles() == []

    def test_every_predicate_is_false_for_none_user(self):
        """Test that every is_* predicate is False when user is None."""
        roles = Roles(user=None, game=self.game, pc=self.character)
        assert roles.is_admin() is False
        assert roles.is_logged_user() is False
        assert roles.is_staff() is False
        assert roles.is_dm() is False
        assert roles.is_player() is False
        assert roles.is_owner() is False


@pytest.mark.django_db
class TestRolesUserOnly:
    """Tests for Roles() truth table row: user given, no game."""

    def setup_method(self):
        """Set up a plain authenticated user."""
        self.user = UserFactory(username='bob', password='secret-password')

    def test_logged_user_is_true(self):
        """Test that logged_user is True for any authenticated user."""
        assert Roles(user=self.user).is_logged_user() is True

    def test_admin_is_false_for_regular_user(self):
        """Test that admin is False for a non-superuser."""
        assert Roles(user=self.user).is_admin() is False

    def test_admin_is_true_for_superuser(self):
        """Test that admin is True for a superuser, even with no game."""
        admin = UserFactory(username='admin', password='secret-password', is_superuser=True)
        assert Roles(user=admin).is_admin() is True

    def test_staff_is_true_for_staff_user(self):
        """Test that staff is True for a staff user, even with no game."""
        staff = UserFactory(username='staffer', password='secret-password', is_staff=True)
        assert Roles(user=staff).is_staff() is True

    def test_dm_player_owner_are_false_without_game(self):
        """Test that dm/player/owner are all False when no game is given."""
        roles = Roles(user=self.user)
        assert roles.is_dm() is False
        assert roles.is_player() is False
        assert roles.is_owner() is False

    def test_all_roles_only_lists_global_roles(self):
        """Test that all_roles() only ever lists admin/logged_user/staff without a game."""
        staff = UserFactory(username='staffer2', password='secret-password', is_staff=True)
        assert sorted(Roles(user=staff).all_roles()) == ['logged_user', 'staff']


@pytest.mark.django_db
class TestRolesUserAndGame:
    """Tests for Roles() truth table row: user and game given, no pc."""

    def setup_method(self):
        """Set up a game with a DM and a plain player."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.player_user, is_dm=False)
        self.outsider = UserFactory(username='outsider', password='secret-password')

    def test_dm_is_true_for_the_games_dm(self):
        """Test that is_dm is True for a DM of the game."""
        assert Roles(user=self.dm_user, game=self.game).is_dm() is True

    def test_player_is_true_for_the_dm_too(self):
        """Test that is_player is True for the DM as well (any Player row)."""
        assert Roles(user=self.dm_user, game=self.game).is_player() is True

    def test_dm_is_false_for_a_plain_player(self):
        """Test that is_dm is False for a non-DM player."""
        assert Roles(user=self.player_user, game=self.game).is_dm() is False

    def test_player_is_true_for_a_plain_player(self):
        """Test that is_player is True for a non-DM player."""
        assert Roles(user=self.player_user, game=self.game).is_player() is True

    def test_player_is_false_for_an_outsider(self):
        """Test that is_player is False for a user unrelated to the game."""
        assert Roles(user=self.outsider, game=self.game).is_player() is False

    def test_owner_is_false_without_a_pc(self):
        """Test that is_owner is False when no pc is given, even for the DM."""
        assert Roles(user=self.dm_user, game=self.game).is_owner() is False

    def test_all_roles_includes_dm_and_player_for_the_dm(self):
        """Test that all_roles() includes both dm and player for a DM."""
        roles = Roles(user=self.dm_user, game=self.game).all_roles()
        assert 'dm' in roles
        assert 'player' in roles
        assert 'owner' not in roles


@pytest.mark.django_db
class TestRolesUserGameAndPc:
    """Tests for Roles() truth table row: user, game, and pc all given."""

    def setup_method(self):
        """Set up a game, an owning player, their PC, and an NPC."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.owner_user = UserFactory(username='owner_user', password='secret-password')
        self.owner_player = PlayerFactory(game=self.game, user=self.owner_user)
        self.pc = CharacterFactory(
            name='Hero', game=self.game, player=self.owner_player, npc=False,
        )
        self.npc = CharacterFactory(name='Villager', game=self.game, npc=True)
        self.outsider = UserFactory(username='outsider', password='secret-password')

    def test_owner_is_true_for_the_owning_player(self):
        """Test that is_owner is True for the PC's owning player."""
        assert Roles(user=self.owner_user, game=self.game, pc=self.pc).is_owner() is True

    def test_owner_is_false_for_an_outsider(self):
        """Test that is_owner is False for an unrelated user."""
        assert Roles(user=self.outsider, game=self.game, pc=self.pc).is_owner() is False

    def test_owner_is_false_for_an_npc_even_for_its_dm(self):
        """Test that is_owner is always False for an NPC, regardless of the pc argument."""
        PlayerFactory(game=self.game, user=self.outsider, is_dm=True)
        assert Roles(user=self.outsider, game=self.game, pc=self.npc).is_owner() is False

    def test_all_roles_includes_owner_for_the_owning_player(self):
        """Test that all_roles() includes owner for the PC's owning player."""
        roles = Roles(user=self.owner_user, game=self.game, pc=self.pc).all_roles()
        assert 'owner' in roles
        assert 'player' in roles

    def test_owner_resolution_is_cached(self):
        """Test that a second is_owner() call for the same user/pc reuses the cached result."""
        roles = Roles(user=self.owner_user, game=self.game, pc=self.pc)
        assert roles.is_owner() is True
        assert roles.is_owner() is True


@pytest.mark.django_db
class TestRolesFromBooleans:
    """Tests for Roles.from_booleans(), the `?role=` simulated-preview hook."""

    def test_defaults_are_all_false(self):
        """Test that from_booleans() defaults every role, including logged_user, to False."""
        roles = Roles.from_booleans()
        assert roles.is_admin() is False
        assert roles.is_dm() is False
        assert roles.is_owner() is False
        assert roles.is_staff() is False
        assert roles.is_player() is False
        assert roles.is_logged_user() is False

    def test_every_boolean_is_honored(self):
        """Test that each simulated boolean is reflected by its matching predicate."""
        roles = Roles.from_booleans(
            is_superuser=True, is_dm=True, is_owner=True, is_staff=True, is_player=True,
            is_logged=True,
        )
        assert roles.is_admin() is True
        assert roles.is_dm() is True
        assert roles.is_owner() is True
        assert roles.is_staff() is True
        assert roles.is_player() is True
        assert roles.is_logged_user() is True

    def test_all_roles_reflects_simulated_booleans(self):
        """Test that all_roles() reflects the simulated booleans, not any real DB state."""
        roles = Roles.from_booleans(is_dm=True, is_player=True, is_logged=True)
        assert sorted(roles.all_roles()) == ['dm', 'logged_user', 'player']
