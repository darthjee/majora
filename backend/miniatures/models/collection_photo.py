"""CollectionPhoto model for the miniatures app."""

from django.db import models

from games.models.base_photo import BasePhoto

from .collection import Collection


class CollectionPhoto(BasePhoto):
    """Model representing a gallery photo associated with a `Collection`."""

    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name='photos')
