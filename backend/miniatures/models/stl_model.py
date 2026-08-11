"""StlModel model for the miniatures app."""

from django.db import models
from simple_history.models import HistoricalRecords


class StlModel(models.Model):
    """Model representing a catalog entry for an STL 3D-printable file Majora links to.

    Majora never hosts the STL file itself -- only links to it (via `StlModelLink`) and
    optionally displays a representative photo (`StlModelPhoto`, via `photo`).
    """

    TYPE_TERRAIN = 'terrain'
    TYPE_PROP = 'prop'
    TYPE_CREATURE = 'creature'
    TYPE_OTHER = 'other'
    TYPE_CHOICES = [
        (TYPE_TERRAIN, 'Terrain'),
        (TYPE_PROP, 'Prop'),
        (TYPE_CREATURE, 'Creature'),
        (TYPE_OTHER, 'Other'),
    ]

    RACE_HUMAN = 'human'
    RACE_ELF = 'elf'
    RACE_DWARF = 'dwarf'
    RACE_HALFLING = 'halfling'
    RACE_GNOME = 'gnome'
    RACE_HALF_ELF = 'half-elf'
    RACE_HALF_ORC = 'half-orc'
    RACE_TIEFLING = 'tiefling'
    RACE_DRAGONBORN = 'dragonborn'
    RACE_ORC = 'orc'
    RACE_GOBLIN = 'goblin'
    RACE_CHOICES = [
        (RACE_HUMAN, 'Human'),
        (RACE_ELF, 'Elf'),
        (RACE_DWARF, 'Dwarf'),
        (RACE_HALFLING, 'Halfling'),
        (RACE_GNOME, 'Gnome'),
        (RACE_HALF_ELF, 'Half-Elf'),
        (RACE_HALF_ORC, 'Half-Orc'),
        (RACE_TIEFLING, 'Tiefling'),
        (RACE_DRAGONBORN, 'Dragonborn'),
        (RACE_ORC, 'Orc'),
        (RACE_GOBLIN, 'Goblin'),
    ]

    ROLE_BARBARIAN = 'barbarian'
    ROLE_BARD = 'bard'
    ROLE_CLERIC = 'cleric'
    ROLE_DRUID = 'druid'
    ROLE_FIGHTER = 'fighter'
    ROLE_MONK = 'monk'
    ROLE_PALADIN = 'paladin'
    ROLE_RANGER = 'ranger'
    ROLE_ROGUE = 'rogue'
    ROLE_SORCERER = 'sorcerer'
    ROLE_WARLOCK = 'warlock'
    ROLE_WIZARD = 'wizard'
    ROLE_ARCHER = 'archer'
    ROLE_CHOICES = [
        (ROLE_BARBARIAN, 'Barbarian'),
        (ROLE_BARD, 'Bard'),
        (ROLE_CLERIC, 'Cleric'),
        (ROLE_DRUID, 'Druid'),
        (ROLE_FIGHTER, 'Fighter'),
        (ROLE_MONK, 'Monk'),
        (ROLE_PALADIN, 'Paladin'),
        (ROLE_RANGER, 'Ranger'),
        (ROLE_ROGUE, 'Rogue'),
        (ROLE_SORCERER, 'Sorcerer'),
        (ROLE_WARLOCK, 'Warlock'),
        (ROLE_WIZARD, 'Wizard'),
        (ROLE_ARCHER, 'Archer'),
    ]

    name = models.CharField(max_length=200)
    photo = models.ForeignKey(
        'miniatures.StlModelPhoto', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
    )
    sources = models.ManyToManyField('miniatures.Source', related_name='stl_models', blank=True)
    collections = models.ManyToManyField(
        'miniatures.Collection', related_name='stl_models', blank=True,
    )
    tags = models.ManyToManyField('miniatures.Tag', related_name='stl_models', blank=True)
    owned = models.BooleanField(default=True)
    type = models.CharField(max_length=16, choices=TYPE_CHOICES)
    race = models.CharField(max_length=16, choices=RACE_CHOICES, null=True, blank=True)
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, null=True, blank=True)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the StlModel model."""

        ordering = ['id']

    def __str__(self):
        """Return string representation of the STL model."""
        return self.name
