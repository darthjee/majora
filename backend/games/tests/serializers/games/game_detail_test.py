"""Tests for the GameDetailSerializer."""

import datetime

from django.test import TestCase
from django.utils import timezone

from games.models import GamePhoto, GameSession, Link
from games.serializers import GameDetailSerializer
from games.tests.factories import GameFactory


class TestGameDetailSerializer(TestCase):
    """Tests for the GameDetailSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(
            name='Test Game',
            game_slug='test-game',
            description='A grand adventure.',
        )

    def test_serializes_name(self):
        """Test that the name field is serialized."""
        data = GameDetailSerializer(self.game).data
        assert data['name'] == 'Test Game'

    def test_serializes_game_slug(self):
        """Test that the game_slug field is serialized."""
        data = GameDetailSerializer(self.game).data
        assert data['game_slug'] == 'test-game'

    def test_serializes_description(self):
        """Test that the description field is serialized."""
        data = GameDetailSerializer(self.game).data
        assert data['description'] == 'A grand adventure.'

    def test_serializes_empty_links(self):
        """Test that links is an empty list when the game has no links."""
        data = GameDetailSerializer(self.game).data
        assert data['links'] == []

    def test_serializes_nested_links(self):
        """Test that nested links are serialized with their fields."""
        Link.objects.create(text='Wiki', url='http://example.com/wiki', content_object=self.game)
        Link.objects.create(text='Forum', url='http://example.com/forum', content_object=self.game)
        data = GameDetailSerializer(self.game).data
        assert len(data['links']) == 2
        texts = [link['text'] for link in data['links']]
        assert 'Wiki' in texts
        assert 'Forum' in texts

    def test_serializes_empty_photos(self):
        """Test that photos is an empty list when the game has no photos."""
        data = GameDetailSerializer(self.game).data
        assert data['photos'] == []

    def test_serializes_nested_photos(self):
        """Test that nested photos are serialized with an id field."""
        photo1 = GamePhoto.objects.create(path='photos/games/test-game/img1.jpg', game=self.game)
        photo2 = GamePhoto.objects.create(path='photos/games/test-game/img2.jpg', game=self.game)
        data = GameDetailSerializer(self.game).data
        assert len(data['photos']) == 2
        ids = [photo['id'] for photo in data['photos']]
        assert photo1.id in ids
        assert photo2.id in ids

    def test_serializes_cover_photo_path_as_none_when_unset(self):
        """Test that cover_photo_path is null when the game has no cover photo."""
        data = GameDetailSerializer(self.game).data
        assert data['cover_photo_path'] is None

    def test_serializes_cover_photo_path_when_set(self):
        """Test that cover_photo_path equals the cover photo's path when set."""
        photo = GamePhoto.objects.create(path='photos/games/test-game/cover.jpg', game=self.game)
        self.game.cover_photo = photo
        self.game.save()
        data = GameDetailSerializer(self.game).data
        assert data['cover_photo_path'] == 'photos/games/test-game/cover.jpg'


class TestGameDetailSerializerNextSession(TestCase):
    """Tests for the next_session field of the GameDetailSerializer."""

    def setUp(self):
        """Set up a fresh game for each test."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_returns_none_when_no_sessions(self):
        """Test that next_session is null when the game has no sessions at all."""
        data = GameDetailSerializer(self.game).data
        assert data['next_session'] is None

    def test_returns_session_with_earliest_future_date(self):
        """Test that next_session is the earliest-dated session with date >= today."""
        today = timezone.now().date()
        GameSession.objects.create(
            game=self.game, title='Later', date=today + datetime.timedelta(days=10)
        )
        soonest = GameSession.objects.create(
            game=self.game, title='Soonest', date=today + datetime.timedelta(days=1)
        )
        data = GameDetailSerializer(self.game).data
        assert data['next_session'] == {'title': 'Soonest', 'date': soonest.date}

    def test_returns_session_scheduled_for_today(self):
        """Test that a session dated today counts as the next session."""
        today = timezone.now().date()
        session = GameSession.objects.create(game=self.game, title='Today', date=today)
        data = GameDetailSerializer(self.game).data
        assert data['next_session'] == {'title': 'Today', 'date': session.date}

    def test_returns_none_when_only_past_sessions_and_no_unscheduled(self):
        """Test that next_session is null when every dated session is in the past."""
        today = timezone.now().date()
        GameSession.objects.create(
            game=self.game, title='Past', date=today - datetime.timedelta(days=1)
        )
        data = GameDetailSerializer(self.game).data
        assert data['next_session'] is None

    def test_falls_back_to_first_by_id_when_no_session_has_a_date(self):
        """Test that next_session falls back to the first session by id when none has a date."""
        first = GameSession.objects.create(game=self.game, title='First')
        GameSession.objects.create(game=self.game, title='Second')
        data = GameDetailSerializer(self.game).data
        assert data['next_session'] == {'title': 'First', 'date': first.date}
