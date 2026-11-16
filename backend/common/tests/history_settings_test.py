"""Tests for the opt-in simple_history recording in tests (#1792)."""

import importlib

import pytest
from django.conf import settings
from django.test import TestCase

from games.models import Game
from games.tests.factories import GameFactory


class TestHistoryDisabledByDefault(TestCase):
    """Tests that history is not recorded unless a test opts in."""

    def test_setting_is_false(self):
        """Test that the test settings disable simple_history."""
        assert settings.SIMPLE_HISTORY_ENABLED is False

    def test_save_adds_no_history_row(self):
        """Test that saving a versioned model records nothing."""
        game = GameFactory()
        assert game.history.count() == 0


class TestHistoryOptIn(TestCase):
    """Tests for the history marker on a class."""

    @pytest.mark.history
    def test_marked_test_records_history(self):
        """Test that a marked test records a history row."""
        game = GameFactory()
        assert game.history.count() == 1

    def test_next_test_is_disabled_again(self):
        """Test that recording is off again after a marked test."""
        game = GameFactory()
        assert game.history.count() == 0


@pytest.mark.history
class TestHistoryClassMarker(TestCase):
    """Tests that a class-level marker enables history for a TestCase."""

    def test_records_history(self):
        """Test that a TestCase marked with history records rows."""
        game = GameFactory()
        assert Game.objects.get(pk=game.pk).history.count() == 1


class TestProductionSettings:
    """Tests that production settings leave history enabled."""

    def test_production_does_not_disable_history(self):
        """Test that majora_project.settings does not disable simple_history."""
        module = importlib.import_module('majora_project.settings')
        assert getattr(module, 'SIMPLE_HISTORY_ENABLED', True) is True
