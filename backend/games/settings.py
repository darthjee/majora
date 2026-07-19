"""App-level settings for the games app."""

import os

from majora_project.env import env_int


class Settings:
    """Reads configuration from environment variables with sensible defaults."""

    @staticmethod
    def pagination_size():
        """Return the default number of items per page."""
        return env_int('MAJORA_PAGINATION_SIZE', 24)

    @staticmethod
    def password_reset_token_expiration_minutes():
        """Return the password recovery token expiration, in minutes."""
        return env_int('MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES', 30)

    @staticmethod
    def upload_expiration_minutes():
        """Return the upload token expiration duration, in minutes."""
        return env_int('MAJORA_UPLOAD_EXPIRATION_MINUTES', 60)

    @staticmethod
    def emails_enabled():
        """Return True only when email sending has been explicitly enabled."""
        return os.environ.get('EMAILS_ENABLED', 'false').lower() == 'true'

    @staticmethod
    def cache_control_anonymous_max_age():
        """Return the Cache-Control max-age for unauthenticated requests, in seconds."""
        return env_int('MAJORA_CACHE_CONTROL_ANONYMOUS_SECONDS', 3600)

    @staticmethod
    def cache_control_authenticated_max_age():
        """Return the Cache-Control max-age for authenticated requests, in seconds."""
        return env_int('MAJORA_CACHE_CONTROL_AUTHENTICATED_SECONDS', 10)

    @staticmethod
    def gravatar_base_url():
        """Return the base URL to prefix an email hash with to build a Gravatar avatar URL."""
        return os.environ.get('MAJORA_GRAVATAR_BASE_URL', 'https://gravatar.com/avatar/')
