"""Helper for obtaining a frozen, historical Django app registry in migration tests."""

from django.db import connection
from django.db.migrations.executor import MigrationExecutor


def historical_apps(app_label, migration_name):
    """Return the frozen `apps` registry as of `migration_name` in `app_label`.

    Mirrors the historical, migration-state `apps` registry Django itself passes into
    `RunPython` callables during a real migration run — unlike the live, current-code
    `django.apps.apps` registry, which no longer reflects an app's historical shape once
    one of its models has since moved to another app (as `UserProfile`/`PasswordResetToken`
    did, from `games` to `accounts`).
    """
    executor = MigrationExecutor(connection)
    return executor.loader.project_state([(app_label, migration_name)]).apps


class MigrationRollback:
    """Unapply and re-apply a hand-picked list of migrations, leaving the rest in place.

    `executor.migrate(<old node>)` unapplies every later migration (and every dependent
    app's), which is real DDL and slow. This helper only touches the given `nodes`, so a
    migration test can roll back just the migrations that change the fields it checks.
    """

    def __init__(self, nodes):
        """Store `nodes`, the `(app_label, migration_name)` keys to roll back, oldest first."""
        self.nodes = list(nodes)

    def unapply(self):
        """Unapply every node, newest first, in a single backwards plan."""
        executor = MigrationExecutor(connection)
        plan = [(executor.loader.graph.nodes[node], True) for node in reversed(self.nodes)]
        executor.migrate(None, plan=plan)

    def apply(self, node):
        """Apply `node` on top of the state of its parents and record it as applied."""
        executor = MigrationExecutor(connection)
        graph = executor.loader.graph
        state = executor.loader.project_state(self._parent_keys(graph, node))
        executor.apply_migration(state, graph.nodes[node])

    @staticmethod
    def _parent_keys(graph, node):
        """Return the `(app_label, migration_name)` keys `node` directly depends on."""
        return [parent.key for parent in graph.node_map[node].parents]

    def restore(self):
        """Re-apply, oldest first, every node that is not currently applied."""
        for node in self._unapplied_nodes():
            self.apply(node)

    def _unapplied_nodes(self):
        """Return the nodes missing from the recorded applied migrations, oldest first."""
        applied = MigrationExecutor(connection).loader.applied_migrations
        return [node for node in self.nodes if node not in applied]
