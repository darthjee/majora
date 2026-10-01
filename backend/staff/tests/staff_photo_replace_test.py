"""Tests for the staff photo replace init view (POST .../replace.json)."""

from datetime import timedelta

import pytest
from django.utils import timezone

from staff import photo_types
from staff.staff_photo_replacer import StaffPhotoReplacer
from staff.tests.photo_test_support import StaffPhotoActorsMixin
from uploads.models import Upload

SLUGS = photo_types.slugs()


def _url(slug, photo_id):
    """Return the replace URL of the given photo."""
    return f'/staff/photos/{slug}/{photo_id}/replace.json'


@pytest.mark.django_db
class TestStaffPhotoReplaceView(StaffPhotoActorsMixin):
    """Tests for the POST /staff/photos/<photo_type>/<photo_id>/replace.json endpoint."""

    def setup_method(self):
        """Set up staff, superuser and regular users."""
        self.setup_actors()

    def _replace(self, client, slug, photo_id, filename='new.png', token=None):
        """POST a replace request for the given photo."""
        token = self.staff_token if token is None else token
        return self.post_json(client, _url(slug, photo_id), {'filename': filename}, token)

    def test_unauthenticated_returns_401(self, client):
        """Test that an unauthenticated request returns 401, even for an unknown photo."""
        response = self.post_json(client, _url('unknown', 999), {'filename': 'a.png'})
        assert response.status_code == 401
        assert response['X-Skip-Cache'] == 'true'

    def test_non_staff_returns_403(self, client):
        """Test that a regular user gets 403, even for an unknown photo."""
        response = self._replace(client, 'unknown', 999, token=self.regular_token)
        assert response.status_code == 403

    def test_non_staff_returns_403_for_existing_photo(self, client):
        """Test that a regular user gets 403 for an existing photo."""
        photo, _ = self.builder.build('game')
        response = self._replace(client, 'game', photo.pk, token=self.regular_token)
        assert response.status_code == 403

    def test_unknown_slug_returns_404(self, client):
        """Test that an unknown photo type returns 404."""
        assert self._replace(client, 'unknown', 1).status_code == 404

    def test_unknown_id_returns_404(self, client):
        """Test that an unknown photo id returns 404."""
        assert self._replace(client, 'game', 999999).status_code == 404

    def test_id_of_another_type_returns_404(self, client):
        """Test that the id of another type's photo returns 404."""
        photo, _ = self.builder.build('treasure')
        assert self._replace(client, 'source', photo.pk).status_code == 404

    @pytest.mark.parametrize('slug', SLUGS)
    def test_creates_staff_upload(self, client, slug):
        """Test that replace init creates a staff upload linked to the existing photo."""
        photo, _ = self.builder.build(slug, path='photos/x/photo_abc.png', ready=True)
        response = self._replace(client, slug, photo.pk, filename='other.jpg')
        assert response.status_code == 201
        assert response['X-Skip-Cache'] == 'true'
        body = response.json()
        upload = Upload.objects.get(pk=body['upload_id'])
        assert body == {
            'upload_id': upload.pk, 'token': upload.token, 'upload_type': 'image',
            'id': photo.pk, 'photo_type': slug,
        }
        assert upload.origin == Upload.ORIGIN_STAFF
        assert upload.user == self.staff_user
        assert upload.content_object == photo
        assert upload.file_path == 'photos/x/photo_abc.jpg'

    @pytest.mark.parametrize('slug', SLUGS)
    def test_photo_row_untouched(self, client, slug):
        """Test that the photo path/ready and the photo count are unchanged at init."""
        photo, _ = self.builder.build(slug, path='photos/x/photo.png', ready=True)
        count = photo_types.find(slug).model.objects.count()
        self._replace(client, slug, photo.pk, filename='other.jpg')
        photo.refresh_from_db()
        assert (photo.path, photo.ready) == ('photos/x/photo.png', True)
        assert photo_types.find(slug).model.objects.count() == count

    def test_superuser_can_replace(self, client):
        """Test that a superuser can initiate a replace."""
        photo, _ = self.builder.build('game')
        response = self._replace(client, 'game', photo.pk, token=self.superuser_token)
        assert response.status_code == 201

    def test_bad_extension_returns_400(self, client):
        """Test that a disallowed extension returns 400."""
        photo, _ = self.builder.build('game')
        response = self._replace(client, 'game', photo.pk, filename='evil.exe')
        assert response.status_code == 400
        assert response.json() == {'errors': {'filename': ['file_extension_not_allowed']}}

    def test_empty_path_returns_422(self, client):
        """Test that a photo with no stored path cannot be replaced."""
        photo, _ = self.builder.build('game', path='')
        response = self._replace(client, 'game', photo.pk)
        assert response.status_code == 422
        assert response.json() == {'errors': {'path': ['photo_path_missing']}}

    def test_active_upload_returns_409(self, client):
        """Test that a photo with an active upload returns 409."""
        photo, _ = self.builder.build('game')
        Upload.objects.create(user=self.staff_user, file_path=photo.path, content_object=photo)
        response = self._replace(client, 'game', photo.pk)
        assert response.status_code == 409
        assert response.json() == {'errors': {'upload': ['replace_in_progress']}}

    def test_expired_upload_does_not_block(self, client):
        """Test that an expired leftover upload does not block a replace."""
        photo, _ = self.builder.build('game')
        Upload.objects.create(
            user=self.staff_user, file_path=photo.path, content_object=photo,
            expiration_time=timezone.now() - timedelta(minutes=1),
        )
        assert self._replace(client, 'game', photo.pk).status_code == 201

    def test_second_replace_returns_409(self, client):
        """Test that a second replace init while the first is pending returns 409."""
        photo, _ = self.builder.build('game')
        self._replace(client, 'game', photo.pk)
        assert self._replace(client, 'game', photo.pk).status_code == 409

    def test_same_extension_keeps_path(self, client):
        """Test that the same extension targets the same path."""
        photo, _ = self.builder.build('game', path='photos/games/g/photo_uuid.png')
        body = self._replace(client, 'game', photo.pk, filename='whatever.png').json()
        assert Upload.objects.get(pk=body['upload_id']).file_path == photo.path

    def test_client_stem_ignored(self, client):
        """Test that the client's filename stem and directories are ignored."""
        photo, _ = self.builder.build('game', path='photos/games/g/photo.png')
        body = self._replace(client, 'game', photo.pk, filename='../../etc/passwd.png').json()
        assert Upload.objects.get(pk=body['upload_id']).file_path == 'photos/games/g/photo.png'


class TestStaffPhotoReplacerTargetPath:
    """Tests for StaffPhotoReplacer.target_path."""

    def test_same_extension(self):
        """Test that the same extension keeps the path."""
        assert StaffPhotoReplacer.target_path('a/b/p.png', 'x.png') == 'a/b/p.png'

    def test_uppercase_extension_is_lowercased(self):
        """Test that '.JPG' replacing '.jpg' keeps the path."""
        assert StaffPhotoReplacer.target_path('a/b/p.jpg', 'x.JPG') == 'a/b/p.jpg'

    def test_changed_extension(self):
        """Test that a different extension keeps the stem with the new extension."""
        assert StaffPhotoReplacer.target_path('a/b/p_uuid.png', 'x.jpg') == 'a/b/p_uuid.jpg'

    def test_jpeg_versus_jpg_is_a_change(self):
        """Test that '.jpeg' replacing '.jpg' changes the path."""
        assert StaffPhotoReplacer.target_path('a/b/p.jpg', 'x.jpeg') == 'a/b/p.jpeg'
