"""Tests for the scope catalogue."""

from types import SimpleNamespace

from accounts.scopes import (
    ACTIONS,
    FAMILIES,
    FAMILY_ACTIONS,
    METHOD_ACTIONS,
    SCOPES,
    STAFF_ONLY_SCOPES,
    effective_scopes,
)


class TestScopeCatalogue:
    """Tests for the `SCOPES` constant and its parts."""

    def test_has_33_scopes(self):
        """Test that the catalogue holds exactly 33 entries."""
        assert len(SCOPES) == 33

    def test_scopes_are_unique(self):
        """Test that no scope appears twice."""
        assert len(set(SCOPES)) == len(SCOPES)

    def test_has_17_families(self):
        """Test that there are 17 families."""
        assert len(FAMILIES) == 17

    def test_every_read_write_family_has_both_actions(self):
        """Test that each family other than statistics has a read and a write scope."""
        for family in FAMILIES:
            if family == 'statistics':
                continue
            assert all(f'{family}:{action}' in SCOPES for action in ACTIONS)

    def test_statistics_has_read(self):
        """Test that the statistics family offers the read scope."""
        assert 'statistics:read' in SCOPES

    def test_statistics_has_no_write(self):
        """Test that the statistics family offers no write scope."""
        assert 'statistics:write' not in SCOPES

    def test_statistics_is_last(self):
        """Test that the statistics scope closes the catalogue."""
        assert SCOPES[-1] == 'statistics:read'

    def test_family_actions_match_families(self):
        """Test that the families follow the per-family actions table."""
        assert FAMILIES == tuple(family for family, _ in FAMILY_ACTIONS)

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


class TestStaffOnlyScopes:
    """Tests for `STAFF_ONLY_SCOPES`."""

    def test_holds_statistics_read(self):
        """Test that statistics:read is the only staff-only scope."""
        assert STAFF_ONLY_SCOPES == {'statistics:read'}

    def test_is_part_of_the_catalogue(self):
        """Test that every staff-only scope is in the catalogue."""
        assert STAFF_ONLY_SCOPES <= set(SCOPES)


class TestEffectiveScopes:
    """Tests for `effective_scopes`."""

    def test_keeps_known_scopes(self):
        """Test that catalogue scopes are kept."""
        token = SimpleNamespace(scopes=['npcs:read', 'npcs:write'])
        assert effective_scopes(token) == {'npcs:read', 'npcs:write'}

    def test_keeps_statistics_read(self):
        """Test that the read-only statistics scope is kept."""
        token = SimpleNamespace(scopes=['statistics:read'])
        assert effective_scopes(token) == {'statistics:read'}

    def test_filters_statistics_write(self):
        """Test that a stored statistics:write is dropped."""
        token = SimpleNamespace(scopes=['statistics:read', 'statistics:write'])
        assert effective_scopes(token) == {'statistics:read'}

    def test_filters_unknown_scopes(self):
        """Test that scopes no longer in the catalogue are dropped."""
        token = SimpleNamespace(scopes=['npcs:read', 'npcs:delete', 'staff:write'])
        assert effective_scopes(token) == {'npcs:read'}

    def test_non_list_grants_nothing(self):
        """Test that a malformed stored value grants nothing."""
        token = SimpleNamespace(scopes={'npcs:read': True})
        assert effective_scopes(token) == frozenset()
