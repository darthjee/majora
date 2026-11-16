"""Tests for the 0059 data migration backfilling GameTreasure.hidden from Treasure.hidden."""

import importlib

from django.apps import apps
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TestCase, TransactionTestCase

from games.models import GameTreasure
from games.tests.factories import GameFactory, GameTreasureFactory, TreasureFactory
from games.tests.migration_state import MigrationRollback, historical_apps

_migration = importlib.import_module('games.migrations.0059_backfill_gametreasure_hidden')

_BACKFILL = ('games', '0059_backfill_gametreasure_hidden')
_REMOVE_TREASURE_HIDDEN = ('games', '0060_remove_treasure_hidden')


class TestGameTreasureHiddenBackfillNoopReverse(TestCase):
    """Tests for the 0059 migration's reverse operation."""

    def test_reverse_migration_is_a_noop(self):
        """Test that the reverse migration runs without raising and touches nothing."""
        _migration._noop_reverse(apps, None)


# transactional: migrates the schema with MigrationExecutor; DDL commits implicitly on MySQL
class TestGameTreasureHiddenBackfillMigration(TransactionTestCase):
    """Tests for the actual backfill performed by the 0059 data migration.

    Runs the real migration (schema included) against the test database, since the
    backfill's source field (`Treasure.hidden`) is dropped by a later migration (0060) and
    therefore does not exist on the live, fully-migrated model used elsewhere in this test
    suite. Only 0060 and 0059 are rolled back (see `MigrationRollback`), instead of every
    migration after 0058. `TransactionTestCase` is required (over plain `TestCase`) because
    the migration executor issues real DDL, which implicitly commits on MySQL and is
    incompatible with `TestCase`'s wrapping transaction.
    """

    @classmethod
    def tearDownClass(cls):
        """Migrate the schema forward to the latest state, as a safety net for the rollback."""
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(executor.loader.graph.leaf_nodes())
        super().tearDownClass()

    def _seed_fixtures(self):
        """Create a to-be-hidden and a visible Treasure/GameTreasure pair with the live models."""
        game = GameFactory()
        hidden_treasure = TreasureFactory(name='Secret Gem', value=100)
        visible_treasure = TreasureFactory(name='Open Gem', value=50)
        hidden_game_treasure = GameTreasureFactory(game=game, treasure=hidden_treasure)
        visible_game_treasure = GameTreasureFactory(game=game, treasure=visible_treasure)
        return hidden_treasure.id, hidden_game_treasure.id, visible_game_treasure.id

    def _roll_back(self):
        """Unapply 0060 and 0059, restoring them when the test ends (even on failure)."""
        rollback = MigrationRollback([_BACKFILL, _REMOVE_TREASURE_HIDDEN])
        self.addCleanup(rollback.restore)
        rollback.unapply()
        return rollback

    def _hide_treasure(self, treasure_id):
        """Set the pre-0060 `Treasure.hidden` column with the historical 0058 model."""
        Treasure = historical_apps('games', '0058_gametreasure_hidden').get_model(
            'games', 'Treasure',
        )
        Treasure.objects.filter(id=treasure_id).update(hidden=True)

    def test_backfill_sets_hidden_from_the_treasures_own_previous_hidden_value(self):
        """Test that the backfill copies each Treasure's hidden value onto its GameTreasure row.

        Both assertions (hidden and non-hidden source treasures) live in a single test method
        because `TransactionTestCase` truncates all tables after every test method, which would
        otherwise wipe out fixtures shared via `setUpClass` before a second test method runs.
        """
        hidden_treasure_id, hidden_game_treasure_id, visible_game_treasure_id = (
            self._seed_fixtures()
        )
        rollback = self._roll_back()
        self._hide_treasure(hidden_treasure_id)

        rollback.apply(_BACKFILL)
        rollback.restore()

        assert GameTreasure.objects.get(id=hidden_game_treasure_id).hidden is True
        assert GameTreasure.objects.get(id=visible_game_treasure_id).hidden is False
