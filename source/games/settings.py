"""App-level settings for the games app."""

import os


class Settings:
    """Reads configuration from environment variables with sensible defaults."""

    @staticmethod
    def pagination_size():
        """Return the default number of items per page."""
        try:
            return int(os.environ.get('MAJORA_PAGINATION_SIZE', 16))
        except (ValueError, TypeError):
            return 16

    @staticmethod
    def password_reset_token_expiration_minutes():
        """Return the password recovery token expiration, in minutes."""
        try:
            return int(os.environ.get('MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES', 30))
        except (ValueError, TypeError):
            return 30
