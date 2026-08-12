"""FactionPhoto model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.base_photo import BasePhoto
from games.models.faction.faction import Faction


class FactionPhoto(BasePhoto):
    """Model representing a photo associated with a faction."""

    faction = models.ForeignKey(Faction, on_delete=models.CASCADE, related_name='photos')
