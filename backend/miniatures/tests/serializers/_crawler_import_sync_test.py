"""Tests for the crawler-import `SourceSync`/`CollectionSync` helpers."""

import pytest

from miniatures.models import Source
from miniatures.serializers._crawler_import_sync import CollectionSync, SourceSync
from miniatures.tests.factories import CollectionFactory, SourceFactory


@pytest.mark.django_db
class TestSourceSync:
    """Tests for `SourceSync`."""

    def test_creates_new_source(self):
        """Test that resolving an unknown name creates a new Source."""
        source = SourceSync(name='Lootstudios').resolve()
        assert source.name == 'Lootstudios'
        assert Source.objects.filter(name='Lootstudios').count() == 1

    def test_matches_existing_source_by_name(self):
        """Test that resolving a known name returns the existing Source, not a duplicate."""
        existing = SourceFactory(name='Lootstudios')

        source = SourceSync(name='Lootstudios').resolve()

        assert source == existing
        assert Source.objects.filter(name='Lootstudios').count() == 1


@pytest.mark.django_db
class TestCollectionSync:
    """Tests for `CollectionSync`."""

    def setup_method(self):
        """Set up a resolved Source shared by most tests."""
        self.source = SourceFactory(name='Lootstudios')

    def test_creates_new_collection_by_external_id(self):
        """Test that an unmatched external_id creates a new Collection with source and name."""
        collection = CollectionSync(
            source=self.source, external_id='ext-1', name='Monster Pack',
        ).resolve()

        assert collection.external_id == 'ext-1'
        assert collection.name == 'Monster Pack'
        assert collection.source == self.source

    def test_creates_new_collection_by_name_fallback(self):
        """Test that an unmatched name (no external_id given) creates a new Collection."""
        collection = CollectionSync(source=self.source, name='Terrain Set').resolve()

        assert collection.external_id is None
        assert collection.name == 'Terrain Set'
        assert collection.source == self.source

    def test_external_id_takes_precedence_over_coincidentally_matching_name(self):
        """Test that a matching external_id wins over a different Collection's matching name."""
        by_external_id = CollectionFactory(
            name='Original Name', external_id='ext-1', source=self.source,
        )
        CollectionFactory(name='Coincidental Name')

        collection = CollectionSync(
            source=self.source, external_id='ext-1', name='Coincidental Name',
        ).resolve()

        assert collection == by_external_id

    def test_match_existing_collection_reassigns_source_when_null(self):
        """Test that a matched Collection with no source gets reassigned to the resolved one."""
        existing = CollectionFactory(name='Monster Pack', source=None)

        collection = CollectionSync(source=self.source, name='Monster Pack').resolve()

        assert collection == existing
        existing.refresh_from_db()
        assert existing.source == self.source

    def test_match_existing_collection_reassigns_source_when_previously_different(self):
        """Test that a matched Collection's different prior source is overwritten."""
        other_source = SourceFactory(name='MyMiniFactory')
        existing = CollectionFactory(name='Monster Pack', source=other_source)

        collection = CollectionSync(source=self.source, name='Monster Pack').resolve()

        assert collection == existing
        existing.refresh_from_db()
        assert existing.source == self.source
