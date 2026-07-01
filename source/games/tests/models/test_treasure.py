"""Tests for the Treasure model."""

import pytest
from django.contrib.auth.models import AnonymousUser, User

from games.models import Treasure


@pytest.mark.django_db
class TestTreasure:

    """Tests for the Treasure model."""

    def test_treasure_creation(self):
        """Test that a treasure can be created with name and value."""
        treasure = Treasure.objects.create(name='Golden Crown', value=500)
        assert treasure.name == 'Golden Crown'
        assert treasure.value == 500

    def test_treasure_str(self):
        """Test string representation of a treasure."""
        treasure = Treasure(name='Silver Sword', value=100)
        assert str(treasure) == 'Silver Sword'

    def test_treasure_ordering(self):
        """Test that treasures are ordered by id."""
        first = Treasure.objects.create(name='Zebra Gem', value=10)
        second = Treasure.objects.create(name='Alpha Gem', value=20)
        treasures = list(Treasure.objects.all())
        assert treasures[0].id == first.id
        assert treasures[1].id == second.id


@pytest.mark.django_db
class TestTreasureCanBeEditedBy:

    """Tests for Treasure.can_be_edited_by()."""

    def setup_method(self):
        """Set up a treasure for testing."""
        self.treasure = Treasure.objects.create(name='Magic Ring', value=300)

    def test_superuser_can_edit(self):
        """Test that a superuser may edit the treasure."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        assert self.treasure.can_be_edited_by(superuser) is True

    def test_regular_user_cannot_edit(self):
        """Test that a regular authenticated user cannot edit the treasure."""
        user = User.objects.create_user(username='player', password='secret-password')
        assert self.treasure.can_be_edited_by(user) is False

    def test_none_user_cannot_edit(self):
        """Test that None as user returns False."""
        assert self.treasure.can_be_edited_by(None) is False

    def test_anonymous_user_cannot_edit(self):
        """Test that an anonymous user returns False."""
        assert self.treasure.can_be_edited_by(AnonymousUser()) is False
