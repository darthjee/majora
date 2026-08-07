"""Staff app configuration."""

from django.apps import AppConfig


class StaffConfig(AppConfig):
    """Configuration for the staff app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'staff'
