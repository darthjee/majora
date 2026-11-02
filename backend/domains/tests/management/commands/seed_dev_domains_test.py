"""Tests for the `seed_dev_domains` management command."""

import os
from io import StringIO
from unittest.mock import patch

import pytest
from django.core.management import call_command
from django.db import IntegrityError

from domains.models import Domain, DomainGroup
from domains.tests.factories import DomainFactory, DomainGroupFactory
from games.tests.factories.game import GameFactory

ENABLED_ENV = {'SEED_DEV_DOMAINS': 'true', 'STAGE': 'development'}


def run_seed(env=None):
    """Run `seed_dev_domains` with exactly the given seed env vars and return its output."""
    out = StringIO()
    with patch.dict(os.environ, {}):
        os.environ.pop('SEED_DEV_DOMAINS', None)
        os.environ.pop('STAGE', None)
        os.environ.update(ENABLED_ENV if env is None else env)
        call_command('seed_dev_domains', stdout=out)
    return out.getvalue()


@pytest.mark.django_db
class TestSeedDevDomainsOnEmptyDatabase:
    """Tests for `seed_dev_domains` when no dev domain exists yet."""

    def setup_method(self):
        """Create two games and run the seed once."""
        self.games = [GameFactory(), GameFactory()]
        self.output = run_seed()

    def test_creates_both_hosts_in_the_local_development_group(self):
        """Test that localhost and 127.0.0.1 are created under "Local development"."""
        groups = {d.domain: d.domain_group.name for d in Domain.objects.all()}
        assert groups == {'localhost': 'Local development', '127.0.0.1': 'Local development'}

    def test_creates_hosts_with_http_scheme(self):
        """Test that the new hosts only accept plain http."""
        assert set(Domain.objects.values_list('schemes', flat=True)) == {'http'}

    def test_attaches_every_game(self):
        """Test that every game is attached to the dev group."""
        group = DomainGroup.objects.get(name='Local development')
        assert set(group.games.all()) == set(self.games)

    def test_reports_created_hosts_and_attached_games(self):
        """Test that the output names each created host and the attached game count."""
        assert 'Created domain localhost (http)' in self.output
        assert 'Created domain 127.0.0.1 (http)' in self.output
        assert 'Attached 2 game(s) to group "Local development"' in self.output

    def test_second_run_changes_nothing(self):
        """Test that a second run only reports already present rows."""
        output = run_seed()
        assert 'Created' not in output
        assert 'Attached' not in output
        assert Domain.objects.count() == 2
        assert DomainGroup.objects.count() == 1


@pytest.mark.django_db
class TestSeedDevDomainsWithExistingRows:
    """Tests for `seed_dev_domains` when some dev domains already exist."""

    def setup_method(self):
        """Create a game and a custom group already owning localhost over https."""
        self.game = GameFactory()
        self.group = DomainGroupFactory(name='Custom')
        self.localhost = DomainFactory(
            domain='localhost', domain_group=self.group, schemes='https'
        )

    def test_keeps_existing_localhost_untouched(self):
        """Test that an existing localhost keeps its group and schemes."""
        run_seed()
        self.localhost.refresh_from_db()
        assert self.localhost.domain_group == self.group
        assert self.localhost.schemes == 'https'

    def test_creates_missing_host_in_the_localhost_group(self):
        """Test that 127.0.0.1 is created in the group of the existing localhost."""
        run_seed()
        assert Domain.objects.get(domain='127.0.0.1').domain_group == self.group
        assert not DomainGroup.objects.filter(name='Local development').exists()

    def test_attaches_games_to_the_localhost_group(self):
        """Test that the existing localhost group gains every game."""
        run_seed()
        assert list(self.group.games.all()) == [self.game]

    def test_attaches_games_to_every_dev_host_group(self):
        """Test that dev hosts in different groups both receive every game."""
        other = DomainGroupFactory(name='Other')
        DomainFactory(domain='127.0.0.1', domain_group=other, schemes='http,https')
        run_seed()
        assert list(self.group.games.all()) == [self.game]
        assert list(other.games.all()) == [self.game]
        assert Domain.objects.get(domain='127.0.0.1').schemes == 'http,https'


@pytest.mark.django_db
class TestSeedDevDomainsGuard:
    """Tests for the `seed_dev_domains` opt-in guard."""

    def setup_method(self):
        """Create a game that an unguarded seed would attach."""
        GameFactory()

    @pytest.mark.parametrize('value', [None, 'false', 'TRUE', '1'])
    def test_skips_unless_seed_flag_is_true(self, value):
        """Test that nothing is written unless SEED_DEV_DOMAINS is exactly "true"."""
        env = {'STAGE': 'development'}
        if value is not None:
            env['SEED_DEV_DOMAINS'] = value
        output = run_seed(env)
        assert 'skipped: SEED_DEV_DOMAINS is not "true"' in output
        assert not Domain.objects.exists()

    def test_skips_in_production(self):
        """Test that nothing is written when STAGE is production."""
        output = run_seed({'SEED_DEV_DOMAINS': 'true', 'STAGE': 'production'})
        assert 'skipped: STAGE is production' in output
        assert not DomainGroup.objects.exists()


@pytest.mark.django_db
class TestSeedDevDomainsConcurrentCreate:
    """Tests for `seed_dev_domains` when a concurrent seed creates a host first."""

    def setup_method(self):
        """Make the first `Domain.objects.create` call insert the row and then fail."""
        self.real_create = Domain.objects.create
        self.calls = []

    def _create_then_fail_once(self, **kwargs):
        """Insert the row, then raise `IntegrityError` on the first call only."""
        self.calls.append(kwargs['domain'])
        domain = self.real_create(**kwargs)
        if len(self.calls) == 1:
            raise IntegrityError('Duplicate entry')
        return domain

    def test_integrity_error_on_create_is_handled(self):
        """Test that a duplicate on create is reported as present and the seed continues."""
        with patch.object(Domain.objects, 'create', side_effect=self._create_then_fail_once):
            output = run_seed()
        assert 'Domain localhost already present (created concurrently)' in output
        assert Domain.objects.filter(domain='127.0.0.1').exists()
