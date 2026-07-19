"""A single entry stored inside the in-process memory cache."""

from django.utils import timezone


class CacheEntry:
    """Hold a cached value plus the bookkeeping metadata used for LRU eviction."""

    def __init__(self, key, entry_type, data, size_bytes):
        """Store `data` for (`entry_type`, `key`), stamping stored_at/read_at to now."""
        self.key = key
        self.type = entry_type
        self.data = data
        self.size_bytes = size_bytes
        now = timezone.now()
        self.stored_at = now
        self.read_at = now

    def touch(self):
        """Update read_at to now, marking this entry as freshly used."""
        self.read_at = timezone.now()
