"""Tests for the common.model_fields module."""

from types import SimpleNamespace

import pytest
from django.core.exceptions import ImproperlyConfigured
from django.db import connection

from common.model_fields import EnumCharField

CHOICES = [('open', 'Open'), ('approved', 'Approved'), ('denied', 'Denied')]


class TestEnumCharField:
    """Tests for EnumCharField."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.field = EnumCharField(max_length=16, choices=CHOICES, default='open')
        self.mysql = SimpleNamespace(vendor='mysql')

    def test_mysql_db_type_is_enum_in_declaration_order(self):
        """Test that on MySQL the column type is ENUM of the choices, in declaration order."""
        assert self.field.db_type(self.mysql) == "ENUM('open','approved','denied')"

    def test_mysql_db_type_quotes_values(self):
        """Test that quotes and backslashes in values are escaped."""
        field = EnumCharField(max_length=16, choices=[("it's", 'A'), ('a\\b', 'B')])
        assert field.db_type(self.mysql) == "ENUM('it''s','a\\\\b')"

    def test_mysql_db_type_flattens_grouped_choices(self):
        """Test that grouped choices are flattened in declaration order."""
        field = EnumCharField(max_length=16, choices=[('Group', [('a', 'A'), ('b', 'B')])])
        assert field.db_type(self.mysql) == "ENUM('a','b')"

    def test_real_connection_db_type(self):
        """Test that the test database (MySQL) gets an ENUM column type."""
        assert self.field.db_type(connection).startswith('ENUM(')

    def test_non_mysql_falls_back_to_varchar(self):
        """Test that other vendors get the regular varchar column type."""
        sqlite = SimpleNamespace(
            vendor='sqlite',
            data_types={'CharField': 'varchar(%(max_length)s)'},
            features=SimpleNamespace(supports_unlimited_charfield=False),
            ops=SimpleNamespace(quote_name=lambda name: name),
        )
        assert self.field.db_type(sqlite) == 'varchar(16)'

    def test_deconstruct_includes_choices(self):
        """Test that deconstruct keeps the choices and max_length."""
        _name, path, _args, kwargs = self.field.deconstruct()
        assert path == 'common.model_fields.EnumCharField'
        assert kwargs['choices'] == CHOICES
        assert kwargs['max_length'] == 16

    def test_deconstruct_round_trips(self):
        """Test that rebuilding the field from deconstruct yields an equal field."""
        _name, _path, args, kwargs = self.field.deconstruct()
        rebuilt = EnumCharField(*args, **kwargs)
        assert rebuilt.deconstruct() == self.field.deconstruct()
        assert rebuilt.db_type(self.mysql) == self.field.db_type(self.mysql)

    def test_choices_is_a_db_attribute(self):
        """Test that choices is not in non_db_attrs, so changing it alters the column."""
        assert 'choices' not in self.field.non_db_attrs

    def test_other_non_db_attrs_are_kept(self):
        """Test that the remaining non-db attributes are inherited."""
        assert 'help_text' in self.field.non_db_attrs

    def test_requires_choices(self):
        """Test that a field without choices is rejected."""
        with pytest.raises(ImproperlyConfigured):
            EnumCharField(max_length=16)

    def test_rejects_empty_member(self):
        """Test that an empty string choice is rejected."""
        with pytest.raises(ImproperlyConfigured):
            EnumCharField(max_length=16, choices=[('', 'Empty'), ('a', 'A')])
