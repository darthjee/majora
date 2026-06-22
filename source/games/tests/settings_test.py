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


class TestSettingsPasswordResetTokenExpirationMinutes:
    """Tests for Settings.password_reset_token_expiration_minutes()."""

    def test_returns_default_when_env_not_set(self, monkeypatch):
        """Test that the default of 30 is returned when env var is absent."""
        monkeypatch.delenv('MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES', raising=False)
        assert Settings.password_reset_token_expiration_minutes() == 30

    def test_reads_value_from_env(self, monkeypatch):
        """Test that the value from MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES is used."""
        monkeypatch.setenv('MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES', '45')
        assert Settings.password_reset_token_expiration_minutes() == 45

    def test_returns_default_when_env_is_invalid(self, monkeypatch):
        """Test that the default is returned when the env var is not an integer."""
        monkeypatch.setenv('MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES', 'not-a-number')
        assert Settings.password_reset_token_expiration_minutes() == 30

    def test_returns_default_when_env_is_empty(self, monkeypatch):
        """Test that the default is returned when the env var is an empty string."""
        monkeypatch.setenv('MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES', '')
        assert Settings.password_reset_token_expiration_minutes() == 30


class TestSettingsEmailsEnabled:
    """Tests for Settings.emails_enabled()."""

    def test_returns_false_when_env_not_set(self, monkeypatch):
        """Test that emails are disabled by default when the env var is absent."""
        monkeypatch.delenv('EMAILS_ENABLED', raising=False)
        assert Settings.emails_enabled() is False

    def test_returns_true_when_env_is_true(self, monkeypatch):
        """Test that emails are enabled when the env var is 'true'."""
        monkeypatch.setenv('EMAILS_ENABLED', 'true')
        assert Settings.emails_enabled() is True

    def test_returns_true_when_env_is_mixed_case(self, monkeypatch):
        """Test that the comparison is case-insensitive."""
        monkeypatch.setenv('EMAILS_ENABLED', 'True')
        assert Settings.emails_enabled() is True

    def test_returns_false_when_env_is_false(self, monkeypatch):
        """Test that emails are disabled when the env var is 'false'."""
        monkeypatch.setenv('EMAILS_ENABLED', 'false')
        assert Settings.emails_enabled() is False

    def test_returns_false_when_env_is_other_value(self, monkeypatch):
        """Test that emails are disabled for any value other than 'true'."""
        monkeypatch.setenv('EMAILS_ENABLED', 'yes')
        assert Settings.emails_enabled() is False
