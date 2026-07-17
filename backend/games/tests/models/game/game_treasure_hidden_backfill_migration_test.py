"""Tests for the 0059 data migration backfilling GameTreasure.hidden from Treasure.hidden."""

import importlib

from django.apps import apps
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TestCase, TransactionTestCase

_migration = importlib.import_module('games.migrations.0059_backfill_gametreasure_hidden')

_MIGRATE_FROM = [('games', '0058_gametreasure_hidden')]
_MIGRATE_TO = [('games', '0059_backfill_gametreasure_hidden')]


class TestGameTreasureHiddenBackfillNoopReverse(TestCase):
    """Tests for the 0059 migration's reverse operation."""

    def test_reverse_migration_is_a_noop(self):
        """Test that the reverse migration runs without raising and touches nothing."""
        _migration._noop_reverse(apps, None)


class TestGameTreasureHiddenBackfillMigration(TransactionTestCase):
    """Tests for the actual backfill performed by the 0059 data migration.

    Runs the real migration (schema included) against the test database, since the
    backfill's source field (`Treasure.hidden`) is dropped by a later migration (0060) and
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

    def _seed_historical_fixtures(self, executor):
        """Create a hidden and a visible Treasure/GameTreasure pair at the pre-backfill state."""
        before_state = executor.loader.project_state(_MIGRATE_FROM).apps
        Game = before_state.get_model('games', 'Game')
        Treasure = before_state.get_model('games', 'Treasure')
        GameTreasure = before_state.get_model('games', 'GameTreasure')

        game = Game.objects.create(name='Test Game', game_slug='test-game')
        hidden_treasure = Treasure.objects.create(name='Secret Gem', value=100, hidden=True)
        visible_treasure = Treasure.objects.create(name='Open Gem', value=50, hidden=False)
        hidden_game_treasure_id = GameTreasure.objects.create(
            game=game, treasure=hidden_treasure, value=100, hidden=False,
        ).id
        visible_game_treasure_id = GameTreasure.objects.create(
            game=game, treasure=visible_treasure, value=50, hidden=False,
        ).id
        return hidden_game_treasure_id, visible_game_treasure_id

    def test_backfill_sets_hidden_from_the_treasures_own_previous_hidden_value(self):
        """Test that the backfill copies each Treasure's hidden value onto its GameTreasure row.

        Both assertions (hidden and non-hidden source treasures) live in a single test method
        because `TransactionTestCase` truncates all tables after every test method, which would
        otherwise wipe out fixtures shared via `setUpClass` before a second test method runs.
        """
        executor = MigrationExecutor(connection)
        executor.migrate(_MIGRATE_FROM)
        hidden_game_treasure_id, visible_game_treasure_id = self._seed_historical_fixtures(
            executor,
        )

        executor = MigrationExecutor(connection)
        executor.migrate(_MIGRATE_TO)
        after_state = executor.loader.project_state(_MIGRATE_TO).apps
        GameTreasureAfterBackfill = after_state.get_model('games', 'GameTreasure')

        hidden_game_treasure = GameTreasureAfterBackfill.objects.get(id=hidden_game_treasure_id)
        visible_game_treasure = GameTreasureAfterBackfill.objects.get(id=visible_game_treasure_id)
        assert hidden_game_treasure.hidden is True
        assert visible_game_treasure.hidden is False
