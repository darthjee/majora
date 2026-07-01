"""Link model for Majora RPG Campaign Management System."""

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models


class Link(models.Model):

    """Model representing an external link related to any game object."""

    text = models.CharField(max_length=200)
    url = models.URLField()
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    def __str__(self):
        """Return string representation of the link."""
        return self.text
