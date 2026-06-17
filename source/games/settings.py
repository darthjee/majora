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
