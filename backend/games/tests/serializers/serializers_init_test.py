"""Tests for the lazy public API of the games.serializers package."""

import pytest

import games.serializers as serializers


class TestSerializersPublicApi:
    """Tests for `__all__` and the lazy `__getattr__` in games.serializers."""

    def test_every_name_in_all_resolves(self):
        """Test that every name in `__all__` resolves through `__getattr__`."""
        for name in serializers.__all__:
            assert getattr(serializers, name) is not None, name

    def test_star_import_exposes_every_name(self):
        """Test that a star import binds every name declared in `__all__`."""
        namespace = {}
        exec('from games.serializers import *', namespace)  # noqa: S102
        for name in serializers.__all__:
            assert name in namespace, name

    def test_unknown_name_raises_attribute_error(self):
        """Test that an undeclared name raises AttributeError."""
        with pytest.raises(AttributeError):
            serializers.DoesNotExistSerializer
