"""Tests for the source photo upload init endpoint."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.tests.factories import SuperUserFactory, UserFactory
from miniatures.models import SourcePhoto
from miniatures.tests.factories import SourceFactory
from uploads.models import Upload


class TestSourcePhotoUploadView(TestCase):
    """Tests for POST /miniatures/sources/<id>/photo_upload.json."""

    @classmethod
    def setUpTestData(cls):
        """Set up a source, a superuser, a staff user, and a regular user."""
        cls.source = SourceFactory(name='MyMiniFactory')
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.staff_user = UserFactory(
            username='staffer', password='secret-password', is_staff=True,
        )
        cls.staff_token = Token.objects.create(user=cls.staff_user)
        cls.regular_user = UserFactory(username='player', password='secret-password')
        cls.regular_token = Token.objects.create(user=cls.regular_user)

    def _url(self, source_id=None):
        """Return the upload endpoint URL for the given id (defaults to self.source)."""
        source_id = source_id if source_id is not None else self.source.id
        return f'/miniatures/sources/{source_id}/photo_upload.json'

    def _post(self, client, payload, token=None, source_id=None):
        """Issue a POST request to the photo upload endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.post(
            self._url(source_id),
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_unauthenticated_request_returns_401(self):
        """Test that a request without a token is rejected with 401."""
        response = self._post(self.client, {'filename': 'photo.jpg'})
        assert response.status_code == 401

    def test_non_staff_returns_403(self):
        """Test that an authenticated non-staff user is rejected with 403."""
        response = self._post(self.client, {'filename': 'photo.jpg'}, token=self.regular_token)
        assert response.status_code == 403

    def test_staff_can_upload_photo(self):
        """Test that a staff user succeeds uploading a photo."""
        response = self._post(self.client, {'filename': 'photo.jpg'}, token=self.staff_token)
        assert response.status_code == 201

    def test_superuser_can_upload_photo(self):
        """Test that a superuser succeeds uploading a photo."""
        response = self._post(self.client, {'filename': 'photo.jpg'}, token=self.superuser_token)
        assert response.status_code == 201

    def test_unknown_source_id_returns_404(self):
        """Test that a non-existent source_id returns 404."""
        response = self._post(
            self.client, {'filename': 'photo.jpg'}, token=self.superuser_token,
            source_id=99999,
        )
        assert response.status_code == 404

    def test_missing_filename_returns_400(self):
        """Test that a missing filename field returns 400 with an errors key."""
        response = self._post(self.client, {}, token=self.superuser_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'errors' in data
        assert 'filename' in data['errors']

    def test_happy_path_returns_201_with_upload_id_token_and_source_id(self):
        """Test that a valid request from a superuser returns 201 with the expected body."""
        response = self._post(
            self.client, {'filename': 'model.png'}, token=self.superuser_token,
        )
        assert response.status_code == 201
        data = json.loads(response.content)
        assert isinstance(data['upload_id'], int)
        assert data['token']
        assert data['source_id'] == self.source.id

    def test_happy_path_creates_upload_record(self):
        """Test that a valid request creates an Upload record with pending status."""
        response = self._post(
            self.client, {'filename': 'model.png'}, token=self.superuser_token,
        )
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert upload.status == Upload.STATUS_PENDING
        assert upload.file_path == f'photos/sources/{self.source.id}/photo.png'

    def test_happy_path_creates_source_photo_record(self):
        """Test that the first upload creates a SourcePhoto record with ready=False."""
        response = self._post(
            self.client, {'filename': 'model.png'}, token=self.superuser_token,
        )
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        photo = SourcePhoto.objects.get(path=upload.file_path)
        assert photo.source == self.source
        assert photo.ready is False
        assert SourcePhoto.objects.filter(source=self.source).count() == 1

    def test_returns_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._post(
            self.client, {'filename': 'model.png'}, token=self.superuser_token,
        )
        assert response['X-Skip-Cache'] == 'true'

    def _attach_existing_photo(self):
        """Create and attach a SourcePhoto to `self.source`, simulating a finalized upload."""
        photo = SourcePhoto.objects.create(
            source=self.source,
            path=f'photos/sources/{self.source.id}/photo.png',
            ready=True,
        )
        self.source.photo = photo
        self.source.save()
        return photo

    def test_reupload_reuses_existing_source_photo_row(self):
        """Test that re-uploading reuses the same SourcePhoto row, not a new one."""
        existing_photo = self._attach_existing_photo()

        response = self._post(
            self.client, {'filename': 'model.jpg'}, token=self.superuser_token,
        )
        assert response.status_code == 201

        assert SourcePhoto.objects.filter(source=self.source).count() == 1
        photo = SourcePhoto.objects.get(source=self.source)
        assert photo.id == existing_photo.id
        assert photo.path == f'photos/sources/{self.source.id}/photo.jpg'
        assert photo.ready is False

    def test_reupload_updates_source_photo_path(self):
        """Test that re-uploading updates the reused SourcePhoto's path to the new extension."""
        self._attach_existing_photo()

        response = self._post(
            self.client, {'filename': 'model.webp'}, token=self.superuser_token,
        )
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert upload.file_path == f'photos/sources/{self.source.id}/photo.webp'
