"""Versioning app configuration."""

from django.apps import AppConfig


class VersioningConfig(AppConfig):
    """Configuration for the versioning app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'versioning'
