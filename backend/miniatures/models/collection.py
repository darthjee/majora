"""Collection model for the miniatures app."""

from django.db import models
from simple_history.models import HistoricalRecords


class Collection(models.Model):
    """Model representing a named grouping of related `StlModel`s.

    A `Collection` optionally belongs to a `Source` and can be linked to many `StlModel`s (see
    `StlModel.collections`).
    """

    name = models.CharField(max_length=200, unique=True)
    #: `default=None` (not just `null=True, blank=True`) is required so an omitted `url` is
    #: stored as a real `NULL`, not `''` -- the DB engine's `Field.get_default()` would otherwise
    #: fall back to `''` for a `CharField`, which would collide under `unique=True` on the second
    #: url-less `Collection`.
    url = models.CharField(max_length=200, unique=True, null=True, blank=True, default=None)
    source = models.ForeignKey(
        'miniatures.Source', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='collections',
    )
    photo = models.ForeignKey(
        'miniatures.CollectionPhoto', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
    )
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    def __str__(self):
        """Return string representation of the collection."""
        return self.name
