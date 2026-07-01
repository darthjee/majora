"""Tests for the Paginator class."""

import pytest
from rest_framework.test import APIRequestFactory

from games.models import Character, Game
from games.paginator import Paginator


def _make_request(page=None, per_page=None):
    """Build a GET request with optional pagination query params."""
    factory = APIRequestFactory()
    params = {}
    if page is not None:
        params['page'] = page
    if per_page is not None:
        params['per_page'] = per_page
    return factory.get('/fake/', params)


@pytest.mark.django_db
class TestPaginatorPaginate:
    """Tests for Paginator.paginate()."""

    def setup_method(self):
        """Set up a game with several NPC characters."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        for i in range(5):
            Character.objects.create(name=f'NPC {i}', game=self.game, npc=True)
        self.queryset = self.game.characters.filter(npc=True)

    def test_returns_first_page_by_default(self):
        """Test that the first page is returned when no page param is given."""
        request = _make_request(per_page=3)
        page_qs, _ = Paginator(request, self.queryset).paginate()
        assert page_qs.count() == 3

    def test_returns_correct_items_on_second_page(self):
        """Test that page=2 returns the next batch of items."""
        request = _make_request(page=2, per_page=3)
        page_qs, _ = Paginator(request, self.queryset).paginate()
        assert page_qs.count() == 2

    def test_headers_contain_page(self):
        """Test that headers include the current page number."""
        request = _make_request(page=2, per_page=3)
        _, headers = Paginator(request, self.queryset).paginate()
        assert headers['page'] == 2

    def test_headers_contain_pages(self):
        """Test that headers include the total number of pages."""
        request = _make_request(per_page=3)
        _, headers = Paginator(request, self.queryset).paginate()
        assert headers['pages'] == 2

    def test_headers_contain_per_page(self):
        """Test that headers include the page size."""
        request = _make_request(per_page=3)
        _, headers = Paginator(request, self.queryset).paginate()
        assert headers['per_page'] == 3

    def test_headers_contain_total(self):
        """Test that headers include the total item count."""
        request = _make_request(per_page=3)
        _, headers = Paginator(request, self.queryset).paginate()
        assert headers['total'] == 5

    def test_single_page_when_all_fit(self):
        """Test that pages=1 when all items fit on one page."""
        request = _make_request(per_page=10)
        _, headers = Paginator(request, self.queryset).paginate()
        assert headers['pages'] == 1

    def test_uses_default_per_page_when_not_provided(self, monkeypatch):
        """Test that the default per_page comes from Settings.pagination_size()."""
        monkeypatch.setenv('MAJORA_PAGINATION_SIZE', '2')
        request = _make_request()
        _, headers = Paginator(request, self.queryset).paginate()
        assert headers['per_page'] == 2

    def test_page_defaults_to_one_when_not_provided(self):
        """Test that page defaults to 1 when not in the request."""
        request = _make_request(per_page=3)
        _, headers = Paginator(request, self.queryset).paginate()
        assert headers['page'] == 1

    def test_items_ordered_by_id(self):
        """Test that paginated results are ordered by id."""
        request = _make_request(per_page=10)
        page_qs, _ = Paginator(request, self.queryset).paginate()
        ids = list(page_qs.values_list('id', flat=True))
        assert ids == sorted(ids)

    def test_empty_queryset_returns_one_page(self):
        """Test that an empty queryset reports pages=1."""
        request = _make_request(per_page=3)
        empty_qs = self.game.characters.filter(npc=False)
        _, headers = Paginator(request, empty_qs).paginate()
        assert headers['pages'] == 1
        assert headers['total'] == 0

    def test_invalid_page_param_falls_back_to_one(self):
        """Test that a non-integer page param defaults to 1."""
        request = _make_request(page='bad', per_page=3)
        _, headers = Paginator(request, self.queryset).paginate()
        assert headers['page'] == 1

    def test_invalid_per_page_param_falls_back_to_default(self, monkeypatch):
        """Test that a non-integer per_page param uses the default."""
        monkeypatch.setenv('MAJORA_PAGINATION_SIZE', '10')
        request = _make_request(per_page='oops')
        _, headers = Paginator(request, self.queryset).paginate()
        assert headers['per_page'] == 10
