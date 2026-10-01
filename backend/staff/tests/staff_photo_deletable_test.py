"""Tests for the staff photo deletable view (GET .../deletable.json)."""

from datetime import timedelta

import pytest
from django.utils import timezone

from staff import photo_types
from staff.tests.photo_test_support import StaffPhotoActorsMixin
from uploads.models import Upload

SLUGS = photo_types.slugs()


def _url(slug, photo_id):
    """Return the deletable URL of the given photo."""
    return f'/staff/photos/{slug}/{photo_id}/deletable.json'


@pytest.mark.django_db
class TestStaffPhotoDeletableView(StaffPhotoActorsMixin):
    """Tests for the GET /staff/photos/<photo_type>/<photo_id>/deletable.json endpoint."""

    def setup_method(self):
        """Set up staff, superuser and regular users."""
        self.setup_actors()

    def test_unauthenticated_returns_401(self, client):
        """Test that an unauthenticated request returns 401, even for an unknown photo."""
        response = self.get_json(client, _url('unknown', 999))
        assert response.status_code == 401
        assert response['X-Skip-Cache'] == 'true'

    def test_non_staff_returns_403(self, client):
        """Test that a regular user gets 403, even for an unknown photo."""
        response = self.get_json(client, _url('unknown', 999), self.regular_token)
        assert response.status_code == 403

    def test_unknown_slug_returns_404(self, client):
        """Test that an unknown photo type returns 404."""
        assert self.get_json(client, _url('unknown', 1), self.staff_token).status_code == 404

    def test_unknown_id_returns_404(self, client):
        """Test that an unknown photo id returns 404."""
        assert self.get_json(client, _url('game', 999999), self.staff_token).status_code == 404

    def test_id_of_another_type_returns_404(self, client):
        """Test that the id of another type's photo returns 404."""
        photo, _ = self.builder.build('character')
        response = self.get_json(client, _url('collection', photo.pk), self.staff_token)
        assert response.status_code == 404

    @pytest.mark.parametrize('slug', SLUGS)
    @pytest.mark.parametrize('ready', [True, False])
    def test_returns_deletable_and_path(self, client, slug, ready):
        """Test that a ready or not-ready photo is deletable, with its path."""
        photo, _ = self.builder.build(slug, path='photos/x/p.png', ready=ready)
        response = self.get_json(client, _url(slug, photo.pk), self.staff_token)
        assert response.status_code == 200
        assert response['X-Skip-Cache'] == 'true'
        assert response.json() == {'deletable': True, 'path': 'photos/x/p.png'}

    def test_superuser_returns_200(self, client):
        """Test that a superuser can check deletability."""
        photo, _ = self.builder.build('game')
        response = self.get_json(client, _url('game', photo.pk), self.superuser_token)
        assert response.status_code == 200

    def test_active_upload_returns_422_without_body(self, client):
        """Test that a photo with an active upload answers 422 with no body."""
        photo, _ = self.builder.build('game')
        Upload.objects.create(user=self.staff_user, file_path=photo.path, content_object=photo)
        response = self.get_json(client, _url('game', photo.pk), self.staff_token)
        assert response.status_code == 422
        assert response.content == b''
        assert response['X-Skip-Cache'] == 'true'

    def test_expired_upload_returns_200(self, client):
        """Test that an expired leftover upload does not block deletion."""
        photo, _ = self.builder.build('game')
        Upload.objects.create(
            user=self.staff_user, file_path=photo.path, content_object=photo,
            expiration_time=timezone.now() - timedelta(minutes=1),
        )
        response = self.get_json(client, _url('game', photo.pk), self.staff_token)
        assert response.status_code == 200
