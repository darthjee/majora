"""Tests for the staff photos index view (GET /staff/photos.json)."""

import pytest

from staff import photo_types
from staff.tests.photo_test_support import StaffPhotoActorsMixin

URL = '/staff/photos.json'


@pytest.mark.django_db
class TestStaffPhotosIndexView(StaffPhotoActorsMixin):
    """Tests for the GET /staff/photos.json endpoint."""

    def setup_method(self):
        """Set up staff, superuser and regular users."""
        self.setup_actors()

    def test_unauthenticated_returns_401(self, client):
        """Test that an unauthenticated request returns 401."""
        assert self.get_json(client, URL).status_code == 401

    def test_non_staff_returns_403(self, client):
        """Test that a regular user gets 403."""
        assert self.get_json(client, URL, self.regular_token).status_code == 403

    def test_staff_gets_max_dimension_and_types(self, client, monkeypatch):
        """Test that a staff user gets the resize limit and the ordered slugs."""
        monkeypatch.delenv('MAJORA_PHOTO_MAX_DIMENSION', raising=False)
        response = self.get_json(client, URL, self.staff_token)
        assert response.status_code == 200
        assert response.json() == {'max_dimension': 1024, 'types': photo_types.slugs()}

    def test_max_dimension_reads_setting(self, client, monkeypatch):
        """Test that max_dimension follows MAJORA_PHOTO_MAX_DIMENSION."""
        monkeypatch.setenv('MAJORA_PHOTO_MAX_DIMENSION', '640')
        response = self.get_json(client, URL, self.staff_token)
        assert response.json()['max_dimension'] == 640

    def test_superuser_returns_200(self, client):
        """Test that a superuser can read the index."""
        assert self.get_json(client, URL, self.superuser_token).status_code == 200

    def test_skip_cache_header(self, client):
        """Test that the response sets X-Skip-Cache: true."""
        assert self.get_json(client, URL, self.staff_token)['X-Skip-Cache'] == 'true'
