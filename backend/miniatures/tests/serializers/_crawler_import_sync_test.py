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

    def test_creates_new_collection_by_external_id_only_falls_back_name(self):
        """Test that creating with external_id and no name falls back to it as the name."""
        collection = CollectionSync(source=self.source, external_id='ext-1').resolve()

        assert collection.external_id == 'ext-1'
        assert collection.name == 'ext-1'

    def test_create_stores_url(self):
        """Test that a newly created Collection also stores the given url."""
        collection = CollectionSync(
            source=self.source, name='Monster Pack', url='https://example.com/collection',
        ).resolve()

        assert collection.url == 'https://example.com/collection'

    def test_resolve_sets_created_true_on_create(self):
        """Test that resolve() sets sync.created to True when a new Collection was made."""
        sync = CollectionSync(source=self.source, name='Monster Pack')
        sync.resolve()

        assert sync.created is True

    def test_resolve_sets_created_false_on_match(self):
        """Test that resolve() sets sync.created to False when an existing Collection matched."""
        CollectionFactory(name='Monster Pack')

        sync = CollectionSync(source=self.source, name='Monster Pack')
        sync.resolve()

        assert sync.created is False

    def test_update_existing_false_does_not_change_name_or_url(self):
        """Test that a match with update_existing=False (default) leaves name/url untouched."""
        existing = CollectionFactory(
            name='Old Name', external_id='ext-1', url='https://example.com/old',
        )

        CollectionSync(
            source=self.source, external_id='ext-1', name='New Name',
            url='https://example.com/new',
        ).resolve()

        existing.refresh_from_db()
        assert existing.name == 'Old Name'
        assert existing.url == 'https://example.com/old'

    def test_update_existing_true_updates_name_and_url(self):
        """Test that a match with update_existing=True refreshes name/url from the given ones."""
        existing = CollectionFactory(
            name='Old Name', external_id='ext-1', url='https://example.com/old',
        )

        collection = CollectionSync(
            source=self.source, external_id='ext-1', name='New Name',
            url='https://example.com/new', update_existing=True,
        ).resolve()

        assert collection.id == existing.id
        existing.refresh_from_db()
        assert existing.name == 'New Name'
        assert existing.url == 'https://example.com/new'
        assert existing.source == self.source

    def test_update_existing_true_sets_created_false(self):
        """Test that resolve() still sets sync.created to False when update_existing matches."""
        CollectionFactory(name='Old Name', external_id='ext-1')

        sync = CollectionSync(
            source=self.source, external_id='ext-1', name='New Name', update_existing=True,
        )
        sync.resolve()

        assert sync.created is False
