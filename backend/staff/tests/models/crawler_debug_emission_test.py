"""Tests for the CrawlerDebugEmission model."""

import pytest
from django.core.exceptions import ValidationError

from staff.models import CrawlerDebugEmission


@pytest.mark.django_db
class TestCrawlerDebugEmission:
    """Tests for the CrawlerDebugEmission model."""

    def test_creation(self):
        """Test that an emission can be created with source, type, and payload."""
        emission = CrawlerDebugEmission.objects.create(
            source='lootstudios', type='stl_model', payload={'name': 'Goblin'},
        )
        assert emission.source == 'lootstudios'
        assert emission.type == 'stl_model'
        assert emission.payload == {'name': 'Goblin'}
        assert emission.created_at is not None

    def test_blank_source_raises_on_full_clean(self):
        """Test that a blank source fails full_clean() validation."""
        emission = CrawlerDebugEmission(source='', type='stl_model', payload={})
        with pytest.raises(ValidationError):
            emission.full_clean()

    def test_blank_type_raises_on_full_clean(self):
        """Test that a blank type fails full_clean() validation."""
        emission = CrawlerDebugEmission(source='lootstudios', type='', payload={})
        with pytest.raises(ValidationError):
            emission.full_clean()

    def test_ordering_is_ascending_by_id(self):
        """Test that emissions are ordered ascending by id (oldest-first)."""
        first = CrawlerDebugEmission.objects.create(source='a', type='b', payload={})
        second = CrawlerDebugEmission.objects.create(source='a', type='b', payload={})
        emissions = list(CrawlerDebugEmission.objects.all())
        assert emissions[0].id == first.id
        assert emissions[1].id == second.id

    def test_str(self):
        """Test the string representation of an emission."""
        emission = CrawlerDebugEmission.objects.create(
            source='lootstudios', type='stl_model', payload={},
        )
        assert str(emission) == f'lootstudios:stl_model#{emission.id}'
