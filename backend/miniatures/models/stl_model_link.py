"""StlModelLink model for the miniatures app."""

from django.db import models

from games.models.base_link import BaseLink

from .stl_model import StlModel


class StlModelLink(BaseLink):
    """Model representing an external link related to an `StlModel`."""

    stl_model = models.ForeignKey(StlModel, on_delete=models.CASCADE, related_name='links')
