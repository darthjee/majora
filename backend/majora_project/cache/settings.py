"""Settings for the in-process memory cache module."""

from majora_project.env import env_int


class Settings:
    """Reads memory-cache configuration from environment variables with sensible defaults."""

    @staticmethod
    def max_size_bytes():
        """Return the total cache size limit, in bytes, before eviction kicks in."""
        return env_int('MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES', 10485760)

    @staticmethod
    def eviction_batch_size():
        """Return the number of least-recently-read entries evicted once at the size limit."""
        return env_int('MAJORA_MEMORY_CACHE_EVICTION_BATCH_SIZE', 10)
