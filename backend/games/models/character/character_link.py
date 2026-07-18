"""CharacterLink model for Majora RPG Campaign Management System."""

from django.db import models
from simple_history.models import HistoricalRecords

from games.models.character.character import Character


class CharacterLink(models.Model):
    """Model representing an external link related to a character."""

    LINK_TYPE_LOOTSTUDIO = 'lootstudio'
    LINK_TYPE_DIARY = 'diary'
    LINK_TYPE_MUSIC = 'music'
    LINK_TYPE_STL = 'stl'
    LINK_TYPE_BACKGROUND = 'background'
    LINK_TYPE_REFERENCE = 'reference'

    LINK_TYPE_CHOICES = [
        (LINK_TYPE_LOOTSTUDIO, 'LootStudio'),
        (LINK_TYPE_DIARY, 'Diary'),
        (LINK_TYPE_MUSIC, 'Music'),
        (LINK_TYPE_STL, 'STL'),
        (LINK_TYPE_BACKGROUND, 'Background'),
        (LINK_TYPE_REFERENCE, 'Reference'),
    ]

    text = models.CharField(max_length=200)
    url = models.URLField()
    link_type = models.CharField(
        max_length=32, choices=LINK_TYPE_CHOICES, blank=True, default=''
    )
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='links')
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    def __str__(self):
        """Return string representation of the character link."""
        return self.text
