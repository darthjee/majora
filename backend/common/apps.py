"""Common app configuration."""

from django.apps import AppConfig


class CommonConfig(AppConfig):
    """Configuration for the common app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'common'

    def ready(self):
        """Warn at startup when production runs without the proxy shared secret."""
        from .client_ip import warn_if_proxy_secret_missing

        warn_if_proxy_secret_missing()
