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
