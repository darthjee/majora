"""Opt-in seed registering the local development hosts as `Domain` rows (issue #1727)."""

import os

from django.db import IntegrityError, transaction

from domains.models import Domain, DomainGroup
from games.models import Game

DEV_HOSTS = ('localhost', '127.0.0.1')


class DevDomainsSeedGuard:
    """Decides whether the dev domains seed may run in the current environment."""

    def __init__(self, environ=None):
        """Store the environment mapping to read (defaults to `os.environ`)."""
        self._environ = os.environ if environ is None else environ

    def skip_reason(self):
        """Return why the seed must be skipped, or `None` when it may run."""
        if self._environ.get('STAGE') == 'production':
            return 'STAGE is production'
        if self._environ.get('SEED_DEV_DOMAINS') != 'true':
            return 'SEED_DEV_DOMAINS is not "true"'
        return None


class DevHostCreator:
    """Ensures one dev host has a `Domain` row, leaving an existing row untouched."""

    SCHEMES = 'http'

    def __init__(self, group):
        """Store the `DomainGroup` new hosts are created in."""
        self._group = group

    def ensure(self, host):
        """Create `host` when missing and return a one-line report of what happened."""
        if Domain.objects.filter(domain=host).exists():
            return f'Domain {host} already present'
        try:
            self._create(host)
        except IntegrityError:
            return f'Domain {host} already present (created concurrently)'
        return f'Created domain {host} ({self.SCHEMES}) in group "{self._group.name}"'

    def _create(self, host):
        """Validate and insert `host` inside a savepoint, so a duplicate does not poison it."""
        Domain(domain=host, domain_group=self._group, schemes=self.SCHEMES).full_clean(
            validate_unique=False
        )
        with transaction.atomic():
            Domain.objects.create(domain=host, domain_group=self._group, schemes=self.SCHEMES)


class GroupGamesAttacher:
    """Attaches every `Game` not yet linked to a `DomainGroup`."""

    def attach(self, group):
        """Link the missing games to `group` and return a one-line report."""
        games = list(Game.objects.exclude(game_domain_groups=group))
        if not games:
            return f'Group "{group.name}" already has every game'
        group.games.add(*games)
        return f'Attached {len(games)} game(s) to group "{group.name}"'


class DevDomainsSeeder:
    """Registers the dev hosts and gives their domain groups access to every game."""

    DEFAULT_GROUP_NAME = 'Local development'

    def seed(self):
        """Run the seed atomically and return its report lines."""
        with transaction.atomic():
            creator = DevHostCreator(self._target_group())
            reports = [creator.ensure(host) for host in DEV_HOSTS]
            attacher = GroupGamesAttacher()
            reports += [attacher.attach(group) for group in self._seeded_groups()]
        return reports

    def _target_group(self):
        """Return the group of an existing `localhost` row, or the default dev group."""
        localhost = Domain.objects.filter(domain='localhost').select_related('domain_group')
        existing = localhost.first()
        return existing.domain_group if existing else self._default_group()

    def _default_group(self):
        """Return the first group named `DEFAULT_GROUP_NAME`, creating it when missing."""
        group = DomainGroup.objects.filter(name=self.DEFAULT_GROUP_NAME).order_by('id').first()
        return group or DomainGroup.objects.create(name=self.DEFAULT_GROUP_NAME)

    def _seeded_groups(self):
        """Return the distinct groups owning any of the dev hosts, in id order."""
        return DomainGroup.objects.filter(domains__domain__in=DEV_HOSTS).distinct().order_by('id')
