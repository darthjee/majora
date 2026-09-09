"""Tests for CrawlerDebugEmissionSummary (independent of the view)."""

import pytest

from staff.crawler_debug_emission_summary import CrawlerDebugEmissionSummary
from staff.models import CrawlerDebugEmission


@pytest.mark.django_db
class TestCrawlerDebugEmissionSummary:
    """Tests for CrawlerDebugEmissionSummary.as_dict()."""

    def test_empty_table_returns_empty_dict(self):
        """Test that an empty table yields an empty dict."""
        assert CrawlerDebugEmissionSummary().as_dict() == {}

    def test_groups_counts_by_type(self):
        """Test that rows are counted per distinct type."""
        CrawlerDebugEmission.objects.create(source='a', type='stl_model', payload={})
        CrawlerDebugEmission.objects.create(source='a', type='stl_model', payload={})
        CrawlerDebugEmission.objects.create(source='a', type='collection', payload={})
        assert CrawlerDebugEmissionSummary().as_dict() == {'stl_model': 2, 'collection': 1}

    def test_grouping_ignores_source(self):
        """Test that differing sources do not split a type's count (guards the GROUP BY bug)."""
        CrawlerDebugEmission.objects.create(source='lootstudios', type='stl_model', payload={})
        CrawlerDebugEmission.objects.create(source='titancraft', type='stl_model', payload={})
        assert CrawlerDebugEmissionSummary().as_dict() == {'stl_model': 2}

    def test_reports_unexpected_free_text_types(self):
        """Test that arbitrary free-text type values are reported as-is."""
        CrawlerDebugEmission.objects.create(source='a', type='foo', payload={})
        assert CrawlerDebugEmissionSummary().as_dict() == {'foo': 1}
