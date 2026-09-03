"""Tests for games app Settings class."""


from games.settings import Settings


class TestSettingsPaginationSize:
    """Tests for Settings.pagination_size()."""

    def test_returns_default_when_env_not_set(self, monkeypatch):
        """Test that the default of 24 is returned when env var is absent."""
        monkeypatch.delenv('MAJORA_PAGINATION_SIZE', raising=False)
        assert Settings.pagination_size() == 24

    def test_reads_value_from_env(self, monkeypatch):
        """Test that the value from MAJORA_PAGINATION_SIZE is used."""
        monkeypatch.setenv('MAJORA_PAGINATION_SIZE', '25')
        assert Settings.pagination_size() == 25

    def test_returns_default_when_env_is_invalid(self, monkeypatch):
        """Test that the default is returned when the env var is not an integer."""
        monkeypatch.setenv('MAJORA_PAGINATION_SIZE', 'not-a-number')
        assert Settings.pagination_size() == 24

    def test_returns_default_when_env_is_empty(self, monkeypatch):
        """Test that the default is returned when the env var is an empty string."""
        monkeypatch.setenv('MAJORA_PAGINATION_SIZE', '')
        assert Settings.pagination_size() == 24


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

    def test_clamps_up_when_env_is_below_floor(self, monkeypatch):
        """Test that a value of 0 is clamped up to the floor of 1."""
        monkeypatch.setenv('MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES', '0')
        assert Settings.password_reset_token_expiration_minutes() == 1

    def test_clamps_up_when_env_is_negative(self, monkeypatch):
        """Test that a negative value is clamped up to the floor of 1."""
        monkeypatch.setenv('MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES', '-5')
        assert Settings.password_reset_token_expiration_minutes() == 1

    def test_clamps_down_when_env_is_above_ceiling(self, monkeypatch):
        """Test that a value above 1440 is clamped down to the ceiling of 1440."""
        monkeypatch.setenv('MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES', '99999')
        assert Settings.password_reset_token_expiration_minutes() == 1440

    def test_passes_through_at_lower_boundary(self, monkeypatch):
        """Test that a value of exactly 1 passes through unchanged."""
        monkeypatch.setenv('MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES', '1')
        assert Settings.password_reset_token_expiration_minutes() == 1

    def test_passes_through_at_upper_boundary(self, monkeypatch):
        """Test that a value of exactly 1440 passes through unchanged."""
        monkeypatch.setenv('MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES', '1440')
        assert Settings.password_reset_token_expiration_minutes() == 1440


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


class TestSettingsCacheControlAnonymousMaxAge:
    """Tests for Settings.cache_control_anonymous_max_age()."""

    def test_returns_default_when_env_not_set(self, monkeypatch):
        """Test that the default of 3600 is returned when env var is absent."""
        monkeypatch.delenv('MAJORA_CACHE_CONTROL_ANONYMOUS_SECONDS', raising=False)
        assert Settings.cache_control_anonymous_max_age() == 3600

    def test_reads_value_from_env(self, monkeypatch):
        """Test that the value from MAJORA_CACHE_CONTROL_ANONYMOUS_SECONDS is used."""
        monkeypatch.setenv('MAJORA_CACHE_CONTROL_ANONYMOUS_SECONDS', '7200')
        assert Settings.cache_control_anonymous_max_age() == 7200

    def test_returns_default_when_env_is_invalid(self, monkeypatch):
        """Test that the default is returned when the env var is not an integer."""
        monkeypatch.setenv('MAJORA_CACHE_CONTROL_ANONYMOUS_SECONDS', 'not-a-number')
        assert Settings.cache_control_anonymous_max_age() == 3600

    def test_returns_default_when_env_is_empty(self, monkeypatch):
        """Test that the default is returned when the env var is an empty string."""
        monkeypatch.setenv('MAJORA_CACHE_CONTROL_ANONYMOUS_SECONDS', '')
        assert Settings.cache_control_anonymous_max_age() == 3600


class TestSettingsCacheControlAuthenticatedMaxAge:
    """Tests for Settings.cache_control_authenticated_max_age()."""

    def test_returns_default_when_env_not_set(self, monkeypatch):
        """Test that the default of 10 is returned when env var is absent."""
        monkeypatch.delenv('MAJORA_CACHE_CONTROL_AUTHENTICATED_SECONDS', raising=False)
        assert Settings.cache_control_authenticated_max_age() == 10

    def test_reads_value_from_env(self, monkeypatch):
        """Test that the value from MAJORA_CACHE_CONTROL_AUTHENTICATED_SECONDS is used."""
        monkeypatch.setenv('MAJORA_CACHE_CONTROL_AUTHENTICATED_SECONDS', '30')
        assert Settings.cache_control_authenticated_max_age() == 30

    def test_returns_default_when_env_is_invalid(self, monkeypatch):
        """Test that the default is returned when the env var is not an integer."""
        monkeypatch.setenv('MAJORA_CACHE_CONTROL_AUTHENTICATED_SECONDS', 'not-a-number')
        assert Settings.cache_control_authenticated_max_age() == 10

    def test_returns_default_when_env_is_empty(self, monkeypatch):
        """Test that the default is returned when the env var is an empty string."""
        monkeypatch.setenv('MAJORA_CACHE_CONTROL_AUTHENTICATED_SECONDS', '')
        assert Settings.cache_control_authenticated_max_age() == 10


class TestSettingsUploadExpirationMinutes:
    """Tests for Settings.upload_expiration_minutes()."""

    def test_returns_default_when_env_not_set(self, monkeypatch):
        """Test that the default of 60 is returned when env var is absent."""
        monkeypatch.delenv('MAJORA_UPLOAD_EXPIRATION_MINUTES', raising=False)
        assert Settings.upload_expiration_minutes() == 60

    def test_reads_value_from_env(self, monkeypatch):
        """Test that the value from MAJORA_UPLOAD_EXPIRATION_MINUTES is used."""
        monkeypatch.setenv('MAJORA_UPLOAD_EXPIRATION_MINUTES', '90')
        assert Settings.upload_expiration_minutes() == 90

    def test_returns_default_when_env_is_invalid(self, monkeypatch):
        """Test that the default is returned when the env var is not an integer."""
        monkeypatch.setenv('MAJORA_UPLOAD_EXPIRATION_MINUTES', 'not-a-number')
        assert Settings.upload_expiration_minutes() == 60

    def test_returns_default_when_env_is_empty(self, monkeypatch):
        """Test that the default is returned when the env var is an empty string."""
        monkeypatch.setenv('MAJORA_UPLOAD_EXPIRATION_MINUTES', '')
        assert Settings.upload_expiration_minutes() == 60


class TestSettingsGravatarBaseUrl:
    """Tests for Settings.gravatar_base_url()."""

    def test_returns_default_when_env_not_set(self, monkeypatch):
        """Test that the default Gravatar base URL is returned when env var is absent."""
        monkeypatch.delenv('MAJORA_GRAVATAR_BASE_URL', raising=False)
        assert Settings.gravatar_base_url() == 'https://gravatar.com/avatar/'

    def test_reads_value_from_env(self, monkeypatch):
        """Test that the value from MAJORA_GRAVATAR_BASE_URL is used."""
        monkeypatch.setenv('MAJORA_GRAVATAR_BASE_URL', 'https://example.com/avatar/')
        assert Settings.gravatar_base_url() == 'https://example.com/avatar/'
