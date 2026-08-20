"""Tests for the 0003 data migration backfilling DomainConfiguration.title from Domain.title."""

import importlib

from django.apps import apps
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TestCase, TransactionTestCase

_migration = importlib.import_module('domains.migrations.0003_migrate_domain_title')

_MIGRATE_FROM = [('domains', '0002_domainconfiguration')]
_MIGRATE_TO = [('domains', '0003_migrate_domain_title')]


class TestMigrateDomainTitleNoopReverse(TestCase):
    """Tests for the 0003 migration's reverse operation."""

    def test_reverse_migration_is_a_noop(self):
        """Test that the reverse migration runs without raising and touches nothing."""
        _migration._noop_reverse(apps, None)


class TestMigrateDomainTitleMigration(TransactionTestCase):
    """Tests for the actual backfill performed by the 0003 data migration.

    Runs the real migration (schema included) against the test database, since the
    backfill's source field (`Domain.title`) is dropped by a later migration (0004) and
    therefore does not exist on the live, fully-migrated model used elsewhere in this test
    suite. `TransactionTestCase` is required (over plain `TestCase`) because the migration
    executor issues real DDL, which implicitly commits on MySQL and is incompatible with
    `TestCase`'s wrapping transaction.
    """

    @classmethod
    def tearDownClass(cls):
        """Migrate the schema forward to the latest state, undoing this test's rollback."""
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(executor.loader.graph.leaf_nodes())
        super().tearDownClass()

    def _seed_historical_group_with_domains(self, executor, name, titles):
        """Create a DomainGroup at the pre-backfill (0002) state with one Domain per title."""
        before_state = executor.loader.project_state(_MIGRATE_FROM).apps
        DomainGroup = before_state.get_model('domains', 'DomainGroup')
        Domain = before_state.get_model('domains', 'Domain')

        group = DomainGroup.objects.create(name=name)
        for index, title in enumerate(titles):
            Domain.objects.create(
                domain=f'{name.lower().replace(" ", "-")}-{index}.example.com',
                domain_group=group,
                title=title,
            )
        return group.id

    def test_backfill_uses_first_non_empty_title_in_id_order(self):
        """Test that the backfill picks the first non-empty title, ordered by domain id.

        Both assertions (mixed titles and no titles) live in a single test method because
        `TransactionTestCase` truncates all tables after every test method, which would
        otherwise wipe out fixtures shared via `setUpClass` before a second test method runs.
        """
        executor = MigrationExecutor(connection)
        executor.migrate(_MIGRATE_FROM)
        titled_group_id = self._seed_historical_group_with_domains(
            executor, 'Titled Group', ['', 'First Title', 'Second Title'],
        )
        untitled_group_id = self._seed_historical_group_with_domains(
            executor, 'Untitled Group', ['', ''],
        )

        executor = MigrationExecutor(connection)
        executor.migrate(_MIGRATE_TO)
        after_state = executor.loader.project_state(_MIGRATE_TO).apps
        DomainConfigurationAfterBackfill = after_state.get_model('domains', 'DomainConfiguration')

        titled_configuration = DomainConfigurationAfterBackfill.objects.get(
            domain_group_id=titled_group_id,
        )
        untitled_configuration = DomainConfigurationAfterBackfill.objects.get(
            domain_group_id=untitled_group_id,
        )
        assert titled_configuration.title == 'First Title'
        assert untitled_configuration.title is None
