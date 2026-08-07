"""StlModel model for the miniatures app."""

from django.db import models
from simple_history.models import HistoricalRecords


class StlModel(models.Model):
    """Model representing a catalog entry for an STL 3D-printable file Majora links to.

    Majora never hosts the STL file itself -- only links to it (via `StlModelLink`) and
    optionally displays a representative photo (`StlModelPhoto`, via `photo`).
    """

    name = models.CharField(max_length=200)
    photo = models.ForeignKey(
        'miniatures.StlModelPhoto', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
    )
    sources = models.ManyToManyField('miniatures.Source', related_name='stl_models', blank=True)
    tags = models.ManyToManyField('miniatures.Tag', related_name='stl_models', blank=True)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the StlModel model."""

        ordering = ['id']

    def __str__(self):
        """Return string representation of the STL model."""
        return self.name
