"""Source model for the miniatures app."""

from django.db import models
from simple_history.models import HistoricalRecords


class Source(models.Model):
    """Model representing a deduplicated, global source a `StlModel` can be attributed to."""

    name = models.CharField(max_length=200, unique=True)
    url = models.CharField(max_length=200, blank=True, default='')
    photo = models.ForeignKey(
        'miniatures.SourcePhoto', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
    )
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    def __str__(self):
        """Return string representation of the source."""
        return self.name
