"""Tests for the Upload model."""

import pytest
from django.contrib.auth.models import User
from django.utils import timezone

from games.models import Game, GamePhoto, Upload


@pytest.mark.django_db
class TestUpload:

    """Tests for the Upload model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.user = User.objects.create_user(username='alice', password='secret-password')

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

        from datetime import timedelta
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
        game = Game.objects.create(name='Test Game', game_slug='test-game')
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
        game = Game.objects.create(name='Persist Game', game_slug='persist-game')
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
