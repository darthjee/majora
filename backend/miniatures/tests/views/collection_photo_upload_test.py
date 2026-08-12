"""Tests for the collection photo upload init endpoint."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.tests.factories import SuperUserFactory, UserFactory
from miniatures.models import CollectionPhoto
from miniatures.tests.factories import CollectionFactory
from uploads.models import Upload


class TestCollectionPhotoUploadView(TestCase):
    """Tests for POST /miniatures/collections/<id>/photo_upload.json."""

    @classmethod
    def setUpTestData(cls):
        """Set up a collection, a superuser, a staff user, and a regular user."""
        cls.collection = CollectionFactory(name='Monster Pack')
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.staff_user = UserFactory(
            username='staffer', password='secret-password', is_staff=True,
        )
        cls.staff_token = Token.objects.create(user=cls.staff_user)
        cls.regular_user = UserFactory(username='player', password='secret-password')
        cls.regular_token = Token.objects.create(user=cls.regular_user)

    def _url(self, collection_id=None):
        """Return the upload endpoint URL for the given id (defaults to self.collection)."""
        collection_id = collection_id if collection_id is not None else self.collection.id
        return f'/miniatures/collections/{collection_id}/photo_upload.json'

    def _post(self, client, payload, token=None, collection_id=None):
        """Issue a POST request to the photo upload endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.post(
            self._url(collection_id),
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

    def test_unknown_collection_id_returns_404(self):
        """Test that a non-existent collection_id returns 404."""
        response = self._post(
            self.client, {'filename': 'photo.jpg'}, token=self.superuser_token,
            collection_id=99999,
        )
        assert response.status_code == 404

    def test_missing_filename_returns_400(self):
        """Test that a missing filename field returns 400 with an errors key."""
        response = self._post(self.client, {}, token=self.superuser_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'errors' in data
        assert 'filename' in data['errors']

    def test_happy_path_returns_201_with_upload_id_token_and_collection_id(self):
        """Test that a valid request from a superuser returns 201 with the expected body."""
        response = self._post(
            self.client, {'filename': 'model.png'}, token=self.superuser_token,
        )
        assert response.status_code == 201
        data = json.loads(response.content)
        assert isinstance(data['upload_id'], int)
        assert data['token']
        assert data['collection_id'] == self.collection.id

    def test_happy_path_creates_upload_record(self):
        """Test that a valid request creates an Upload record with pending status."""
        response = self._post(
            self.client, {'filename': 'model.png'}, token=self.superuser_token,
        )
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert upload.status == Upload.STATUS_PENDING
        assert upload.file_path.startswith(f'photos/collections/{self.collection.id}/model_')
        assert upload.file_path.endswith('.png')

    def test_happy_path_creates_collection_photo_record(self):
        """Test that the first upload creates a CollectionPhoto record with ready=False."""
        response = self._post(
            self.client, {'filename': 'model.png'}, token=self.superuser_token,
        )
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        photo = CollectionPhoto.objects.get(path=upload.file_path)
        assert photo.collection == self.collection
        assert photo.ready is False
        assert CollectionPhoto.objects.filter(collection=self.collection).count() == 1

    def test_first_upload_sets_collection_photo(self):
        """Test that the first upload for a collection sets Collection.photo to that row."""
        response = self._post(
            self.client, {'filename': 'model.png'}, token=self.superuser_token,
        )
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        photo = CollectionPhoto.objects.get(path=upload.file_path)

        self.collection.refresh_from_db()
        assert self.collection.photo_id == photo.id

    def test_returns_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._post(
            self.client, {'filename': 'model.png'}, token=self.superuser_token,
        )
        assert response['X-Skip-Cache'] == 'true'

    def _attach_existing_photo(self):
        """Create/attach a CollectionPhoto to `self.collection`, simulating a finalized upload."""
        photo = CollectionPhoto.objects.create(
            collection=self.collection,
            path=f'photos/collections/{self.collection.id}/first.png',
            ready=True,
        )
        self.collection.photo = photo
        self.collection.save()
        return photo

    def test_second_upload_appends_a_new_gallery_row(self):
        """Test that a second upload creates a new CollectionPhoto row, not reusing the first."""
        existing_photo = self._attach_existing_photo()

        response = self._post(
            self.client, {'filename': 'second.jpg'}, token=self.superuser_token,
        )
        assert response.status_code == 201

        assert CollectionPhoto.objects.filter(collection=self.collection).count() == 2
        assert CollectionPhoto.objects.filter(id=existing_photo.id).exists()

    def test_second_upload_does_not_change_collection_photo(self):
        """Test that a second upload does not touch Collection.photo, which stays the first."""
        existing_photo = self._attach_existing_photo()

        response = self._post(
            self.client, {'filename': 'second.jpg'}, token=self.superuser_token,
        )
        assert response.status_code == 201

        self.collection.refresh_from_db()
        assert self.collection.photo_id == existing_photo.id

    def test_second_upload_uses_a_distinct_file_path(self):
        """Test that a second upload's file path differs from the first (no overwrite)."""
        self._attach_existing_photo()

        response = self._post(
            self.client, {'filename': 'second.jpg'}, token=self.superuser_token,
        )
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert upload.file_path != f'photos/collections/{self.collection.id}/first.png'
        assert upload.file_path.startswith(f'photos/collections/{self.collection.id}/second_')
        assert upload.file_path.endswith('.jpg')
