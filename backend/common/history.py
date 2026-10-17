"""Shared `django-simple-history` customizations."""

from django.db import models
from simple_history.models import HistoricalRecords

from common.model_fields import EnumCharField


class EnumSafeHistoricalRecords(HistoricalRecords):
    """`HistoricalRecords` that keeps enum columns as plain `varchar` in history tables.

    `simple_history` copies every tracked field into the historical model, so an
    `EnumCharField` would also become a MySQL `ENUM` there. History tables keep a plain
    `CharField` instead (issue #1626), so past rows never block a future change of choices.
    """

    def copy_fields(self, model):
        """Return the copied fields, downgrading each `EnumCharField` to a `CharField`."""
        fields = super().copy_fields(model)
        for field in fields.values():
            self._downgrade_enum(field)
        return fields

    @staticmethod
    def _downgrade_enum(field):
        """Turn a copied `EnumCharField` into a regular `CharField`, keeping its options."""
        if isinstance(field, EnumCharField):
            field.__class__ = models.CharField
