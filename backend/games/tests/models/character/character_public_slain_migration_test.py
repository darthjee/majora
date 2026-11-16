"""Tests for the 0041 data migration backfilling public_slain from slain."""

import importlib

from django.apps import apps
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TestCase, TransactionTestCase

from games.models import Character
from games.tests.factories import CharacterFactory
from games.tests.migration_state import MigrationRollback

_migration = importlib.import_module('games.migrations.0041_character_public_slain')

_BACKFILL = ('games', '0041_character_public_slain')
_RENAME_TO_PRIVATE = ('games', '0073_rename_slain_and_allegiance_to_private')


class TestCharacterPublicSlainBackfillNoopReverse(TestCase):
    """Tests for the 0041 migration's reverse operation."""

    def test_reverse_migration_is_a_noop(self):
        """Test that the reverse migration runs without raising and touches nothing."""
        _migration._noop_reverse(apps, None)


# transactional: migrates the schema with MigrationExecutor; DDL commits implicitly on MySQL
class TestCharacterPublicSlainBackfillMigration(TransactionTestCase):
    """Tests for the actual backfill performed by the 0041 data migration.

    Runs the real migration (schema included) against the test database, since the
    backfill's source field (`Character.slain`) is renamed to `private_slain` by a later
    migration and therefore does not exist on the live, fully-migrated model used elsewhere in
    this test suite. Only 0073 and 0041 are rolled back (see `MigrationRollback`), instead of
    every migration after 0040. `TransactionTestCase` is required (over plain `TestCase`)
    because the migration executor issues real DDL, which implicitly commits on MySQL and is
    incompatible with `TestCase`'s wrapping transaction.
    """

    @classmethod
    def tearDownClass(cls):
        """Migrate the schema forward to the latest state, as a safety net for the rollback."""
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(executor.loader.graph.leaf_nodes())
        super().tearDownClass()

    def _backfilled_public_slain(self, private_slain):
        """Seed a character, re-run 0041 on it and return its resulting `public_slain`."""
        character_id = CharacterFactory(private_slain=private_slain).id
        rollback = MigrationRollback([_BACKFILL, _RENAME_TO_PRIVATE])
        self.addCleanup(rollback.restore)
        rollback.unapply()

        rollback.apply(_BACKFILL)
        rollback.restore()
        return Character.objects.values_list('public_slain', flat=True).get(id=character_id)

    def test_backfill_copies_true_slain_into_public_slain(self):
        """Test that the backfill sets public_slain to True for an already-slain character."""
        assert self._backfilled_public_slain(private_slain=True) is True

    def test_backfill_copies_false_slain_into_public_slain(self):
        """Test that the backfill sets public_slain to False for an alive character."""
        assert self._backfilled_public_slain(private_slain=False) is False
