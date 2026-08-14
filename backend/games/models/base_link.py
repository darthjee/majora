"""BaseLink abstract model for Majora RPG Campaign Management System."""

from django.core.validators import URLValidator
from django.db import models
from simple_history.models import HistoricalRecords


class BaseLink(models.Model):
    """Abstract base model for external links shared across games and characters."""

    LINK_TYPE_LOOTSTUDIO = 'lootstudio'
    LINK_TYPE_YOUTUBE = 'youtube'
    LINK_TYPE_DIARY = 'diary'
    LINK_TYPE_MUSIC = 'music'
    LINK_TYPE_STL = 'stl'
    LINK_TYPE_BACKGROUND = 'background'
    LINK_TYPE_REFERENCE = 'reference'

    LINK_TYPE_CHOICES = [
        (LINK_TYPE_LOOTSTUDIO, 'LootStudio'),
        (LINK_TYPE_YOUTUBE, 'YouTube'),
        (LINK_TYPE_DIARY, 'Diary'),
        (LINK_TYPE_MUSIC, 'Music'),
        (LINK_TYPE_STL, 'STL'),
        (LINK_TYPE_BACKGROUND, 'Background'),
        (LINK_TYPE_REFERENCE, 'Reference'),
    ]

    text = models.CharField(max_length=200)
    url = models.URLField(validators=[URLValidator(schemes=['http', 'https'])])
    link_type = models.CharField(
        max_length=32, choices=LINK_TYPE_CHOICES, blank=True, default=''
    )
    history = HistoricalRecords(app='versioning', user_db_constraint=False, inherit=True)

    class Meta:
        """Meta options for BaseLink."""

        abstract = True

    def __str__(self):
        """Return string representation of the link."""
        return self.text
