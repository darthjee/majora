"""URL-building helpers for the accounts app."""

from django.conf import settings


class FrontendBaseUrl:
    """Normalizes FRONTEND_BASE_URL into a scheme-qualified base with no trailing slash."""

    def __init__(self, raw_value=None):
        """Store the raw value to normalize, defaulting to `settings.FRONTEND_BASE_URL`."""
        self._raw_value = settings.FRONTEND_BASE_URL if raw_value is None else raw_value

    def build(self):
        """Return the normalized base URL: scheme-qualified, with no trailing slash."""
        base = self._raw_value.strip()
        base = self._with_scheme(base)
        return base.rstrip('/')

    def _with_scheme(self, base):
        """Prepend the default https scheme when `base` has none."""
        if '://' not in base:
            return f'https://{base}'
        return base
