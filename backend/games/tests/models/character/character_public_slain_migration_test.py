"""Tests for the 0041 data migration backfilling public_slain from slain."""

import importlib

from django.apps import apps
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TestCase, TransactionTestCase

_migration = importlib.import_module('games.migrations.0041_character_public_slain')

_MIGRATE_FROM = [('games', '0040_task')]
_MIGRATE_TO = [('games', '0041_character_public_slain')]


class TestCharacterPublicSlainBackfillNoopReverse(TestCase):
    """Tests for the 0041 migration's reverse operation."""

    def test_reverse_migration_is_a_noop(self):
        """Test that the reverse migration runs without raising and touches nothing."""
        _migration._noop_reverse(apps, None)


class TestCharacterPublicSlainBackfillMigration(TransactionTestCase):
    """Tests for the actual backfill performed by the 0041 data migration.

    Runs the real migration (schema included) against the test database, since the
    backfill's source field (`Character.slain`) is renamed to `private_slain` by a later
    migration and therefore does not exist on the live, fully-migrated model used elsewhere in
    this test suite. `TransactionTestCase` is required (over plain `TestCase`) because the
    migration executor issues real DDL, which implicitly commits on MySQL and is incompatible
    with `TestCase`'s wrapping transaction.
    """

    @classmethod
    def tearDownClass(cls):
        """Migrate the schema forward to the latest state, undoing this test's rollback."""
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(executor.loader.graph.leaf_nodes())
        super().tearDownClass()

    def _seed_historical_character(self, executor, **kwargs):
        """Create a Game and a Character at the pre-backfill (0040) migration state."""
        before_state = executor.loader.project_state(_MIGRATE_FROM).apps
        Game = before_state.get_model('games', 'Game')
        Character = before_state.get_model('games', 'Character')

        game = Game.objects.create(name='Test Game', game_slug='test-game')
        return Character.objects.create(game=game, name='NPC', npc=True, **kwargs).id

    def test_backfill_copies_true_slain_into_public_slain(self):
        """Test that the backfill sets public_slain to True for an already-slain character."""
        executor = MigrationExecutor(connection)
        executor.migrate(_MIGRATE_FROM)
        character_id = self._seed_historical_character(executor, slain=True)

        executor = MigrationExecutor(connection)
        executor.migrate(_MIGRATE_TO)
        after_state = executor.loader.project_state(_MIGRATE_TO).apps
        CharacterAfterBackfill = after_state.get_model('games', 'Character')

        character = CharacterAfterBackfill.objects.get(id=character_id)
        assert character.public_slain is True

    def test_backfill_copies_false_slain_into_public_slain(self):
        """Test that the backfill sets public_slain to False for an alive character."""
        executor = MigrationExecutor(connection)
        executor.migrate(_MIGRATE_FROM)
        character_id = self._seed_historical_character(executor, slain=False)

        executor = MigrationExecutor(connection)
        executor.migrate(_MIGRATE_TO)
        after_state = executor.loader.project_state(_MIGRATE_TO).apps
        CharacterAfterBackfill = after_state.get_model('games', 'Character')

        character = CharacterAfterBackfill.objects.get(id=character_id)
        assert character.public_slain is False
