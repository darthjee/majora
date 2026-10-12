"""Tests for the cover-photo link builder of the staff copies."""

import pytest
from django.contrib.contenttypes.models import ContentType

from games.models import GameCommonItemPhoto, GameItemPhoto
from games.tests.factories import (
    GameCommonItemFactory,
    GameFactory,
    GameItemFactory,
    UserFactory,
)
from staff.copy_photo_links import CoverPhotoLinkBuilder
from uploads.models import Upload


@pytest.mark.django_db
class TestCoverPhotoLinkBuilder:
    """Tests for `CoverPhotoLinkBuilder` over game items."""

    def setup_method(self):
        """Set up a source item with a ready cover and its copy in a target game."""
        self.user = UserFactory()
        self.target = GameFactory(name='Target', game_slug='target')
        self.source = GameItemFactory(game=GameFactory(name='Source', game_slug='source'))
        self.cover = GameItemPhoto.objects.create(
            game_item=self.source, path='photos/games/source/items/1/photo.jpeg', ready=True,
        )
        self.copy = GameItemFactory(game=self.target, copied_from=self.source)
        self.builder = CoverPhotoLinkBuilder('game_item', self.user)

    def _build(self, source_photo=None):
        """Build the cover link of the copy from `source_photo` (default: the ready cover)."""
        photo = self.cover if source_photo is None else source_photo
        return self.builder.build(photo, self.copy, self._segments())

    def _segments(self):
        """Return the target path segments of the copy."""
        return ['games', self.target.game_slug, 'items', self.copy.id]

    def _expected_path(self, ext='.jpeg'):
        """Return the path the copy's cover is expected at."""
        return f'photos/games/target/items/{self.copy.id}/photo{ext}'

    def test_creates_not_ready_photo_row_at_target_path(self):
        """Test that the copy's photo row is created not ready at the target path."""
        self._build()
        photo = GameItemPhoto.objects.get(game_item=self.copy)
        assert (photo.path, photo.ready) == (self._expected_path(), False)

    def test_returns_the_created_upload(self):
        """Test that the returned upload is the persisted copy link."""
        upload = self._build()
        assert Upload.objects.get(pk=upload.pk) == upload

    def test_upload_fields(self):
        """Test that the upload carries every copy-link field."""
        upload = self._build()
        photo = GameItemPhoto.objects.get(game_item=self.copy)
        assert upload.user == self.user
        assert upload.origin == Upload.ORIGIN_COPY
        assert upload.status == Upload.STATUS_PENDING
        assert upload.upload_type == Upload.UPLOAD_TYPE_IMAGE
        assert upload.source_path == self.cover.path
        assert upload.file_path == self._expected_path()
        assert upload.is_cover is True
        assert upload.content_type == ContentType.objects.get_for_model(GameItemPhoto)
        assert upload.object_id == photo.id

    def test_keeps_the_source_extension(self):
        """Test that the target path keeps the source file extension."""
        self.cover.path = 'photos/games/source/items/1/photo.webp'
        self.cover.save()
        assert self._build().file_path == self._expected_path('.webp')

    def test_does_not_change_the_copy_cover(self):
        """Test that the copy's cover FK stays null until the link is finalized."""
        self._build()
        self.copy.refresh_from_db()
        assert self.copy.photo is None

    def test_no_link_without_source_photo(self):
        """Test that a missing source photo creates neither a row nor a link."""
        assert self.builder.build(None, self.copy, self._segments()) is None
        assert not GameItemPhoto.objects.filter(game_item=self.copy).exists()
        assert not Upload.objects.exists()

    def test_no_link_for_not_ready_source_photo(self):
        """Test that a not-ready source photo creates neither a row nor a link."""
        self.cover.ready = False
        self.cover.save()
        assert self._build() is None
        assert not GameItemPhoto.objects.filter(game_item=self.copy).exists()
        assert not Upload.objects.exists()

    def test_segments_are_normalized(self):
        """Test that the path segments are sanitized like regular uploads."""
        upload = self.builder.build(self.cover, self.copy, ['games', 'a b', 'items', 7])
        assert upload.file_path == 'photos/games/a_b/items/7/photo.jpeg'


@pytest.mark.django_db
class TestCoverPhotoLinkBuilderOtherOwner:
    """Tests for `CoverPhotoLinkBuilder` over another cover owner (common items)."""

    def test_creates_row_of_the_source_model_on_the_owner_field(self):
        """Test that the photo row uses the source photo's model and the given owner field."""
        target = GameFactory(name='Target', game_slug='target')
        source = GameCommonItemFactory(game=GameFactory(name='Source', game_slug='source'))
        cover = GameCommonItemPhoto.objects.create(
            game_common_item=source, path='photos/x/photo.png', ready=True,
        )
        copy = GameCommonItemFactory(game=target)
        builder = CoverPhotoLinkBuilder('game_common_item', UserFactory())
        upload = builder.build(cover, copy, ['games', 'target', 'common_items', copy.id])
        assert upload.content_object.game_common_item == copy
        assert isinstance(upload.content_object, GameCommonItemPhoto)
