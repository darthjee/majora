"""StlModelRole model for the miniatures app."""

from django.db import models

from .stl_model import StlModel


class StlModelRole(models.Model):
    """Model representing one role tag attached to an `StlModel` (a many-valued field)."""

    stl_model = models.ForeignKey(StlModel, on_delete=models.CASCADE, related_name='roles')
    role = models.CharField(max_length=16, choices=StlModel.ROLE_CHOICES)

    class Meta:
        """Metadata for the StlModelRole model."""

        unique_together = [('stl_model', 'role')]

    def __str__(self):
        """Return string representation of the STL model role."""
        return f'StlModelRole(stl_model={self.stl_model_id}, role={self.role})'
