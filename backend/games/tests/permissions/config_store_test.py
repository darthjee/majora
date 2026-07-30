"""Tests for the PermissionConfigStore class."""

import pytest

from games.permissions.config_store import PermissionConfigStore


@pytest.mark.django_db
class TestPermissionConfigStore:
    """Tests for PermissionConfigStore.get()."""

    def setup_method(self):
        """Clear the in-class cache before each test, isolating cache-population assertions."""
        PermissionConfigStore._cache = {}

    def test_loads_endpoints_config_for_a_known_resource(self):
        """Test that a known resource/endpoints config loads its expected shape."""
        config = PermissionConfigStore.get('game', 'endpoints')
        assert config == {'restricted': {'edit': []}}

    def test_loads_ui_config_for_a_known_resource(self):
        """Test that a known resource/ui config loads its expected shape."""
        config = PermissionConfigStore.get('game_pc', 'ui')
        assert config['edit'] == ['owner']

    def test_caches_the_parsed_result(self):
        """Test that a second get() call for the same key is served from the cache."""
        PermissionConfigStore.get('game', 'endpoints')
        assert ('game', 'endpoints') in PermissionConfigStore._cache

    def test_returned_config_is_a_copy(self):
        """Test that mutating a returned config doesn't affect the next get() call."""
        config = PermissionConfigStore.get('game', 'endpoints')
        config['restricted']['edit'].append('mutated')
        fresh_config = PermissionConfigStore.get('game', 'endpoints')
        assert fresh_config == {'restricted': {'edit': []}}

    def test_no_shortcut_entry_round_trips_as_a_dict(self):
        """Test that a no_shortcut entry (session_message.create) parses as a dict."""
        config = PermissionConfigStore.get('session_message', 'endpoints')
        assert config['regular']['create'] == {'roles': ['player'], 'no_shortcut': True}
