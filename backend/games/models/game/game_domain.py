"""GameDomain model for Majora RPG Campaign Management System."""

from django.core.validators import RegexValidator
from django.db import models
from simple_history.models import HistoricalRecords

from games.models.game.game_domain_group import GameDomainGroup

validate_schemes = RegexValidator(
    regex=r'^(http|https)(,(http|https))*$',
    message='schemes must be a comma-separated list made only of "http"/"https".',
)

validate_domain = RegexValidator(
    regex=(
        r'\A([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)'
        r'(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+\Z'
    ),
    message='domain must be a valid hostname (labels of letters, digits and hyphens '
    'separated by dots, no wildcards or whitespace).',
)


class GameDomain(models.Model):
    """Model representing a hostname that resolves to a GameDomainGroup."""

    domain = models.CharField(max_length=200, unique=True, validators=[validate_domain])
    game_domain_group = models.ForeignKey(
        GameDomainGroup, on_delete=models.CASCADE, related_name='domains'
    )
    schemes = models.CharField(max_length=20, default='https', validators=[validate_schemes])
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    def __str__(self):
        """Return string representation of the game domain."""
        return self.domain

    @property
    def origins(self):
        """Return this domain's `scheme://domain` origins, one per configured scheme."""
        return [f'{scheme}://{self.domain}' for scheme in self.schemes.split(',')]
