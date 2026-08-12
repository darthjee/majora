"""Uploads app configuration."""

from django.apps import AppConfig


class UploadsConfig(AppConfig):
    """Configuration for the uploads app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'uploads'
