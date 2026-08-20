"""Models for the domains app."""

from django.core.validators import RegexValidator
from django.db import models
from simple_history.models import HistoricalRecords

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


class DomainGroup(models.Model):
    """Model representing a tenant/brand reachable through multiple hostnames."""

    name = models.CharField(max_length=200)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    def __str__(self):
        """Return string representation of the domain group."""
        return self.name


class Domain(models.Model):
    """Model representing a hostname that resolves to a DomainGroup."""

    domain = models.CharField(max_length=200, unique=True, validators=[validate_domain])
    domain_group = models.ForeignKey(
        DomainGroup, on_delete=models.CASCADE, related_name='domains'
    )
    schemes = models.CharField(max_length=20, default='https', validators=[validate_schemes])
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    def save(self, *args, **kwargs):
        """Save the domain, normalizing it to lowercase first."""
        self.domain = self.domain.lower()
        super().save(*args, **kwargs)

    def __str__(self):
        """Return string representation of the domain."""
        return self.domain

    @property
    def origins(self):
        """Return this domain's `scheme://domain` origins, one per configured scheme."""
        return [f'{scheme}://{self.domain}' for scheme in self.schemes.split(',')]


class DomainConfiguration(models.Model):
    """Model representing per-DomainGroup branding overrides (title, sub-title, favicon)."""

    domain_group = models.OneToOneField(
        DomainGroup, on_delete=models.CASCADE, related_name='configuration'
    )
    favicon = models.CharField(max_length=200, null=True, blank=True, default=None)
    title = models.CharField(max_length=200, null=True, blank=True, default=None)
    sub_title = models.CharField(max_length=200, null=True, blank=True, default=None)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    def __str__(self):
        """Return string representation of the domain configuration."""
        return f'Configuration for {self.domain_group}'
