"""Tests for MemoryCache."""

from games.tests.cache.time_helpers import freeze_sequential_now
from majora_project.cache.base import MemoryCache


class TestMemoryCacheGetSet:
    """Tests for MemoryCache.get()/set() miss/hit behavior."""

    def setup_method(self):
        """Set up a fresh MemoryCache instance."""
        self.cache = MemoryCache()

    def test_get_returns_none_on_miss(self):
        """Test that get() returns None for a key that was never set."""
        assert self.cache.get('type-a', 'key-1') is None

    def test_get_returns_stored_data_on_hit(self):
        """Test that get() returns the data previously stored via set()."""
        self.cache.set('type-a', 'key-1', 'value-1', size_bytes=10)
        assert self.cache.get('type-a', 'key-1') == 'value-1'

    def test_get_is_scoped_by_type(self):
        """Test that the same key under a different type is still a miss."""
        self.cache.set('type-a', 'key-1', 'value-1', size_bytes=10)
        assert self.cache.get('type-b', 'key-1') is None

    def test_set_overwrites_existing_entry(self):
        """Test that set() overwrites a previously stored value for the same type/key."""
        self.cache.set('type-a', 'key-1', 'value-1', size_bytes=10)
        self.cache.set('type-a', 'key-1', 'value-2', size_bytes=10)
        assert self.cache.get('type-a', 'key-1') == 'value-2'


class TestMemoryCacheClear:
    """Tests for MemoryCache.clear()."""

    def setup_method(self):
        """Set up a fresh MemoryCache instance with an entry stored."""
        self.cache = MemoryCache()
        self.cache.set('type-a', 'key-1', 'value-1', size_bytes=10)

    def test_clear_removes_every_entry(self):
        """Test that clear() empties the whole store."""
        self.cache.clear()
        assert self.cache.get('type-a', 'key-1') is None

    def test_clear_resets_the_running_total_size(self):
        """Test that clear() resets the internal size total, so a re-fill doesn't over-evict."""
        self.cache.clear()
        self.cache.set('type-a', 'key-2', 'value-2', size_bytes=10)
        assert self.cache.get('type-a', 'key-2') == 'value-2'


class TestMemoryCacheLruEviction:
    """Tests for LRU batch eviction once the size limit is reached."""

    def setup_method(self):
        """Set up a fresh MemoryCache instance with a small size limit and eviction batch."""
        self.cache = MemoryCache()

    def test_evicts_the_least_recently_read_entry_at_the_limit(self, monkeypatch):
        """Test that reaching the size limit evicts only the oldest read_at entry."""
        freeze_sequential_now(monkeypatch)
        monkeypatch.setenv('MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES', '100')
        monkeypatch.setenv('MAJORA_MEMORY_CACHE_EVICTION_BATCH_SIZE', '1')

        self.cache.set('type-a', 'a', 'value-a', size_bytes=40)
        self.cache.set('type-a', 'b', 'value-b', size_bytes=40)
        # Touch 'a' again so 'b' becomes the least-recently-read entry.
        self.cache.get('type-a', 'a')
        self.cache.set('type-a', 'c', 'value-c', size_bytes=40)
        # Total is now 120 (>= 100), so the next set() evicts before writing.
        self.cache.set('type-a', 'd', 'value-d', size_bytes=40)

        assert self.cache.get('type-a', 'b') is None
        assert self.cache.get('type-a', 'a') == 'value-a'
        assert self.cache.get('type-a', 'c') == 'value-c'
        assert self.cache.get('type-a', 'd') == 'value-d'

    def test_eviction_is_not_scoped_to_a_single_type(self, monkeypatch):
        """Test that LRU eviction considers entries across every type, not just one."""
        freeze_sequential_now(monkeypatch)
        monkeypatch.setenv('MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES', '100')
        monkeypatch.setenv('MAJORA_MEMORY_CACHE_EVICTION_BATCH_SIZE', '1')

        self.cache.set('type-a', 'a', 'value-a', size_bytes=40)
        self.cache.set('type-b', 'b', 'value-b', size_bytes=40)
        self.cache.set('type-a', 'c', 'value-c', size_bytes=40)
        self.cache.set('type-b', 'd', 'value-d', size_bytes=40)

        # 'a' is the oldest read_at across every type and is evicted first, even though the
        # size limit was only reached because of writes under a different type ('type-b').
        assert self.cache.get('type-a', 'a') is None
        assert self.cache.get('type-b', 'b') == 'value-b'

    def test_evicts_a_full_batch_of_entries(self, monkeypatch):
        """Test that the whole eviction batch size is honored, not just a single entry."""
        freeze_sequential_now(monkeypatch)
        monkeypatch.setenv('MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES', '100')
        monkeypatch.setenv('MAJORA_MEMORY_CACHE_EVICTION_BATCH_SIZE', '2')

        self.cache.set('type-a', 'a', 'value-a', size_bytes=40)
        self.cache.set('type-a', 'b', 'value-b', size_bytes=40)
        self.cache.set('type-a', 'c', 'value-c', size_bytes=40)
        # Total is now 120 (>= 100), so the next set() evicts a batch of 2 before writing.
        self.cache.set('type-a', 'd', 'value-d', size_bytes=40)

        assert self.cache.get('type-a', 'a') is None
        assert self.cache.get('type-a', 'b') is None
        assert self.cache.get('type-a', 'c') == 'value-c'
        assert self.cache.get('type-a', 'd') == 'value-d'


class TestMemoryCacheDoubleLimitFullClear:
    """Tests for the full-clear behavior once the cache reaches double its size limit."""

    def setup_method(self):
        """Set up a fresh MemoryCache instance."""
        self.cache = MemoryCache()

    def test_clears_everything_once_total_size_reaches_double_the_limit(self, monkeypatch):
        """Test that reaching double the size limit clears the whole cache outright."""
        monkeypatch.setenv('MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES', '100')
        monkeypatch.setenv('MAJORA_MEMORY_CACHE_EVICTION_BATCH_SIZE', '1')

        self.cache.set('type-a', 'a', 'value-a', size_bytes=250)
        assert self.cache.get('type-a', 'a') == 'value-a'

        # Total is now 250 (>= 2 * 100), so the next set() clears everything first.
        self.cache.set('type-a', 'b', 'value-b', size_bytes=10)

        assert self.cache.get('type-a', 'a') is None
        assert self.cache.get('type-a', 'b') == 'value-b'


class TestMemoryCacheSummary:
    """Tests for MemoryCache.summary()."""

    def setup_method(self):
        """Set up a fresh MemoryCache instance."""
        self.cache = MemoryCache()

    def test_summary_on_empty_cache(self, monkeypatch):
        """Test that summary() reports zero size and the configured limit on an empty cache."""
        monkeypatch.setenv('MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES', '100')

        assert self.cache.summary() == {'size': 0, 'limit': 100}

    def test_summary_after_setting_entries(self, monkeypatch):
        """Test that summary() reports the running total size after entries are set."""
        monkeypatch.setenv('MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES', '1000')

        self.cache.set('type-a', 'a', 'value-a', size_bytes=40)
        self.cache.set('type-a', 'b', 'value-b', size_bytes=25)

        assert self.cache.summary() == {'size': 65, 'limit': 1000}
