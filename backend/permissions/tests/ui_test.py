"""Tests for the UIPermission class."""

import pytest

from games.roles import Roles
from games.tests.factories import CharacterFactory, GameFactory, PlayerFactory, UserFactory
from permissions.ui import UIPermission


@pytest.mark.django_db
class TestUIPermissionRealIdentity:
    """Tests for UIPermission.allowed() resolving roles from a real user/game/pc."""

    def setup_method(self):
        """Set up a game, its DM, an owning player and PC, and an outsider."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.owner_user = UserFactory(username='owner_user', password='secret-password')
        self.owner_player = PlayerFactory(game=self.game, user=self.owner_user)
        self.pc = CharacterFactory(
            name='Hero', game=self.game, player=self.owner_player, npc=False,
        )
        self.outsider = UserFactory(username='outsider', password='secret-password')

    def test_dm_can_edit_a_pc(self):
        """Test that the game's DM may edit a PC (via the admin/dm shortcut)."""
        permission = UIPermission(user=self.dm_user, game=self.game, pc=self.pc)
        assert permission.allowed('game_pc', 'edit') is True

    def test_owner_can_edit_their_own_pc(self):
        """Test that the PC's owning player may edit it."""
        permission = UIPermission(user=self.owner_user, game=self.game, pc=self.pc)
        assert permission.allowed('game_pc', 'edit') is True

    def test_outsider_cannot_edit_the_pc(self):
        """Test that an unrelated user may not edit the PC."""
        permission = UIPermission(user=self.outsider, game=self.game, pc=self.pc)
        assert permission.allowed('game_pc', 'edit') is False

    def test_no_user_cannot_edit_the_pc(self):
        """Test that an anonymous (no) user may not edit the PC."""
        permission = UIPermission(user=None, game=self.game, pc=self.pc)
        assert permission.allowed('game_pc', 'edit') is False


@pytest.mark.django_db
class TestUIPermissionSimulatedRoles:
    """Tests for UIPermission.allowed() with an injected, pre-resolved Roles object."""

    def test_simulated_owner_can_edit_a_pc(self):
        """Test that a simulated owner role grants game_pc.edit."""
        roles = Roles.from_booleans(is_owner=True)
        permission = UIPermission(roles=roles)
        assert permission.allowed('game_pc', 'edit') is True

    def test_simulated_player_cannot_edit_a_pc(self):
        """Test that a simulated (non-owner) player role does not grant game_pc.edit."""
        roles = Roles.from_booleans(is_player=True)
        permission = UIPermission(roles=roles)
        assert permission.allowed('game_pc', 'edit') is False

    def test_simulated_dm_can_edit_an_npc(self):
        """Test that a simulated dm role grants game_npc.edit, which has no extra roles."""
        roles = Roles.from_booleans(is_dm=True)
        permission = UIPermission(roles=roles)
        assert permission.allowed('game_npc', 'edit') is True

    def test_simulated_owner_cannot_edit_an_npc(self):
        """Test that a simulated owner role never grants game_npc.edit (no owner concept)."""
        roles = Roles.from_booleans(is_owner=True)
        permission = UIPermission(roles=roles)
        assert permission.allowed('game_npc', 'edit') is False
