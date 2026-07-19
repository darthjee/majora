"""Tests for CacheEntry."""

from games.tests.cache.time_helpers import freeze_sequential_now
from majora_project.cache.entry import CacheEntry


class TestCacheEntry:
    """Tests for CacheEntry."""

    def test_stores_key_type_data_and_size(self):
        """Test that the constructor stores every field verbatim."""
        entry = CacheEntry('key-1', 'type-a', 'value-1', size_bytes=10)
        assert entry.key == 'key-1'
        assert entry.type == 'type-a'
        assert entry.data == 'value-1'
        assert entry.size_bytes == 10

    def test_stored_at_and_read_at_start_equal(self, monkeypatch):
        """Test that stored_at and read_at are stamped to the same value on creation."""
        freeze_sequential_now(monkeypatch)
        entry = CacheEntry('key-1', 'type-a', 'value-1', size_bytes=10)
        assert entry.stored_at == entry.read_at

    def test_touch_updates_read_at_without_changing_stored_at(self, monkeypatch):
        """Test that touch() advances read_at but leaves stored_at untouched."""
        freeze_sequential_now(monkeypatch)
        entry = CacheEntry('key-1', 'type-a', 'value-1', size_bytes=10)
        original_stored_at = entry.stored_at
        original_read_at = entry.read_at

        entry.touch()

        assert entry.stored_at == original_stored_at
        assert entry.read_at > original_read_at
