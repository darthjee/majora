"""Uploads app configuration."""

from django.apps import AppConfig


class UploadsConfig(AppConfig):
    """Configuration for the uploads app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'uploads'

    def ready(self):
        """Connect the cleanup of copy uploads to every copyable photo/file model."""
        from staff import copy_links

        from .signals import connect_copy_upload_cleanup

        connect_copy_upload_cleanup(copy_links.models())
