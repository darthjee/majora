"""Tests for the PagePermissionConfigStore class."""

from permissions.page_config_store import PagePermissionConfigStore


class TestPagePermissionConfigStore:
    """Tests for PagePermissionConfigStore.get()."""

    def setup_method(self):
        """Clear the in-class cache before each test, isolating cache-population assertions."""
        PagePermissionConfigStore._cache = {}

    def test_loads_config_for_a_known_page(self):
        """Test that a known page config loads its expected shape."""
        config = PagePermissionConfigStore.get('game')
        assert config == {
            'game': {
                'edit': 'can_edit',
                'regular_edit': 'can_edit_regular',
                'create_item': 'can_create_item',
                'create_document': 'can_create_document',
                'edit_session': 'can_edit_session',
                'create_npc': 'can_create_npc',
            },
        }

    def test_loads_config_with_multiple_resources(self):
        """Test that the character_pc page config includes both its resources."""
        config = PagePermissionConfigStore.get('character_pc')
        assert set(config.keys()) == {'game_pc', 'game_pc_item'}
        assert config['game_pc']['edit'] == 'can_edit'
        assert config['game_pc_item']['create_update'] == 'can_create_item'

    def test_caches_the_parsed_result(self):
        """Test that a second get() call for the same page is served from the cache."""
        PagePermissionConfigStore.get('game')
        assert 'game' in PagePermissionConfigStore._cache

    def test_returned_config_is_a_copy(self):
        """Test that mutating a returned config doesn't affect the next get() call."""
        config = PagePermissionConfigStore.get('game')
        config['game']['edit'] = 'mutated'
        fresh_config = PagePermissionConfigStore.get('game')
        assert fresh_config['game']['edit'] == 'can_edit'
