"""Data migration backfilling DomainConfiguration.title from Domain.title.

Ensures every DomainGroup ends up with exactly one DomainConfiguration row, seeded with
the first non-empty title among its domains (or left `None` if none of them have one).
"""

from django.db import migrations


def _migrate_domain_titles(apps, schema_editor):
    """Create/update every DomainGroup's DomainConfiguration with its domains' title."""
    DomainGroup = apps.get_model('domains', 'DomainGroup')
    DomainConfiguration = apps.get_model('domains', 'DomainConfiguration')

    for domain_group in DomainGroup.objects.all():
        _migrate_group_title(domain_group, DomainConfiguration)


def _migrate_group_title(domain_group, DomainConfiguration):
    """Create domain_group's DomainConfiguration, seeding its title from its domains."""
    configuration, _ = DomainConfiguration.objects.get_or_create(domain_group=domain_group)
    title = _first_domain_title(domain_group)
    if title:
        configuration.title = title
        configuration.save()


def _first_domain_title(domain_group):
    """Return domain_group's first non-empty Domain.title (ordered by id), or None."""
    domain = domain_group.domains.exclude(title='').order_by('id').first()
    return domain.title if domain else None


def _noop_reverse(apps, schema_editor):
    """No-op reverse migration — reversal leaves the backfilled DomainConfiguration rows."""


class Migration(migrations.Migration):
    """Backfill DomainConfiguration.title from Domain.title before Domain.title is dropped."""

    dependencies = [
        ('domains', '0002_domainconfiguration'),
    ]

    operations = [
        migrations.RunPython(_migrate_domain_titles, _noop_reverse),
    ]
