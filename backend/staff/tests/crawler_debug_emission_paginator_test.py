"""Tests for CrawlerDebugEmissionPaginator and enforce_retention_cap (independent of the view)."""

import pytest
from django.test import RequestFactory

from staff.crawler_debug_emission_paginator import (
    PAGE_SIZE,
    CrawlerDebugEmissionPaginator,
    enforce_retention_cap,
)
from staff.models import CrawlerDebugEmission


def _create_emissions(count):
    """Create `count` CrawlerDebugEmission rows, returning them oldest-first."""
    return [
        CrawlerDebugEmission.objects.create(source='lootstudios', type='stl_model', payload={})
        for _ in range(count)
    ]


@pytest.mark.django_db
class TestCrawlerDebugEmissionPaginator:
    """Tests for CrawlerDebugEmissionPaginator."""

    def setup_method(self):
        """Set up a request factory for building GET requests with query params."""
        self.factory = RequestFactory()

    def _paginate(self, **query_params):
        """Build a request with `query_params` and paginate the full emissions queryset."""
        request = self.factory.get('/staff/crawler.json', query_params)
        return CrawlerDebugEmissionPaginator(request, CrawlerDebugEmission.objects.all()).paginate()

    def test_no_last_id_returns_from_the_start(self):
        """Test that omitting last_id returns rows from the start, oldest-first."""
        emissions = _create_emissions(3)
        page = self._paginate()
        assert [emission.id for emission in page] == [emission.id for emission in emissions]

    def test_no_last_id_caps_to_page_size(self):
        """Test that omitting last_id still caps the result to PAGE_SIZE."""
        emissions = _create_emissions(PAGE_SIZE + 5)
        page = self._paginate()
        assert len(page) == PAGE_SIZE
        assert [emission.id for emission in page] == [
            emission.id for emission in emissions[:PAGE_SIZE]
        ]

    def test_last_id_returns_only_newer_rows(self):
        """Test that a valid mid-window last_id returns only rows newer than it."""
        emissions = _create_emissions(3)
        page = self._paginate(last_id=emissions[0].id)
        assert [emission.id for emission in page] == [
            emission.id for emission in emissions[1:]
        ]

    def test_last_id_evicted_or_nonexistent_returns_empty(self):
        """Test that a valid but nonexistent/evicted last_id returns an empty list."""
        emissions = _create_emissions(3)
        page = self._paginate(last_id=emissions[-1].id + 1000)
        assert page == []

    def test_malformed_last_id_raises_value_error(self):
        """Test that a non-integer last_id raises ValueError."""
        _create_emissions(1)
        with pytest.raises(ValueError):
            self._paginate(last_id='not-an-int')


@pytest.mark.django_db
class TestEnforceRetentionCap:
    """Tests for enforce_retention_cap."""

    def test_below_cap_deletes_nothing(self):
        """Test that a count below the cap leaves every row intact."""
        emissions = _create_emissions(3)
        enforce_retention_cap(CrawlerDebugEmission.objects.all(), cap=5)
        remaining_ids = set(CrawlerDebugEmission.objects.values_list('id', flat=True))
        assert remaining_ids == {emission.id for emission in emissions}

    def test_above_cap_deletes_the_oldest_rows(self):
        """Test that a count above the cap deletes the oldest rows beyond it."""
        emissions = _create_emissions(7)
        enforce_retention_cap(CrawlerDebugEmission.objects.all(), cap=5)
        remaining_ids = set(CrawlerDebugEmission.objects.values_list('id', flat=True))
        assert remaining_ids == {emission.id for emission in emissions[-5:]}

    def test_never_exceeds_the_cap_across_repeated_inserts(self):
        """Test that repeatedly inserting beyond the cap keeps the table within it."""
        for _ in range(PAGE_SIZE):
            CrawlerDebugEmission.objects.create(source='a', type='b', payload={})
            enforce_retention_cap(CrawlerDebugEmission.objects.all(), cap=10)
        assert CrawlerDebugEmission.objects.count() == 10
