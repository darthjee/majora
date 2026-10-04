"""Tests for the statistics app's `Settings` class."""

from statistics.settings import Settings


class TestSettingsVisitInactivitySeconds:
    """Tests for `Settings.visit_inactivity_seconds()`."""

    def test_returns_default_when_env_not_set(self, monkeypatch):
        """Test that the default of 30 minutes is returned when the env var is absent."""
        monkeypatch.delenv('MAJORA_STATISTICS_VISIT_INACTIVITY_SECONDS', raising=False)
        assert Settings.visit_inactivity_seconds() == 1800

    def test_reads_value_from_env(self, monkeypatch):
        """Test that the value from `MAJORA_STATISTICS_VISIT_INACTIVITY_SECONDS` is used."""
        monkeypatch.setenv('MAJORA_STATISTICS_VISIT_INACTIVITY_SECONDS', '600')
        assert Settings.visit_inactivity_seconds() == 600

    def test_returns_default_when_env_is_invalid(self, monkeypatch):
        """Test that the default is returned when the env var is not an integer."""
        monkeypatch.setenv('MAJORA_STATISTICS_VISIT_INACTIVITY_SECONDS', 'not-a-number')
        assert Settings.visit_inactivity_seconds() == 1800


class TestSettingsSessionTouchIntervalSeconds:
    """Tests for `Settings.session_touch_interval_seconds()`."""

    def test_returns_default_when_env_not_set(self, monkeypatch):
        """Test that the default of 60 seconds is returned when the env var is absent."""
        monkeypatch.delenv('MAJORA_STATISTICS_SESSION_TOUCH_INTERVAL_SECONDS', raising=False)
        assert Settings.session_touch_interval_seconds() == 60

    def test_reads_value_from_env(self, monkeypatch):
        """Test that the value from `MAJORA_STATISTICS_SESSION_TOUCH_INTERVAL_SECONDS` is used."""
        monkeypatch.setenv('MAJORA_STATISTICS_SESSION_TOUCH_INTERVAL_SECONDS', '5')
        assert Settings.session_touch_interval_seconds() == 5

    def test_returns_default_when_env_is_invalid(self, monkeypatch):
        """Test that the default is returned when the env var is not an integer."""
        monkeypatch.setenv('MAJORA_STATISTICS_SESSION_TOUCH_INTERVAL_SECONDS', 'oops')
        assert Settings.session_touch_interval_seconds() == 60


class TestSettingsMaxRangeDays:
    """Tests for `Settings.max_range_days()`."""

    def test_returns_default_when_env_not_set(self, monkeypatch):
        """Test that the default of 366 days is returned when the env var is absent."""
        monkeypatch.delenv('MAJORA_STATISTICS_MAX_RANGE_DAYS', raising=False)
        assert Settings.max_range_days() == 366

    def test_reads_value_from_env(self, monkeypatch):
        """Test that the value from `MAJORA_STATISTICS_MAX_RANGE_DAYS` is used."""
        monkeypatch.setenv('MAJORA_STATISTICS_MAX_RANGE_DAYS', '730')
        assert Settings.max_range_days() == 730

    def test_returns_default_when_env_is_invalid(self, monkeypatch):
        """Test that the default is returned when the env var is not an integer."""
        monkeypatch.setenv('MAJORA_STATISTICS_MAX_RANGE_DAYS', 'oops')
        assert Settings.max_range_days() == 366
