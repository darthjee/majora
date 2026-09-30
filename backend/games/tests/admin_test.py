"""Tests for the games app Django admin registrations of common items and their photos."""

import pytest
from django.test import Client
from django.urls import reverse

from games.models import CharacterRecipe, GameCommonItem, GameRecipe
from games.tests.factories import (
    CharacterRecipeFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameCommonItemAdmin:
    """Tests for the GameCommonItem admin changelist and delete views."""

    def setup_method(self):
        """Log in a superuser and build a common item with a recipe known by a character."""
        self.client = Client()
        self.client.force_login(SuperUserFactory())
        self.character_recipe = CharacterRecipeFactory()
        self.recipe = self.character_recipe.game_recipe
        self.item = self.recipe.game_common_item
        self.delete_url = reverse('admin:games_gamecommonitem_delete', args=[self.item.pk])

    def test_changelist_returns_ok(self):
        """Test that the GameCommonItem changelist renders for a superuser."""
        response = self.client.get(reverse('admin:games_gamecommonitem_changelist'))
        assert response.status_code == 200

    def test_delete_confirmation_returns_ok(self):
        """Test that the delete confirmation page renders for a common item with recipes."""
        response = self.client.get(self.delete_url)
        assert response.status_code == 200

    def test_delete_confirmation_lists_dependent_recipe(self):
        """Test that the delete confirmation page lists the dependent recipe."""
        response = self.client.get(self.delete_url)
        assert self.recipe.name in response.content.decode()

    def test_delete_removes_common_item(self):
        """Test that confirming the deletion removes the common item."""
        self.client.post(self.delete_url, {'post': 'yes'})
        assert not GameCommonItem.objects.filter(pk=self.item.pk).exists()

    def test_delete_cascades_to_game_recipes(self):
        """Test that deleting the common item cascades to its game recipes."""
        self.client.post(self.delete_url, {'post': 'yes'})
        assert not GameRecipe.objects.filter(pk=self.recipe.pk).exists()

    def test_delete_cascades_to_character_recipes(self):
        """Test that deleting the common item cascades to its character recipes."""
        self.client.post(self.delete_url, {'post': 'yes'})
        assert not CharacterRecipe.objects.filter(pk=self.character_recipe.pk).exists()


@pytest.mark.django_db
class TestGameCommonItemPhotoAdmin:
    """Tests for the GameCommonItemPhoto admin changelist."""

    def setup_method(self):
        """Log in a superuser."""
        self.client = Client()
        self.client.force_login(SuperUserFactory())

    def test_changelist_returns_ok(self):
        """Test that the GameCommonItemPhoto changelist renders for a superuser."""
        response = self.client.get(reverse('admin:games_gamecommonitemphoto_changelist'))
        assert response.status_code == 200


@pytest.mark.django_db
class TestGameCommonItemAdminAccess:
    """Tests that non-staff users cannot reach the GameCommonItem admin."""

    def setup_method(self):
        """Log in a regular, non-staff user."""
        self.client = Client()
        self.client.force_login(UserFactory())
        self.url = reverse('admin:games_gamecommonitem_changelist')

    def test_changelist_redirects_to_admin_login(self):
        """Test that a non-staff user is redirected to the admin login page."""
        response = self.client.get(self.url)
        assert response.status_code == 302
        assert response.url.startswith(reverse('admin:login'))
