"""Tests for the BasePermission class."""

from games.roles import Roles
from permissions.base import BasePermission


class TestBasePermissionShortcut:
    """Tests for BasePermission's admin/dm shortcut and 'everyone' handling."""

    def test_admin_shortcut_allows_regardless_of_entry(self):
        """Test that an admin is always allowed, even with an empty entry."""
        roles = Roles.from_booleans(is_superuser=True)
        permission = BasePermission(roles=roles)
        assert permission._allowed([]) is True
        assert permission._allowed(None) is True

    def test_dm_shortcut_allows_regardless_of_entry(self):
        """Test that a dm is always allowed, even with an empty entry."""
        roles = Roles.from_booleans(is_dm=True)
        permission = BasePermission(roles=roles)
        assert permission._allowed([]) is True

    def test_no_shortcut_for_regular_user_with_empty_entry(self):
        """Test that a plain logged-in user is denied when the entry lists no roles."""
        roles = Roles.from_booleans()
        permission = BasePermission(roles=roles)
        assert permission._allowed([]) is False
        assert permission._allowed(None) is False

    def test_everyone_role_allows_anyone(self):
        """Test that the 'everyone' pseudo-role always allows, even with no shortcut role."""
        roles = Roles.from_booleans()
        permission = BasePermission(roles=roles)
        assert permission._allowed(['everyone']) is True

    def test_listed_role_allows(self):
        """Test that a listed role (e.g. player) allows a matching user."""
        roles = Roles.from_booleans(is_player=True)
        permission = BasePermission(roles=roles)
        assert permission._allowed(['player']) is True

    def test_unlisted_role_denies(self):
        """Test that a role not in the list denies access."""
        roles = Roles.from_booleans(is_player=True)
        permission = BasePermission(roles=roles)
        assert permission._allowed(['staff']) is False


class TestBasePermissionNoShortcut:
    """Tests for BasePermission's `no_shortcut: true` entry (session_message/poll_vote)."""

    def test_admin_is_denied_when_no_shortcut_and_not_listed(self):
        """Test that even an admin is denied when no_shortcut is set and admin isn't listed."""
        roles = Roles.from_booleans(is_superuser=True)
        permission = BasePermission(roles=roles)
        entry = {'roles': ['player'], 'no_shortcut': True}
        assert permission._allowed(entry) is False

    def test_dm_is_denied_when_no_shortcut_and_not_a_player(self):
        """Test that a dm-only (not also a player) user is denied under no_shortcut."""
        roles = Roles.from_booleans(is_dm=True)
        permission = BasePermission(roles=roles)
        entry = {'roles': ['player'], 'no_shortcut': True}
        assert permission._allowed(entry) is False

    def test_player_is_allowed_under_no_shortcut(self):
        """Test that a listed role still grants access under no_shortcut."""
        roles = Roles.from_booleans(is_player=True)
        permission = BasePermission(roles=roles)
        entry = {'roles': ['player'], 'no_shortcut': True}
        assert permission._allowed(entry) is True


class TestBasePermissionParseEntry:
    """Tests for BasePermission._parse_entry()."""

    def test_none_entry_returns_no_roles_and_no_shortcut_override(self):
        """Test that a missing entry parses to no allowed roles and no no_shortcut."""
        assert BasePermission._parse_entry(None) == ([], False)

    def test_list_entry_parses_as_plain_roles(self):
        """Test that a plain list entry parses as its roles, with no_shortcut False."""
        assert BasePermission._parse_entry(['staff', 'player']) == (['staff', 'player'], False)

    def test_dict_entry_parses_roles_and_no_shortcut(self):
        """Test that a dict entry parses both its roles and no_shortcut flag."""
        entry = {'roles': ['player'], 'no_shortcut': True}
        assert BasePermission._parse_entry(entry) == (['player'], True)

    def test_dict_entry_without_no_shortcut_defaults_to_false(self):
        """Test that a dict entry without an explicit no_shortcut key defaults to False."""
        entry = {'roles': ['player']}
        assert BasePermission._parse_entry(entry) == (['player'], False)
