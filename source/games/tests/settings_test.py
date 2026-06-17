"""Tests for games app Settings class."""


from games.settings import Settings


class TestSettingsPaginationSize:
    """Tests for Settings.pagination_size()."""

    def test_returns_default_when_env_not_set(self, monkeypatch):
        """Test that the default of 16 is returned when env var is absent."""
        monkeypatch.delenv('MAJORA_PAGINATION_SIZE', raising=False)
        assert Settings.pagination_size() == 16

    def test_reads_value_from_env(self, monkeypatch):
        """Test that the value from MAJORA_PAGINATION_SIZE is used."""
        monkeypatch.setenv('MAJORA_PAGINATION_SIZE', '25')
        assert Settings.pagination_size() == 25

    def test_returns_default_when_env_is_invalid(self, monkeypatch):
        """Test that the default is returned when the env var is not an integer."""
        monkeypatch.setenv('MAJORA_PAGINATION_SIZE', 'not-a-number')
        assert Settings.pagination_size() == 16

    def test_returns_default_when_env_is_empty(self, monkeypatch):
        """Test that the default is returned when the env var is an empty string."""
        monkeypatch.setenv('MAJORA_PAGINATION_SIZE', '')
        assert Settings.pagination_size() == 16
