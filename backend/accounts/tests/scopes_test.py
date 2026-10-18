"""Tests for the scope catalogue."""

from types import SimpleNamespace

from accounts.scopes import ACTIONS, FAMILIES, METHOD_ACTIONS, SCOPES, effective_scopes


class TestScopeCatalogue:
    """Tests for the `SCOPES` constant and its parts."""

    def test_has_32_scopes(self):
        """Test that the catalogue holds exactly 32 entries."""
        assert len(SCOPES) == 32

    def test_scopes_are_unique(self):
        """Test that no scope appears twice."""
        assert len(set(SCOPES)) == len(SCOPES)

    def test_has_16_families(self):
        """Test that there are 16 families."""
        assert len(FAMILIES) == 16

    def test_every_family_has_both_actions(self):
        """Test that each family has a read and a write scope."""
        for family in FAMILIES:
            assert all(f'{family}:{action}' in SCOPES for action in ACTIONS)

    def test_order_is_stable(self):
        """Test that the catalogue starts with the games family, read first."""
        assert SCOPES[:2] == ('games:read', 'games:write')

    def test_method_actions(self):
        """Test that GET maps to read and every other method to write."""
        assert METHOD_ACTIONS == {
            'GET': 'read',
            'POST': 'write',
            'PUT': 'write',
            'PATCH': 'write',
            'DELETE': 'write',
        }


class TestEffectiveScopes:
    """Tests for `effective_scopes`."""

    def test_keeps_known_scopes(self):
        """Test that catalogue scopes are kept."""
        token = SimpleNamespace(scopes=['npcs:read', 'npcs:write'])
        assert effective_scopes(token) == {'npcs:read', 'npcs:write'}

    def test_filters_unknown_scopes(self):
        """Test that scopes no longer in the catalogue are dropped."""
        token = SimpleNamespace(scopes=['npcs:read', 'npcs:delete', 'staff:write'])
        assert effective_scopes(token) == {'npcs:read'}

    def test_non_list_grants_nothing(self):
        """Test that a malformed stored value grants nothing."""
        token = SimpleNamespace(scopes={'npcs:read': True})
        assert effective_scopes(token) == frozenset()
