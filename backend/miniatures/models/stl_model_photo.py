"""StlModelPhoto model for the miniatures app."""

from django.db import models

from games.models.base_photo import BasePhoto

from .stl_model import StlModel


class StlModelPhoto(BasePhoto):
    """Model representing a photo associated with an `StlModel`."""

    stl_model = models.ForeignKey(StlModel, on_delete=models.CASCADE, related_name='photos')
