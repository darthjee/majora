"""Link model for Majora RPG Campaign Management System."""

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from simple_history.models import HistoricalRecords


class Link(models.Model):
    """Model representing an external link related to any game object."""

    LINK_TYPE_LOOTSTUDIO = 'lootstudio'

    LINK_TYPE_CHOICES = [
        (LINK_TYPE_LOOTSTUDIO, 'LootStudio'),
    ]

    text = models.CharField(max_length=200)
    url = models.URLField()
    link_type = models.CharField(
        max_length=32, choices=LINK_TYPE_CHOICES, blank=True, default=''
    )
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    def __str__(self):
        """Return string representation of the link."""
        return self.text
