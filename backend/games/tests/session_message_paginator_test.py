"""Tests for the SessionMessagePaginator class."""

from django.test import TestCase
from rest_framework.test import APIRequestFactory

from games.models import GameSession, GameSessionMessage
from games.session_message_paginator import PAGE_SIZE, SessionMessagePaginator
from games.tests.factories import GameFactory, UserFactory


def _make_request(next_entry_id=None):
    """Build a GET request with an optional next-entry-id query param."""
    factory = APIRequestFactory()
    params = {}
    if next_entry_id is not None:
        params['next-entry-id'] = next_entry_id
    return factory.get('/fake/', params)


class TestSessionMessagePaginatorPaginate(TestCase):
    """Tests for SessionMessagePaginator.paginate()."""

    @classmethod
    def setUpTestData(cls):
        """Set up a session with more messages than one page holds."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.session = GameSession.objects.create(game=cls.game, title='Session One')
        cls.user = UserFactory(username='alice', password='secret-password')
        cls.messages = [
            GameSessionMessage.objects.create(
                session=cls.session, user=cls.user, content=f'Message {i}'
            )
            for i in range(PAGE_SIZE + 5)
        ]

    def _queryset(self):
        """Return the session's messages, already ordered by the model's default ordering."""
        return self.session.messages.all()

    def test_first_page_returns_page_size_items(self):
        """Test that the first page (no cursor) returns PAGE_SIZE items."""
        request = _make_request()
        page, _ = SessionMessagePaginator(request, self._queryset()).paginate()
        assert len(page) == PAGE_SIZE

    def test_first_page_returns_most_recent_items(self):
        """Test that the first page returns the most recent messages, descending."""
        request = _make_request()
        page, _ = SessionMessagePaginator(request, self._queryset()).paginate()
        expected_ids = [m.id for m in reversed(self.messages)][:PAGE_SIZE]
        assert [m.id for m in page] == expected_ids

    def test_first_page_headers_contain_next_entry_id(self):
        """Test that the first page's headers point to the oldest item still available."""
        request = _make_request()
        page, headers = SessionMessagePaginator(request, self._queryset()).paginate()
        assert headers['NEXT-ENTRY-ID'] == str(page[-1].id)

    def test_cursor_page_repeats_boundary_message_first(self):
        """Test that the cursor message is repeated as the first item of the next page."""
        request = _make_request()
        first_page, headers = SessionMessagePaginator(request, self._queryset()).paginate()
        cursor = headers['NEXT-ENTRY-ID']

        next_request = _make_request(next_entry_id=cursor)
        second_page, _ = SessionMessagePaginator(next_request, self._queryset()).paginate()

        assert str(second_page[0].id) == cursor
        assert second_page[0].id == first_page[-1].id

    def test_cursor_page_returns_remaining_items(self):
        """Test that the second page returns the remaining older messages."""
        request = _make_request()
        _, headers = SessionMessagePaginator(request, self._queryset()).paginate()
        cursor = headers['NEXT-ENTRY-ID']

        next_request = _make_request(next_entry_id=cursor)
        second_page, _ = SessionMessagePaginator(next_request, self._queryset()).paginate()

        # 5 older messages, plus the repeated boundary message.
        assert len(second_page) == 6

    def test_last_page_returns_empty_next_entry_id(self):
        """Test that NEXT-ENTRY-ID is empty when there are no older messages left."""
        request = _make_request()
        _, headers = SessionMessagePaginator(request, self._queryset()).paginate()
        cursor = headers['NEXT-ENTRY-ID']

        next_request = _make_request(next_entry_id=cursor)
        _, second_headers = SessionMessagePaginator(next_request, self._queryset()).paginate()

        assert second_headers['NEXT-ENTRY-ID'] == ''

    def test_empty_queryset_returns_empty_next_entry_id(self):
        """Test that an empty queryset reports an empty NEXT-ENTRY-ID."""
        other_session = GameSession.objects.create(game=self.game, title='Empty Session')
        request = _make_request()
        page, headers = SessionMessagePaginator(request, other_session.messages.all()).paginate()
        assert page == []
        assert headers['NEXT-ENTRY-ID'] == ''

    def test_invalid_next_entry_id_is_ignored(self):
        """Test that a non-integer next-entry-id falls back to the first page."""
        request = _make_request(next_entry_id='not-a-number')
        page, _ = SessionMessagePaginator(request, self._queryset()).paginate()
        assert len(page) == PAGE_SIZE
        assert page[0].id == self.messages[-1].id
