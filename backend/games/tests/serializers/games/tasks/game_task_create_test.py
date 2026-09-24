"""Tests for the GameTaskCreateSerializer."""

from django.test import TestCase

from games.models import GameSession
from games.serializers import GameTaskCreateSerializer
from games.tests.factories import GameFactory


class TestGameTaskCreateSerializer(TestCase):
    """Tests for the GameTaskCreateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_valid_with_short_description_only(self):
        """Test that a payload with only short_description is valid."""
        serializer = GameTaskCreateSerializer(
            data={'short_description': 'Prep the ambush'}, context={'game': self.game}
        )
        assert serializer.is_valid()

    def test_invalid_without_short_description(self):
        """Test that a payload without short_description is invalid."""
        serializer = GameTaskCreateSerializer(
            data={'long_description': 'Details'}, context={'game': self.game}
        )
        assert not serializer.is_valid()
        assert 'short_description' in serializer.errors

    def test_valid_with_all_fields(self):
        """Test that a payload with all fields, including a same-game session, is valid."""
        session = GameSession.objects.create(game=self.game, title='Session One')
        serializer = GameTaskCreateSerializer(
            data={
                'short_description': 'Prep the ambush',
                'long_description': 'Details',
                'completed': True,
                'session': session.id,
            },
            context={'game': self.game},
        )
        assert serializer.is_valid()

    def test_invalid_when_session_belongs_to_different_game(self):
        """Test that a session belonging to a different game is rejected."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_session = GameSession.objects.create(game=other_game, title='Other Session')
        serializer = GameTaskCreateSerializer(
            data={'short_description': 'Prep the ambush', 'session': other_session.id},
            context={'game': self.game},
        )
        assert not serializer.is_valid()
        assert 'session' in serializer.errors

    def test_game_is_set_explicitly_in_view(self):
        """Test that game is not accepted from the payload and must be passed to save()."""
        serializer = GameTaskCreateSerializer(
            data={'short_description': 'Prep the ambush'}, context={'game': self.game}
        )
        assert serializer.is_valid()
        task = serializer.save(game=self.game)
        assert task.game == self.game

    def test_does_not_include_game_field(self):
        """Test that game is not a field accepted by the serializer."""
        serializer = GameTaskCreateSerializer(
            data={'short_description': 'Prep the ambush', 'game': self.game.id},
            context={'game': self.game},
        )
        assert serializer.is_valid()
        assert 'game' not in serializer.validated_data

    def _build(self, **extra):
        """Build a serializer with a valid short_description plus the given fields."""
        return GameTaskCreateSerializer(
            data={'short_description': 'Prep the ambush', **extra}, context={'game': self.game}
        )

    def _category_codes(self, value):
        """Return the error codes produced for the given category value."""
        serializer = self._build(category=value)
        assert not serializer.is_valid()
        return [error.code for error in serializer.errors['category']]

    def test_category_defaults_to_other_when_omitted(self):
        """Test that omitting category saves the task as `other`."""
        serializer = self._build()
        assert serializer.is_valid()
        task = serializer.save(game=self.game)
        assert task.category == 'other'

    def test_valid_category_is_saved(self):
        """Test that a valid category is saved."""
        serializer = self._build(category='painting')
        assert serializer.is_valid()
        task = serializer.save(game=self.game)
        assert task.category == 'painting'

    def test_unknown_category_is_invalid_choice(self):
        """Test that an unknown category is rejected with invalid_choice."""
        assert self._category_codes('cooking') == ['invalid_choice']

    def test_wrong_case_category_is_invalid_choice(self):
        """Test that a category with a different case is rejected with invalid_choice."""
        assert self._category_codes('Painting') == ['invalid_choice']

    def test_null_category_is_rejected(self):
        """Test that a null category is rejected with the null code."""
        assert self._category_codes(None) == ['null']

    def test_blank_category_is_rejected(self):
        """Test that an empty category is rejected, never converted to `other`."""
        assert self._category_codes('') == ['invalid_choice']
