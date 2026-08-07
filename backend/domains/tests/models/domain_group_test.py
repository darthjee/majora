"""Tests for the DomainGroup model."""

import pytest

from domains.models import DomainGroup


@pytest.mark.django_db
class TestDomainGroup:
    """Tests for the DomainGroup model."""

    def test_group_creation(self):
        """Test that a group can be created and saved with just a name."""
        group = DomainGroup.objects.create(name='Majora Brand')
        assert group.pk is not None
        assert group.name == 'Majora Brand'

    def test_group_str(self):
        """Test string representation of a group."""
        group = DomainGroup(name='Majora Brand')
        assert str(group) == 'Majora Brand'
