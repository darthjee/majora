"""StlModel model for the miniatures app."""

from django.core.validators import URLValidator
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
    RACE_TURTLEFOLK = 'turtlefolk'
    RACE_CTHULHUFOLK = 'cthulhufolk'
    RACE_HUMANOID = 'humanoid'
    RACE_CONSTRUCT = 'construct'
    RACE_MONSTROSITY = 'monstrosity'
    RACE_UNDEAD = 'undead'
    RACE_ABERRATION = 'aberration'
    RACE_BEAST = 'beast'
    RACE_ALIEN = 'alien'
    RACE_FIEND = 'fiend'
    RACE_FEY = 'fey'
    RACE_GIANT = 'giant'
    RACE_DRAGON = 'dragon'
    RACE_CELESTIAL = 'celestial'
    RACE_ELEMENTAL = 'elemental'
    RACE_CYBORG = 'cyborg'
    RACE_PLANT = 'plant'
    RACE_OOZE = 'ooze'
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
        (RACE_TURTLEFOLK, 'Turtlefolk'),
        (RACE_CTHULHUFOLK, 'Cthulhufolk'),
        (RACE_HUMANOID, 'Humanoid'),
        (RACE_CONSTRUCT, 'Construct'),
        (RACE_MONSTROSITY, 'Monstrosity'),
        (RACE_UNDEAD, 'Undead'),
        (RACE_ABERRATION, 'Aberration'),
        (RACE_BEAST, 'Beast'),
        (RACE_ALIEN, 'Alien'),
        (RACE_FIEND, 'Fiend'),
        (RACE_FEY, 'Fey'),
        (RACE_GIANT, 'Giant'),
        (RACE_DRAGON, 'Dragon'),
        (RACE_CELESTIAL, 'Celestial'),
        (RACE_ELEMENTAL, 'Elemental'),
        (RACE_CYBORG, 'Cyborg'),
        (RACE_PLANT, 'Plant'),
        (RACE_OOZE, 'Ooze'),
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

    SIZE_TINY = 'tiny'
    SIZE_SMALL = 'small'
    SIZE_MEDIUM = 'medium'
    SIZE_HUGE = 'huge'
    SIZE_GARGANTUAN = 'gargantuan'
    SIZE_LIFE = 'life'
    SIZE_CHOICES = [
        (SIZE_TINY, 'Tiny'),
        (SIZE_SMALL, 'Small'),
        (SIZE_MEDIUM, 'Medium'),
        (SIZE_HUGE, 'Huge'),
        (SIZE_GARGANTUAN, 'Gargantuan'),
        (SIZE_LIFE, 'Life'),
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
    #: `default=None` (not just `null=True, blank=True`) is required so an omitted `url` is
    #: stored as a real `NULL`, not `''` -- see `Collection.url`'s comment for the same
    #: reasoning. The scheme-restricted validator additionally rejects non-http(s) URIs (e.g.
    #: `javascript:`) to prevent stored XSS on the show page.
    url = models.URLField(
        max_length=200, unique=True, null=True, blank=True, default=None,
        validators=[URLValidator(schemes=['http', 'https'])],
    )
    size = models.CharField(max_length=16, choices=SIZE_CHOICES, null=True, blank=True)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the StlModel model."""

        ordering = ['id']

    def __str__(self):
        """Return string representation of the STL model."""
        return self.name
