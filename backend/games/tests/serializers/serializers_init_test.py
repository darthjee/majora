"""Tests for the lazy public API of the games.serializers package."""

import importlib.util

import pytest

import games.serializers as serializers


class TestSerializersPublicApi:
    """Tests for `__all__` and the lazy `__getattr__` in games.serializers."""

    def test_every_name_in_all_resolves(self):
        """Test that every name in `__all__` resolves through `__getattr__`."""
        for name in serializers.__all__:
            assert getattr(serializers, name) is not None, name

    def test_star_import_exposes_every_name(self, tmp_path):
        """Test that a star import binds every name declared in `__all__`."""
        probe_path = tmp_path / 'star_import_probe.py'
        probe_path.write_text('from games.serializers import *\n')
        spec = importlib.util.spec_from_file_location('star_import_probe', probe_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        for name in serializers.__all__:
            assert hasattr(module, name), name

    def test_unknown_name_raises_attribute_error(self):
        """Test that an undeclared name raises AttributeError."""
        name = 'DoesNotExistSerializer'
        with pytest.raises(AttributeError):
            getattr(serializers, name)
