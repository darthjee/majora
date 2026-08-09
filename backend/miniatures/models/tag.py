"""Tag model for the miniatures app."""

from django.db import models
from simple_history.models import HistoricalRecords


class Tag(models.Model):
    """Model representing a deduplicated, global tag a `StlModel` can be labeled with."""

    #: Shared with `StlModelCreateSerializer.tags` so both can never drift apart.
    NAME_MAX_LENGTH = 200

    name = models.CharField(max_length=NAME_MAX_LENGTH, unique=True)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    def __str__(self):
        """Return string representation of the tag."""
        return self.name
