"""General-purpose, in-process memory cache with size-bounded LRU eviction."""

from .entry import CacheEntry
from .settings import Settings


class MemoryCache:
    """Size-bounded key/value store, partitioned by type then key, evicting LRU entries.

    Meant to be used as a single, process-wide shared instance (see the module-level
    `memory_cache` singleton in `majora_project.cache`), since its whole purpose is one
    in-process cache shared by every caller.
    """

    def __init__(self):
        """Initialize an empty `{type: {key: CacheEntry}}` store and a running size total."""
        self._store = {}
        self._total_size_bytes = 0

    def get(self, entry_type, key):
        """Return the cached data for (`entry_type`, `key`), or None on a miss.

        Touches the entry's `read_at` bookkeeping on a hit.
        """
        entry = self._store.get(entry_type, {}).get(key)
        if entry is None:
            return None
        entry.touch()
        return entry.data

    def set(self, entry_type, key, data, size_bytes):
        """Store `data` for (`entry_type`, `key`), evicting older entries first if needed."""
        self._evict_if_needed()
        self._replace_entry(entry_type, key, CacheEntry(key, entry_type, data, size_bytes))

    def clear(self):
        """Empty the whole cache store."""
        self._store = {}
        self._total_size_bytes = 0

    def summary(self):
        """Return the current size and configured limit, in bytes, as a plain dict."""
        return {'size': self._total_size_bytes, 'limit': Settings.max_size_bytes()}

    def _replace_entry(self, entry_type, key, entry):
        """Insert `entry`, discounting any previous entry stored under the same type/key."""
        bucket = self._store.setdefault(entry_type, {})
        existing = bucket.get(key)
        if existing is not None:
            self._total_size_bytes -= existing.size_bytes
        bucket[key] = entry
        self._total_size_bytes += entry.size_bytes

    def _evict_if_needed(self):
        """Clear the whole cache at double the size limit, else evict a batch of LRU entries."""
        max_size = Settings.max_size_bytes()
        if self._total_size_bytes >= max_size * 2:
            self.clear()
        elif self._total_size_bytes >= max_size:
            self._evict_batch(Settings.eviction_batch_size())

    def _evict_batch(self, batch_size):
        """Remove the `batch_size` entries with the oldest `read_at`, across every type."""
        oldest_entries = sorted(self._all_entries(), key=lambda entry: entry.read_at)
        for entry in oldest_entries[:batch_size]:
            self._remove_entry(entry)

    def _all_entries(self):
        """Return a flat list of every `CacheEntry` currently stored, across all types."""
        return [entry for bucket in self._store.values() for entry in bucket.values()]

    def _remove_entry(self, entry):
        """Remove a single `CacheEntry` from the store and discount its size from the total."""
        del self._store[entry.type][entry.key]
        self._total_size_bytes -= entry.size_bytes
