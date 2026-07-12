"""Tests for the 0041 data migration backfilling public_slain from slain."""

import importlib

import pytest
from django.apps import apps

from games.tests.factories import CharacterFactory, GameFactory

_migration = importlib.import_module('games.migrations.0041_character_public_slain')


@pytest.mark.django_db
class TestCharacterPublicSlainBackfill:
    """Tests for the public_slain backfill performed by the 0041 data migration."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_backfill_copies_true_slain_into_public_slain(self):
        """Test that the backfill sets public_slain to True for an already-slain character."""
        character = CharacterFactory(
            game=self.game, npc=True, slain=True, public_slain=False
        )
        _migration._backfill_public_slain(apps, None)
        character.refresh_from_db()
        assert character.public_slain is True

    def test_backfill_copies_false_slain_into_public_slain(self):
        """Test that the backfill sets public_slain to False for an alive character."""
        character = CharacterFactory(
            game=self.game, npc=True, slain=False, public_slain=True
        )
        _migration._backfill_public_slain(apps, None)
        character.refresh_from_db()
        assert character.public_slain is False

    def test_reverse_migration_is_a_noop(self):
        """Test that the reverse migration does not change any data."""
        character = CharacterFactory(
            game=self.game, npc=True, slain=True, public_slain=True
        )
        _migration._noop_reverse(apps, None)
        character.refresh_from_db()
        assert character.public_slain is True
