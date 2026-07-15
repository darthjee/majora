"""Tests for the Treasure model."""

import pytest
from django.contrib.auth.models import AnonymousUser
from django.test import TestCase

from games.models import Treasure
from games.tests.factories import GameFactory, SuperUserFactory, TreasureFactory, UserFactory


@pytest.mark.django_db
class TestTreasure:
    """Tests for the Treasure model."""

    def test_treasure_creation(self):
        """Test that a treasure can be created with name and value."""
        treasure = TreasureFactory(name='Golden Crown', value=500)
        assert treasure.name == 'Golden Crown'
        assert treasure.value == 500

    def test_treasure_str(self):
        """Test string representation of a treasure."""
        treasure = Treasure(name='Silver Sword', value=100)
        assert str(treasure) == 'Silver Sword'

    def test_treasure_ordering(self):
        """Test that treasures are ordered by id."""
        first = TreasureFactory(name='Zebra Gem', value=10)
        second = TreasureFactory(name='Alpha Gem', value=20)
        treasures = list(Treasure.objects.all())
        assert treasures[0].id == first.id
        assert treasures[1].id == second.id

    def test_game_defaults_to_none(self):
        """Test that a treasure has no owning game by default."""
        treasure = TreasureFactory(name='Global Gem', value=10)
        assert treasure.game is None

    def test_treasure_can_be_exclusive_to_a_game(self):
        """Test that a treasure can be created with an owning game."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        treasure = TreasureFactory(name='Game Gem', value=10, game=game)
        assert treasure.game == game

    def test_deleting_game_cascades_to_exclusive_treasure(self):
        """Test that deleting a game deletes its exclusive treasures."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        treasure = TreasureFactory(name='Game Gem', value=10, game=game)
        game.delete()
        assert not Treasure.objects.filter(id=treasure.id).exists()

    def test_deleting_game_does_not_delete_linked_only_treasure(self):
        """Test that deleting a game does not delete a treasure merely M2M-linked to it."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        treasure = TreasureFactory(name='Linked Gem', value=10)
        game.treasures.add(treasure)
        game.delete()
        assert Treasure.objects.filter(id=treasure.id).exists()

    def test_hidden_defaults_to_false(self):
        """Test that a treasure is not hidden by default."""
        treasure = TreasureFactory(name='Open Chest', value=10)
        assert treasure.hidden is False

    def test_treasure_can_be_hidden(self):
        """Test that a treasure can be created as hidden."""
        treasure = TreasureFactory(name='Secret Chest', value=10, hidden=True)
        assert treasure.hidden is True


class TestTreasureCanBeEditedBy(TestCase):
    """Tests for Treasure.can_be_edited_by()."""

    @classmethod
    def setUpTestData(cls):
        """Set up a treasure for testing."""
        cls.treasure = TreasureFactory(name='Magic Ring', value=300)

    def test_superuser_can_edit(self):
        """Test that a superuser may edit the treasure."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        assert self.treasure.can_be_edited_by(superuser) is True

    def test_regular_user_cannot_edit(self):
        """Test that a regular authenticated user cannot edit the treasure."""
        user = UserFactory(username='player', password='secret-password')
        assert self.treasure.can_be_edited_by(user) is False

    def test_staff_user_can_edit_global_treasure(self):
        """Test that a staff user may edit a global treasure."""
        staff_user = UserFactory(username='staffer', password='secret-password', is_staff=True)
        assert self.treasure.can_be_edited_by(staff_user) is True

    def test_staff_user_cannot_edit_game_exclusive_treasure(self):
        """Test that a staff user may not edit a game-exclusive treasure."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        treasure = TreasureFactory(name='Game Gem', value=10, game=game)
        staff_user = UserFactory(username='staffer', password='secret-password', is_staff=True)
        assert treasure.can_be_edited_by(staff_user) is False

    def test_none_user_cannot_edit(self):
        """Test that None as user returns False."""
        assert self.treasure.can_be_edited_by(None) is False

    def test_anonymous_user_cannot_edit(self):
        """Test that an anonymous user returns False."""
        assert self.treasure.can_be_edited_by(AnonymousUser()) is False


@pytest.mark.django_db
class TestTreasureCanBeEditedByRoles:
    """Tests for Treasure.can_be_edited_by_roles()."""

    def test_superuser_role_can_edit_global_treasure(self):
        """Test that the superuser role may edit a global treasure."""
        treasure = TreasureFactory(name='Magic Ring', value=300)
        assert treasure.can_be_edited_by_roles(is_superuser=True, is_dm=False) is True

    def test_dm_role_is_a_no_op_for_global_treasure(self):
        """Test that the dm role never flips can_edit to True for a global treasure."""
        treasure = TreasureFactory(name='Magic Ring', value=300)
        assert treasure.can_be_edited_by_roles(is_superuser=False, is_dm=True) is False

    def test_superuser_role_can_edit_game_exclusive_treasure(self):
        """Test that the superuser role may edit a game-exclusive treasure."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        treasure = TreasureFactory(name='Game Gem', value=10, game=game)
        assert treasure.can_be_edited_by_roles(is_superuser=True, is_dm=False) is True

    def test_dm_role_can_edit_game_exclusive_treasure(self):
        """Test that the dm role may edit a game-exclusive treasure."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        treasure = TreasureFactory(name='Game Gem', value=10, game=game)
        assert treasure.can_be_edited_by_roles(is_superuser=False, is_dm=True) is True

    def test_no_roles_cannot_edit_game_exclusive_treasure(self):
        """Test that no matching role may not edit a game-exclusive treasure."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        treasure = TreasureFactory(name='Game Gem', value=10, game=game)
        assert treasure.can_be_edited_by_roles(is_superuser=False, is_dm=False) is False
