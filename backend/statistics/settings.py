"""App-level settings for the statistics app."""

from majora_project.env import env_int


class Settings:
    """Reads configuration from environment variables with sensible defaults."""

    @staticmethod
    def cookie_max_age_seconds():
        """Return the statistics cookie's max-age, in seconds (default: 2 years)."""
        return env_int('MAJORA_STATISTICS_COOKIE_MAX_AGE_SECONDS', 60 * 60 * 24 * 365 * 2)
