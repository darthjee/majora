"""Tests for the 0008 migration renaming the PasswordResetToken physical table.

`accounts/0008_rename_passwordresettoken_table` is a `SeparateDatabaseAndState`
operation: it retargets the model state from `games_passwordresettoken` to the
app-label default `accounts_passwordresettoken` and issues the matching
`RENAME TABLE` DDL (with a reverse). These tests cover both halves — the
migration-state change via `historical_apps`, and the forward/reverse DDL via a
real `MigrationExecutor` run against the test database.
"""

from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TestCase, TransactionTestCase

from accounts.models import PasswordResetToken
from games.tests.migration_state import historical_apps

_MIGRATE_FROM = [('accounts', '0007_cachetoken')]
_MIGRATE_TO = [('accounts', '0008_rename_passwordresettoken_table')]


class TestPasswordResetTokenTableState(TestCase):
    """Tests for the model-state half of the 0008 rename migration."""

    def test_table_before_rename_is_games_passwordresettoken(self):
        """Test that state at 0007 still points the model at the old table name."""
        model = historical_apps('accounts', '0007_cachetoken').get_model(
            'accounts', 'PasswordResetToken'
        )
        assert model._meta.db_table == 'games_passwordresettoken'

    def test_table_after_rename_is_accounts_passwordresettoken(self):
        """Test that state at 0008 retargets the model to the app-label default table."""
        model = historical_apps(
            'accounts', '0008_rename_passwordresettoken_table'
        ).get_model('accounts', 'PasswordResetToken')
        assert model._meta.db_table == 'accounts_passwordresettoken'

    def test_live_model_uses_accounts_passwordresettoken(self):
        """Test that the live model has no override and uses the app-label default table."""
        assert PasswordResetToken._meta.db_table == 'accounts_passwordresettoken'


class TestPasswordResetTokenTableRenameDDL(TransactionTestCase):
    """Tests for the forward and reverse DDL of the 0008 rename migration.

    `TransactionTestCase` is required (over plain `TestCase`) because the migration
    executor issues real DDL, which implicitly commits on MySQL and is incompatible
    with `TestCase`'s wrapping transaction.
    """

    @classmethod
    def tearDownClass(cls):
        """Migrate the schema forward to the latest state, undoing this test's rollback."""
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(executor.loader.graph.leaf_nodes())
        super().tearDownClass()

    def test_forward_then_reverse_renames_the_physical_table(self):
        """Test that 0008 renames the table forward and restores it on reverse."""
        executor = MigrationExecutor(connection)
        executor.migrate(_MIGRATE_FROM)
        tables = connection.introspection.table_names()
        assert 'games_passwordresettoken' in tables
        assert 'accounts_passwordresettoken' not in tables

        executor = MigrationExecutor(connection)
        executor.migrate(_MIGRATE_TO)
        tables = connection.introspection.table_names()
        assert 'accounts_passwordresettoken' in tables
        assert 'games_passwordresettoken' not in tables

        executor = MigrationExecutor(connection)
        executor.migrate(_MIGRATE_FROM)
        tables = connection.introspection.table_names()
        assert 'games_passwordresettoken' in tables
        assert 'accounts_passwordresettoken' not in tables
