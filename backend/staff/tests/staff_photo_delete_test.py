"""Tests for the staff photo delete view (DELETE /staff/photos/<type>/<id>.json)."""

from datetime import timedelta

import pytest
from django.utils import timezone

from staff import photo_types
from staff.tests.photo_test_support import StaffPhotoActorsMixin
from uploads.models import Upload

SLUGS = photo_types.slugs()


def _url(slug, photo_id):
    """Return the delete URL of the given photo."""
    return f'/staff/photos/{slug}/{photo_id}.json'


@pytest.mark.django_db
class TestStaffPhotoDeleteView(StaffPhotoActorsMixin):
    """Tests for the DELETE /staff/photos/<photo_type>/<photo_id>.json endpoint."""

    def setup_method(self):
        """Set up staff, superuser and regular users."""
        self.setup_actors()

    def _build_current(self, slug, owner=None, ready=True):
        """Build a photo and make it its owner's current photo."""
        photo, owner = self.builder.build(slug, owner=owner, ready=ready)
        owner.photo = photo
        owner.save()
        return photo, owner

    def _delete(self, client, slug, photo_id, token=None):
        """DELETE the given photo."""
        token = self.staff_token if token is None else token
        return self.delete_json(client, _url(slug, photo_id), token)

    def test_unauthenticated_returns_401(self, client):
        """Test that an unauthenticated request returns 401, even for an unknown photo."""
        response = self.delete_json(client, _url('unknown', 999))
        assert response.status_code == 401
        assert response['X-Skip-Cache'] == 'true'

    def test_non_staff_returns_403(self, client):
        """Test that a regular user gets 403 and the photo stays."""
        photo, _ = self.builder.build('game')
        response = self._delete(client, 'game', photo.pk, token=self.regular_token)
        assert response.status_code == 403
        assert type(photo).objects.filter(pk=photo.pk).exists()

    def test_unknown_slug_returns_404(self, client):
        """Test that an unknown photo type returns 404."""
        assert self._delete(client, 'unknown', 1).status_code == 404

    def test_unknown_id_returns_404(self, client):
        """Test that an unknown photo id returns 404."""
        assert self._delete(client, 'game', 999999).status_code == 404

    def test_id_of_another_type_returns_404(self, client):
        """Test that the id of another type's photo returns 404 and deletes nothing."""
        photo, _ = self.builder.build('game_item')
        assert self._delete(client, 'game_possession', photo.pk).status_code == 404
        assert type(photo).objects.filter(pk=photo.pk).exists()

    @pytest.mark.parametrize('slug', SLUGS)
    def test_deletes_row_and_clears_owner(self, client, slug):
        """Test that the row is deleted and its owner's photo is cleared."""
        photo, owner = self._build_current(slug)
        response = self._delete(client, slug, photo.pk)
        assert response.status_code == 204
        assert response['X-Skip-Cache'] == 'true'
        assert not type(photo).objects.filter(pk=photo.pk).exists()
        owner.refresh_from_db()
        assert owner.photo_id is None

    def test_superuser_can_delete(self, client):
        """Test that a superuser can delete a photo."""
        photo, _ = self.builder.build('game')
        assert self._delete(client, 'game', photo.pk, self.superuser_token).status_code == 204

    def test_active_upload_returns_422(self, client):
        """Test that a photo with an active upload is not deleted."""
        photo, _ = self.builder.build('game')
        Upload.objects.create(user=self.staff_user, file_path=photo.path, content_object=photo)
        assert self._delete(client, 'game', photo.pk).status_code == 422
        assert type(photo).objects.filter(pk=photo.pk).exists()

    def test_expired_upload_does_not_block(self, client):
        """Test that an expired leftover upload does not block deletion."""
        photo, _ = self.builder.build('game')
        Upload.objects.create(
            user=self.staff_user, file_path=photo.path, content_object=photo,
            expiration_time=timezone.now() - timedelta(minutes=1),
        )
        assert self._delete(client, 'game', photo.pk).status_code == 204


@pytest.mark.django_db
class TestStaffPhotoDeleteGalleryFallback(StaffPhotoActorsMixin):
    """Tests for the gallery fallback when deleting an owner's current photo."""

    def setup_method(self):
        """Set up staff, superuser and regular users."""
        self.setup_actors()

    def _delete(self, client, slug, photo):
        """DELETE the given photo as staff."""
        return self.delete_json(client, _url(slug, photo.pk), self.staff_token)

    @pytest.mark.parametrize('slug', ['game', 'character', 'game_document', 'collection'])
    def test_falls_back_to_most_recent_ready_sibling(self, client, slug):
        """Test that the owner points at its ready sibling with the highest id."""
        current, owner = self.builder.build(slug)
        self.builder.build(slug, owner=owner)
        newest_ready, _ = self.builder.build(slug, owner=owner)
        self.builder.build(slug, owner=owner, ready=False)
        owner.photo = current
        owner.save()
        self._delete(client, slug, current)
        owner.refresh_from_db()
        assert owner.photo_id == newest_ready.pk

    def test_not_ready_sibling_is_ignored(self, client):
        """Test that a not-ready sibling is never picked; the owner ends with no photo."""
        current, game = self.builder.build('game')
        self.builder.build('game', owner=game, ready=False)
        game.photo = current
        game.save()
        self._delete(client, 'game', current)
        game.refresh_from_db()
        assert game.photo_id is None

    def test_no_sibling_clears_photo(self, client):
        """Test that the owner ends with no photo when it has no sibling."""
        current, character = self.builder.build('character')
        character.photo = current
        character.save()
        self._delete(client, 'character', current)
        character.refresh_from_db()
        assert character.photo_id is None

    def test_deleting_non_current_photo_keeps_owner_photo(self, client):
        """Test that deleting a non-current gallery photo leaves the owner unchanged."""
        current, collection = self.builder.build('collection')
        other, _ = self.builder.build('collection', owner=collection)
        collection.photo = current
        collection.save()
        self._delete(client, 'collection', other)
        collection.refresh_from_db()
        assert collection.photo_id == current.pk
