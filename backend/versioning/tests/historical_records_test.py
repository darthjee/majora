"""Tests for `django-simple-history` change tracking on tracked `games` models.

Covers a representative subset of the ten tracked models (`Game`, `Player`, `Character`,
`Treasure`) for full-state snapshotting on save/update/delete, acting-user capture via an
authenticated endpoint, and confirms `GameTreasure` stays untracked, per the issue's scope.
"""

import json

import pytest
from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.models import Game, GameTreasure
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    PlayerFactory,
    TreasureFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestHistoricalRecordsOnCreate:
    """Test that saving a new tracked instance creates a full-state historical row."""

    def test_game_creation_creates_historical_row(self):
        """Test that creating a Game creates a HistoricalGame row with full field state."""
        game = GameFactory(name='Epic Quest', description='A grand adventure.')
        history = game.history.all()
        assert history.count() == 1
        record = history.first()
        assert record.history_type == '+'
        assert record.name == 'Epic Quest'
        assert record.description == 'A grand adventure.'

    def test_player_creation_creates_historical_row(self):
        """Test that creating a Player creates a HistoricalPlayer row with full field state."""
        player = PlayerFactory(name='Alice')
        history = player.history.all()
        assert history.count() == 1
        assert history.first().history_type == '+'
        assert history.first().name == 'Alice'

    def test_character_creation_creates_historical_row(self):
        """Test that creating a Character creates a HistoricalCharacter row."""
        character = CharacterFactory(name='Gimli', npc=False)
        history = character.history.all()
        assert history.count() == 1
        assert history.first().history_type == '+'
        assert history.first().name == 'Gimli'
        assert history.first().npc is False

    def test_treasure_creation_creates_historical_row(self):
        """Test that creating a Treasure creates a HistoricalTreasure row."""
        treasure = TreasureFactory(name='Sword of Legends', value=500)
        history = treasure.history.all()
        assert history.count() == 1
        assert history.first().history_type == '+'
        assert history.first().name == 'Sword of Legends'
        assert history.first().value == 500


@pytest.mark.django_db
class TestHistoricalRecordsOnUpdate:
    """Test that updating a tracked instance creates a new full-state historical row."""

    def test_game_update_creates_new_full_state_snapshot(self):
        """Test that updating a Game adds a new historical row with the full new state."""
        game = GameFactory(name='Epic Quest', description='Original description.')
        game.name = 'Updated Quest'
        game.description = 'Updated description.'
        game.save()

        history = game.history.order_by('history_id')
        assert history.count() == 2
        first, second = history
        assert first.history_type == '+'
        assert first.name == 'Epic Quest'
        assert first.description == 'Original description.'
        assert second.history_type == '~'
        assert second.name == 'Updated Quest'
        assert second.description == 'Updated description.'

    def test_character_update_creates_new_full_state_snapshot(self):
        """Test that updating a Character adds a new historical row with the full new state."""
        character = CharacterFactory(name='Gimli', money=0)
        character.money = 100
        character.save()

        history = character.history.order_by('history_id')
        assert history.count() == 2
        assert history[0].money == 0
        assert history[1].money == 100
        assert history[1].name == 'Gimli'


@pytest.mark.django_db
class TestHistoricalRecordsOnDelete:
    """Test that deleting a tracked instance is also captured as a historical row."""

    def test_game_deletion_creates_historical_row(self):
        """Test that deleting a Game creates a final HistoricalGame row of type deletion."""
        game = GameFactory(name='Doomed Quest')
        game_id = game.id
        game.delete()

        history = Game.history.filter(id=game_id).order_by('history_id')
        assert history.count() == 2
        assert history[0].history_type == '+'
        assert history[1].history_type == '-'

    def test_treasure_deletion_creates_historical_row(self):
        """Test that deleting a Treasure creates a final HistoricalTreasure row."""
        treasure = TreasureFactory(name='Cursed Amulet')
        treasure_id = treasure.id
        treasure.delete()

        history = treasure.__class__.history.filter(id=treasure_id).order_by('history_id')
        assert history.count() == 2
        assert history[1].history_type == '-'


class TestHistoricalRecordsUser(TokenAuthRequestMixin, TestCase):
    """Test that a request-bound user performing a change is captured as `history_user`."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM user, and their auth token."""
        cls.game = GameFactory(
            name='Epic Quest', game_slug='epic-quest', description='Original description.'
        )
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)

    def test_patch_via_authenticated_endpoint_sets_history_user(self):
        """Test that PATCHing a game via a DM's token sets history_user on the new row."""
        response = self.client.patch(
            '/games/epic-quest.json',
            data=json.dumps({'name': 'Updated Quest'}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )
        assert response.status_code == 200

        self.game.refresh_from_db()
        latest = self.game.history.order_by('-history_id').first()
        assert latest.history_type == '~'
        assert latest.history_user_id == self.dm_user.id


@pytest.mark.django_db
class TestGameTreasureRemainsUntracked:
    """Test that GameTreasure, explicitly out of scope, has no history tracking."""

    def test_game_treasure_has_no_history_manager(self):
        """Test that GameTreasure instances have no `history` manager attached."""
        game = GameFactory()
        treasure = TreasureFactory()
        game_treasure = GameTreasure.objects.create(
            game=game, treasure=treasure, value=treasure.value, max_units=5,
        )
        assert not hasattr(game_treasure, 'history')

    def test_no_historical_game_treasure_model_exists(self):
        """Test that no HistoricalGameTreasure model was generated for GameTreasure."""
        from django.apps import apps

        model_names = {
            model._meta.model_name for model in apps.get_app_config('versioning').get_models()
        }
        assert 'historicalgametreasure' not in model_names
