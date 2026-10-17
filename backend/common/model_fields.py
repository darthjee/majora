"""Shared, cross-app model field classes."""

from django.core.exceptions import ImproperlyConfigured
from django.db import models


class EnumCharField(models.CharField):
    """A `CharField` stored as a native `ENUM(...)` column on MySQL (issue #1626).

    Status columns are sometimes edited by hand directly in the database (e.g. approving an
    authorization request). A plain `varchar` accepts any typo silently; an `ENUM` column
    makes MySQL reject unknown values (in strict mode) and lets MySQL clients show the
    allowed values. On other database vendors the column falls back to a regular `varchar`.

    The column type depends on `choices`, so `choices` is removed from `non_db_attrs`:
    adding, removing or reordering a value produces a real `ALTER TABLE ... MODIFY`.
    """

    non_db_attrs = tuple(attr for attr in models.CharField.non_db_attrs if attr != 'choices')

    def __init__(self, *args, **kwargs):
        """Build the field, requiring non-empty choices without an empty member."""
        super().__init__(*args, **kwargs)
        self._validate_enum_choices()

    def db_type(self, connection):
        """Return `ENUM(...)` on MySQL, or the regular `varchar` type elsewhere."""
        if connection.vendor != 'mysql':
            return super().db_type(connection)
        members = ','.join(self._quote(value) for value in self._enum_values())
        return f'ENUM({members})'

    def _enum_values(self):
        """Return the flattened choice values, in declaration order."""
        return [value for value, _label in self.flatchoices]

    def _validate_enum_choices(self):
        """Raise when choices are missing or contain a non-string/empty value."""
        values = self._enum_values() if self.choices else []
        if not values:
            raise ImproperlyConfigured('EnumCharField requires non-empty choices.')
        if not all(isinstance(value, str) and value for value in values):
            raise ImproperlyConfigured('EnumCharField choices must be non-empty strings.')

    @staticmethod
    def _quote(value):
        """Return `value` as a single-quoted SQL string literal with `\\` and `'` escaped."""
        escaped = value.replace('\\', '\\\\').replace("'", "''")
        return f"'{escaped}'"
