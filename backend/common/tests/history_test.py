"""Tests for the common.history module."""

from django.db import models

from common.history import EnumSafeHistoricalRecords
from common.model_fields import EnumCharField

CHOICES = [('open', 'Open'), ('closed', 'Closed')]


class TestEnumSafeHistoricalRecordsDowngradeEnum:
    """Tests for EnumSafeHistoricalRecords._downgrade_enum."""

    def test_enum_field_becomes_char_field(self):
        """Test that an EnumCharField is turned into a plain CharField."""
        field = EnumCharField(max_length=16, choices=CHOICES, default='open')
        EnumSafeHistoricalRecords._downgrade_enum(field)
        assert type(field) is models.CharField

    def test_enum_field_keeps_its_options(self):
        """Test that the downgraded field keeps max_length, choices and default."""
        field = EnumCharField(max_length=16, choices=CHOICES, default='open')
        EnumSafeHistoricalRecords._downgrade_enum(field)
        assert (field.max_length, field.choices, field.default) == (16, CHOICES, 'open')

    def test_other_fields_are_untouched(self):
        """Test that non-enum fields keep their class."""
        field = models.IntegerField()
        EnumSafeHistoricalRecords._downgrade_enum(field)
        assert type(field) is models.IntegerField
