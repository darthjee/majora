"""App-level settings for the statistics app."""

import os

from majora_project.env import env_int


class Settings:
    """Reads configuration from environment variables with sensible defaults."""

    @staticmethod
    def cookie_max_age_seconds():
        """Return the statistics cookie's max-age, in seconds (default: 2 years)."""
        return env_int('MAJORA_STATISTICS_COOKIE_MAX_AGE_SECONDS', 60 * 60 * 24 * 365 * 2)

    @staticmethod
    def skip_secret():
        """Return the configured statistics-skip secret, or '' if unset (feature disabled)."""
        return os.environ.get('STATISTICS_SKIP_SECRET', '')

    @staticmethod
    def visit_inactivity_seconds():
        """Return the inactivity window after which a new visit is opened (default: 30 min)."""
        return env_int('MAJORA_STATISTICS_VISIT_INACTIVITY_SECONDS', 30 * 60)

    @staticmethod
    def session_touch_interval_seconds():
        """Return how stale `Session.last_seen_at` must be before it is rewritten (default: 60s)."""
        return env_int('MAJORA_STATISTICS_SESSION_TOUCH_INTERVAL_SECONDS', 60)

    @staticmethod
    def max_range_days():
        """Return the maximum inclusive day span of a statistics query (default: 366)."""
        return env_int('MAJORA_STATISTICS_MAX_RANGE_DAYS', 366)
