"""App-level settings for the statistics app."""

import os


class Settings:
    """Reads configuration from environment variables with sensible defaults."""

    @staticmethod
    def cookie_max_age_seconds():
        """Return the statistics cookie's max-age, in seconds (default: 2 years)."""
        try:
            return int(
                os.environ.get('MAJORA_STATISTICS_COOKIE_MAX_AGE_SECONDS', 60 * 60 * 24 * 365 * 2)
            )
        except (ValueError, TypeError):
            return 60 * 60 * 24 * 365 * 2
