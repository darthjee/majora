"""Tests for the memory cache module's Settings class."""


from majora_project.cache.settings import Settings


class TestSettingsMaxSizeBytes:
    """Tests for Settings.max_size_bytes()."""

    def test_returns_default_when_env_not_set(self, monkeypatch):
        """Test that the default of 10485760 is returned when env var is absent."""
        monkeypatch.delenv('MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES', raising=False)
        assert Settings.max_size_bytes() == 10485760

    def test_reads_value_from_env(self, monkeypatch):
        """Test that the value from MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES is used."""
        monkeypatch.setenv('MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES', '2048')
        assert Settings.max_size_bytes() == 2048

    def test_returns_default_when_env_is_invalid(self, monkeypatch):
        """Test that the default is returned when the env var is not an integer."""
        monkeypatch.setenv('MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES', 'not-a-number')
        assert Settings.max_size_bytes() == 10485760

    def test_returns_default_when_env_is_empty(self, monkeypatch):
        """Test that the default is returned when the env var is an empty string."""
        monkeypatch.setenv('MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES', '')
        assert Settings.max_size_bytes() == 10485760


class TestSettingsEvictionBatchSize:
    """Tests for Settings.eviction_batch_size()."""

    def test_returns_default_when_env_not_set(self, monkeypatch):
        """Test that the default of 10 is returned when env var is absent."""
        monkeypatch.delenv('MAJORA_MEMORY_CACHE_EVICTION_BATCH_SIZE', raising=False)
        assert Settings.eviction_batch_size() == 10

    def test_reads_value_from_env(self, monkeypatch):
        """Test that the value from MAJORA_MEMORY_CACHE_EVICTION_BATCH_SIZE is used."""
        monkeypatch.setenv('MAJORA_MEMORY_CACHE_EVICTION_BATCH_SIZE', '25')
        assert Settings.eviction_batch_size() == 25

    def test_returns_default_when_env_is_invalid(self, monkeypatch):
        """Test that the default is returned when the env var is not an integer."""
        monkeypatch.setenv('MAJORA_MEMORY_CACHE_EVICTION_BATCH_SIZE', 'not-a-number')
        assert Settings.eviction_batch_size() == 10

    def test_returns_default_when_env_is_empty(self, monkeypatch):
        """Test that the default is returned when the env var is an empty string."""
        monkeypatch.setenv('MAJORA_MEMORY_CACHE_EVICTION_BATCH_SIZE', '')
        assert Settings.eviction_batch_size() == 10
