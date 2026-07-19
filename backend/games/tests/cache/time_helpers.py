"""Shared helper for deterministically advancing the cache module's clock in tests."""

import itertools
from datetime import datetime, timedelta, timezone

from majora_project.cache import entry as entry_module


def freeze_sequential_now(monkeypatch):
    """Monkeypatch CacheEntry's clock to return strictly increasing timestamps.

    Each call to `timezone.now()` inside `majora_project.cache.entry` advances by one
    second, guaranteeing a deterministic ordering for read_at/LRU-eviction assertions
    instead of relying on wall-clock resolution.
    """
    base = datetime(2024, 1, 1, tzinfo=timezone.utc)
    counter = itertools.count()

    class _SequentialClock:
        """Stand-in for django.utils.timezone exposing only the now() method used here."""

        @staticmethod
        def now():
            """Return the next timestamp in the sequence."""
            return base + timedelta(seconds=next(counter))

    monkeypatch.setattr(entry_module, 'timezone', _SequentialClock)
