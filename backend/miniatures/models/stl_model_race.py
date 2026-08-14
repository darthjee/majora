"""StlModelRace model for the miniatures app."""

from django.db import models

from .stl_model import StlModel


class StlModelRace(models.Model):
    """Model representing one race tag attached to an `StlModel` (a many-valued field)."""

    stl_model = models.ForeignKey(StlModel, on_delete=models.CASCADE, related_name='races')
    creature = models.CharField(max_length=16, choices=StlModel.RACE_CHOICES)

    class Meta:
        """Metadata for the StlModelRace model."""

        unique_together = [('stl_model', 'creature')]

    def __str__(self):
        """Return string representation of the STL model race."""
        return f'StlModelRace(stl_model={self.stl_model_id}, creature={self.creature})'
