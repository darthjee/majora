"""SourcePhoto model for the miniatures app."""

from django.db import models

from games.models.base_photo import BasePhoto

from .source import Source


class SourcePhoto(BasePhoto):
    """Model representing a photo associated with a `Source`."""

    source = models.ForeignKey(Source, on_delete=models.CASCADE, related_name='photos')
