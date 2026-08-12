"""Tests for the STL model photo upload init endpoint."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.tests.factories import SuperUserFactory, UserFactory
from miniatures.models import StlModelPhoto
from miniatures.tests.factories import StlModelFactory
from uploads.models import Upload


class TestStlModelPhotoUploadView(TestCase):
    """Tests for POST /miniatures/stl_models/<id>/photo_upload.json."""

    @classmethod
    def setUpTestData(cls):
        """Set up an STL model, a superuser, a staff user, and a regular user."""
        cls.stl_model = StlModelFactory(name='Dragon Miniature')
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.staff_user = UserFactory(
            username='staffer', password='secret-password', is_staff=True,
        )
        cls.staff_token = Token.objects.create(user=cls.staff_user)
        cls.regular_user = UserFactory(username='player', password='secret-password')
        cls.regular_token = Token.objects.create(user=cls.regular_user)

    def _url(self, stl_model_id=None):
        """Return the upload endpoint URL for the given id (defaults to self.stl_model)."""
        stl_model_id = stl_model_id if stl_model_id is not None else self.stl_model.id
        return f'/miniatures/stl_models/{stl_model_id}/photo_upload.json'

    def _post(self, client, payload, token=None, stl_model_id=None):
        """Issue a POST request to the photo upload endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.post(
            self._url(stl_model_id),
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

    def test_unknown_stl_model_id_returns_404(self):
        """Test that a non-existent stl_model_id returns 404."""
        response = self._post(
            self.client, {'filename': 'photo.jpg'}, token=self.superuser_token,
            stl_model_id=99999,
        )
        assert response.status_code == 404

    def test_missing_filename_returns_400(self):
        """Test that a missing filename field returns 400 with an errors key."""
        response = self._post(self.client, {}, token=self.superuser_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'errors' in data
        assert 'filename' in data['errors']

    def test_happy_path_returns_201_with_upload_id_token_and_stl_model_id(self):
        """Test that a valid request from a superuser returns 201 with the expected body."""
        response = self._post(
            self.client, {'filename': 'model.png'}, token=self.superuser_token,
        )
        assert response.status_code == 201
        data = json.loads(response.content)
        assert isinstance(data['upload_id'], int)
        assert data['token']
        assert data['stl_model_id'] == self.stl_model.id

    def test_happy_path_creates_upload_record(self):
        """Test that a valid request creates an Upload record with pending status."""
        response = self._post(
            self.client, {'filename': 'model.png'}, token=self.superuser_token,
        )
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert upload.status == Upload.STATUS_PENDING
        assert upload.file_path == f'photos/stl_models/{self.stl_model.id}/photo.png'

    def test_happy_path_creates_stl_model_photo_record(self):
        """Test that the first upload creates an StlModelPhoto record with ready=False."""
        response = self._post(
            self.client, {'filename': 'model.png'}, token=self.superuser_token,
        )
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        photo = StlModelPhoto.objects.get(path=upload.file_path)
        assert photo.stl_model == self.stl_model
        assert photo.ready is False
        assert StlModelPhoto.objects.filter(stl_model=self.stl_model).count() == 1

    def test_returns_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._post(
            self.client, {'filename': 'model.png'}, token=self.superuser_token,
        )
        assert response['X-Skip-Cache'] == 'true'

    def _attach_existing_photo(self):
        """Create and attach an StlModelPhoto to `self.stl_model`, simulating a finalized upload."""
        photo = StlModelPhoto.objects.create(
            stl_model=self.stl_model,
            path=f'photos/stl_models/{self.stl_model.id}/photo.png',
            ready=True,
        )
        self.stl_model.photo = photo
        self.stl_model.save()
        return photo

    def test_reupload_reuses_existing_stl_model_photo_row(self):
        """Test that re-uploading reuses the same StlModelPhoto row, not a new one."""
        existing_photo = self._attach_existing_photo()

        response = self._post(
            self.client, {'filename': 'model.jpg'}, token=self.superuser_token,
        )
        assert response.status_code == 201

        assert StlModelPhoto.objects.filter(stl_model=self.stl_model).count() == 1
        photo = StlModelPhoto.objects.get(stl_model=self.stl_model)
        assert photo.id == existing_photo.id
        assert photo.path == f'photos/stl_models/{self.stl_model.id}/photo.jpg'
        assert photo.ready is False

    def test_reupload_updates_stl_model_photo_path(self):
        """Test that re-uploading updates the reused StlModelPhoto's path to the new extension."""
        self._attach_existing_photo()

        response = self._post(
            self.client, {'filename': 'model.webp'}, token=self.superuser_token,
        )
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert upload.file_path == f'photos/stl_models/{self.stl_model.id}/photo.webp'
