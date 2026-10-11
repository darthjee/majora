"""Tests for the staff copy-link registry."""

import pytest

from games.models import (
    GameCommonItemPhoto,
    GameDocumentFile,
    GameDocumentFilePhoto,
    GameDocumentPhoto,
    GameFactionPhoto,
    GameItemPhoto,
    GamePhoto,
    GamePossessionPhoto,
)
from games.tests.factories import GameDocumentFactory, GameFactory
from staff import copy_links
from staff.tests.photo_builders import PhotoBuilder

COVER_SLUGS = {
    GameItemPhoto: 'game_item',
    GameCommonItemPhoto: 'game_common_item',
    GameFactionPhoto: 'game_faction',
    GamePossessionPhoto: 'game_possession',
    GameDocumentPhoto: 'game_document',
}


class TestCopyLinksRegistry:
    """Tests for the registry lookups."""

    def test_models_lists_the_seven_copyable_models(self):
        """Test that `models` returns the seven copyable photo/file models."""
        assert set(copy_links.models()) == {
            GameItemPhoto, GameCommonItemPhoto, GameFactionPhoto, GamePossessionPhoto,
            GameDocumentPhoto, GameDocumentFile, GameDocumentFilePhoto,
        }

    def test_find_for_model_returns_entry(self):
        """Test that `find_for_model` returns the entry of a registered model."""
        assert copy_links.find_for_model(GameItemPhoto).model is GameItemPhoto

    def test_find_for_unknown_model_returns_none(self):
        """Test that `find_for_model` returns None for a non-copyable model."""
        assert copy_links.find_for_model(GamePhoto) is None

    def test_photo_type_resolves_staff_photo_type(self):
        """Test that a photo entry exposes its staff photo type."""
        assert copy_links.find_for_model(GameItemPhoto).photo_type.slug == 'game_item'

    def test_document_file_has_no_photo_type(self):
        """Test that the document-file entry has no staff photo type."""
        assert copy_links.find_for_model(GameDocumentFile).photo_type is None


@pytest.mark.django_db
class TestCopyLinkObjectIdsIn:
    """Tests for `CopyLink.object_ids_in`."""

    def setup_method(self):
        """Create a target game and another game, each with builders."""
        self.game = GameFactory(name='Target')
        self.other_game = GameFactory(name='Other')
        self.builder = PhotoBuilder(game=self.game)
        self.other_builder = PhotoBuilder(game=self.other_game)

    def _ids_in(self, model):
        """Return the ids of `model` rows reached from the target game."""
        return set(copy_links.find_for_model(model).object_ids_in(self.game))

    @pytest.mark.parametrize('model', list(COVER_SLUGS))
    def test_photo_rows_of_the_game_are_included(self, model):
        """Test that each owned photo type matches only the target game's rows."""
        photo, _ = self.builder.build(COVER_SLUGS[model])
        self.other_builder.build(COVER_SLUGS[model])
        assert self._ids_in(model) == {photo.pk}

    def test_document_file_rows_of_the_game_are_included(self):
        """Test that document files match only the target game's rows."""
        document_file = GameDocumentFile.objects.create(
            game_document=GameDocumentFactory(game=self.game), path='files/a.pdf'
        )
        GameDocumentFile.objects.create(
            game_document=GameDocumentFactory(game=self.other_game), path='files/b.pdf'
        )
        assert self._ids_in(GameDocumentFile) == {document_file.pk}

    def test_document_file_photos_are_reached_through_their_file(self):
        """Test that document-file photos match through `GameDocumentFile.photo`."""
        photo, _ = self.builder.build('game_document_file')
        self.other_builder.build('game_document_file')
        GameDocumentFilePhoto.objects.create(path='photos/orphan.png')
        assert self._ids_in(GameDocumentFilePhoto) == {photo.pk}


@pytest.mark.django_db
class TestCopyLinkSetCover:
    """Tests for `CopyLink.set_cover`."""

    def setup_method(self):
        """Create a photo builder."""
        self.builder = PhotoBuilder()

    @pytest.mark.parametrize('model', list(COVER_SLUGS))
    def test_set_cover_points_owner_photo_at_row(self, model):
        """Test that `set_cover` sets the owner's cover photo FK to the row."""
        photo, owner = self.builder.build(COVER_SLUGS[model])
        copy_links.find_for_model(model).set_cover(photo)
        owner.refresh_from_db()
        assert owner.photo_id == photo.pk

    def test_set_cover_is_noop_for_document_file(self):
        """Test that `set_cover` changes nothing for a document file."""
        document_file = GameDocumentFile.objects.create(
            game_document=GameDocumentFactory(), path='files/a.pdf'
        )
        copy_links.find_for_model(GameDocumentFile).set_cover(document_file)
        document_file.refresh_from_db()
        assert document_file.photo_id is None

    def test_set_cover_is_noop_for_document_file_photo(self):
        """Test that `set_cover` keeps the file's photo unchanged for a file photo."""
        photo, document_file = self.builder.build('game_document_file')
        other = GameDocumentFilePhoto.objects.create(path='photos/other.png')
        copy_links.find_for_model(GameDocumentFilePhoto).set_cover(other)
        document_file.refresh_from_db()
        assert document_file.photo_id == photo.pk


@pytest.mark.django_db
class TestCopyLinkCachePaths:
    """Tests for the `CopyLink.cache_paths` hook."""

    def setup_method(self):
        """Create a photo row."""
        self.photo, _ = PhotoBuilder().build('game_item')

    def test_default_cache_paths_is_empty(self):
        """Test that the default hook returns no paths."""
        for entry in copy_links.COPY_LINKS:
            assert entry.cache_paths(self.photo, None) == []

    def test_registered_hook_is_called(self):
        """Test that a registered hook receives the row and upload and returns its paths."""
        entry = copy_links.CoverCopyLink(
            GameItemPhoto, 'game_item',
            cache_paths=lambda row, upload: [f'/items/{row.pk}.json', upload],
        )
        assert entry.cache_paths(self.photo, 'upload') == [f'/items/{self.photo.pk}.json', 'upload']
