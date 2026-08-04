"""Tests for the GameDomainGroup model."""

import pytest

from games.models import GameDomainGroup


@pytest.mark.django_db
class TestGameDomainGroup:
    """Tests for the GameDomainGroup model."""

    def test_group_creation(self):
        """Test that a group can be created and saved with just a name."""
        group = GameDomainGroup.objects.create(name='Majora Brand')
        assert group.pk is not None
        assert group.name == 'Majora Brand'

    def test_group_str(self):
        """Test string representation of a group."""
        group = GameDomainGroup(name='Majora Brand')
        assert str(group) == 'Majora Brand'
