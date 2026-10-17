"""Test helper simulating a hand edit of a model's `status` column (issue #1626)."""

from django.db import connection, transaction


def update_status_raw(instance, value):
    """Run a raw `UPDATE ... SET status=%s` for `instance`, bypassing Django validation."""
    meta = instance._meta
    table = connection.ops.quote_name(meta.db_table)
    pk_column = connection.ops.quote_name(meta.pk.column)
    with transaction.atomic(), connection.cursor() as cursor:
        cursor.execute(
            f'UPDATE {table} SET status = %s WHERE {pk_column} = %s', [value, instance.pk],
        )
