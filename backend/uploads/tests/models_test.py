"""Tests for the Upload model."""

from datetime import timedelta

import pytest
from django.test import TestCase
from django.utils import timezone

from games.models import GamePhoto
from games.tests.factories import GameFactory, UserFactory
from uploads.models import Upload


class TestUpload(TestCase):
    """Tests for the Upload model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.user = UserFactory(username='alice', password='secret-password')

    def test_token_is_auto_generated(self):
        """Test that a token is generated automatically on save."""
        upload = Upload.objects.create(
            user=self.user,
            file_path='photos/games/my-game/file_abc123.jpg',
        )
        assert upload.token != ''
        assert upload.token is not None
        assert len(upload.token) > 0

    def test_token_is_unique(self):
        """Test that two uploads have different tokens."""
        upload1 = Upload.objects.create(
            user=self.user,
            file_path='photos/games/my-game/file_1.jpg',
        )
        upload2 = Upload.objects.create(
            user=self.user,
            file_path='photos/games/my-game/file_2.jpg',
        )
        assert upload1.token != upload2.token

    def test_default_status_is_pending(self):
        """Test that the default status is 'pending'."""
        upload = Upload.objects.create(
            user=self.user,
            file_path='photos/games/my-game/file_abc123.jpg',
        )
        assert upload.status == Upload.STATUS_PENDING

    def test_expiration_time_is_set_on_creation(self):
        """Test that expiration_time is set to approximately now + 1 hour."""
        before = timezone.now()
        upload = Upload.objects.create(
            user=self.user,
            file_path='photos/games/my-game/file_abc123.jpg',
        )
        after = timezone.now()

        assert upload.expiration_time >= before + timedelta(minutes=59)
        assert upload.expiration_time <= after + timedelta(minutes=61)

    def test_status_can_transition_from_pending_to_uploading(self):
        """Test that status can change from pending to uploading."""
        upload = Upload.objects.create(
            user=self.user,
            file_path='photos/games/my-game/file_abc123.jpg',
        )
        upload.status = Upload.STATUS_UPLOADING
        upload.save()

        upload.refresh_from_db()
        assert upload.status == Upload.STATUS_UPLOADING

    def test_status_can_transition_to_uploaded(self):
        """Test that status can change to uploaded."""
        upload = Upload.objects.create(
            user=self.user,
            file_path='photos/games/my-game/file_abc123.jpg',
        )
        upload.status = Upload.STATUS_UPLOADED
        upload.save()

        upload.refresh_from_db()
        assert upload.status == Upload.STATUS_UPLOADED

    def test_status_cannot_be_updated_once_uploaded(self):
        """Test that saving after status is 'uploaded' raises ValueError."""
        upload = Upload.objects.create(
            user=self.user,
            file_path='photos/games/my-game/file_abc123.jpg',
            status=Upload.STATUS_UPLOADED,
        )

        upload.status = Upload.STATUS_PENDING
        with pytest.raises(ValueError):
            upload.save()

    def test_str_representation(self):
        """Test string representation of an upload."""
        upload = Upload(user=self.user, status=Upload.STATUS_PENDING)
        assert str(upload) == 'Upload(user=alice, status=pending)'

    def test_upload_user_relationship(self):
        """Test that uploads can be accessed via user's related name."""
        Upload.objects.create(
            user=self.user,
            file_path='photos/games/my-game/file_1.jpg',
        )
        Upload.objects.create(
            user=self.user,
            file_path='photos/games/my-game/file_2.jpg',
        )
        assert self.user.uploads.count() == 2

    def test_content_object_defaults_to_none(self):
        """Test that content_object is None by default."""
        upload = Upload.objects.create(
            user=self.user,
            file_path='photos/games/my-game/file_abc123.jpg',
        )
        assert upload.content_object is None
        assert upload.content_type is None
        assert upload.object_id is None

    def test_content_object_can_be_assigned(self):
        """Test that a GenericForeignKey can be assigned and retrieved."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        game_photo = GamePhoto.objects.create(
            game=game,
            path='photos/games/test-game/photo_abc.jpg',
            ready=False,
        )
        upload = Upload.objects.create(
            user=self.user,
            file_path='photos/games/test-game/photo_abc.jpg',
        )
        upload.content_object = game_photo
        upload.save()

        upload.refresh_from_db()
        assert upload.content_object == game_photo
        assert upload.object_id == game_photo.pk

    def test_content_object_persists_after_refresh(self):
        """Test that content_object resolves correctly after a DB reload."""
        game = GameFactory(name='Persist Game', game_slug='persist-game')
        game_photo = GamePhoto.objects.create(
            game=game,
            path='photos/games/persist-game/img.jpg',
            ready=False,
        )
        upload = Upload.objects.create(
            user=self.user,
            file_path='photos/games/persist-game/img.jpg',
        )
        upload.content_object = game_photo
        upload.save()

        reloaded = Upload.objects.get(pk=upload.pk)
        assert reloaded.content_object.pk == game_photo.pk

    def test_default_origin_is_regular(self):
        """Test that the default origin is 'regular'."""
        upload = Upload.objects.create(
            user=self.user,
            file_path='photos/games/my-game/file_abc123.jpg',
        )
        assert upload.origin == Upload.ORIGIN_REGULAR
        assert upload.is_staff_origin is False

    def test_staff_origin_flag(self):
        """Test that a staff upload reports is_staff_origin."""
        upload = Upload.objects.create(
            user=self.user,
            file_path='photos/games/my-game/file_abc123.jpg',
            origin=Upload.ORIGIN_STAFF,
        )
        assert upload.is_staff_origin is True


class TestUploadActiveQuerySet(TestCase):
    """Tests for the Upload active-upload queryset helpers."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.user = UserFactory(username='bob', password='secret-password')
        game = GameFactory(name='Active Game', game_slug='active-game')
        cls.photo = GamePhoto.objects.create(game=game, path='photos/a.jpg', ready=True)
        cls.other_photo = GamePhoto.objects.create(game=game, path='photos/b.jpg', ready=True)

    def _upload(self, photo, **kwargs):
        """Create an upload linked to the given photo."""
        upload = Upload.objects.create(
            user=self.user, file_path=photo.path, content_object=photo, **kwargs
        )
        return upload

    def test_pending_not_expired_is_active(self):
        """Test that a pending, non-expired upload is active."""
        upload = self._upload(self.photo)
        assert list(Upload.objects.active().for_object(self.photo)) == [upload]

    def test_uploading_not_expired_is_active(self):
        """Test that an uploading, non-expired upload is active."""
        upload = self._upload(self.photo, status=Upload.STATUS_UPLOADING)
        assert list(Upload.objects.active().for_object(self.photo)) == [upload]

    def test_uploaded_is_not_active(self):
        """Test that an uploaded upload is not active."""
        self._upload(self.photo, status=Upload.STATUS_UPLOADED)
        assert not Upload.objects.active().for_object(self.photo).exists()

    def test_expired_is_not_active(self):
        """Test that an expired pending upload is not active."""
        self._upload(
            self.photo, expiration_time=timezone.now() - timedelta(minutes=1)
        )
        assert not Upload.objects.active().for_object(self.photo).exists()

    def test_for_object_ignores_other_objects(self):
        """Test that for_object only matches the given instance."""
        self._upload(self.other_photo)
        assert not Upload.objects.active().for_object(self.photo).exists()

    def test_for_objects_matches_listed_ids(self):
        """Test that for_objects matches every listed id of the model."""
        self._upload(self.photo)
        self._upload(self.other_photo)
        ids = Upload.objects.active().for_objects(
            GamePhoto, [self.photo.pk, self.other_photo.pk]
        ).values_list('object_id', flat=True)
        assert sorted(ids) == sorted([self.photo.pk, self.other_photo.pk])
