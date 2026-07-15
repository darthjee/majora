"""Gravatar avatar URL construction for the games app."""

from .settings import Settings


class GravatarUrlBuilder:
    """Builds a Gravatar avatar URL from a user's precomputed email hash."""

    @staticmethod
    def build(email_hash):
        """Return the Gravatar avatar URL for `email_hash`, or None if there's no hash."""
        if not email_hash:
            return None
        return f'{Settings.gravatar_base_url()}{email_hash}'
