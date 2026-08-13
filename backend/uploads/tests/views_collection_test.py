"""Tests for the upload finalize endpoint's CollectionPhoto handling."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.tests.factories import SuperUserFactory, UserFactory
from miniatures.models import CollectionPhoto
from miniatures.tests.factories import CollectionFactory
from uploads.models import Upload


class TestUploadFinalizeCollectionPhoto(TestCase):
    """Tests for PATCH /uploads/image/<upload_id>.json against a CollectionPhoto upload."""

    @classmethod
    def setUpTestData(cls):
        """Set up a collection, a staff user, a superuser, a regular user, and a pending upload."""
        cls.collection = CollectionFactory(name='Some Collection')
        cls.staff_user = UserFactory(
            username='staffer_collection', password='secret-password', is_staff=True,
        )
        cls.staff_token = Token.objects.create(user=cls.staff_user)
        cls.superuser = SuperUserFactory(username='admin_collection', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.regular_user = UserFactory(username='player_collection', password='secret-password')
        cls.regular_token = Token.objects.create(user=cls.regular_user)

        cls.upload = Upload.objects.create(
            user=cls.staff_user,
            file_path=f'photos/collections/{cls.collection.id}/photo.png',
        )
        cls.photo = CollectionPhoto.objects.create(
            collection=cls.collection,
            path=f'photos/collections/{cls.collection.id}/photo.png',
            ready=False,
        )
        cls.upload.content_object = cls.photo
        cls.upload.save()

    def _patch(self, client, payload, token=None, upload_token=None):
        """Issue a PATCH request to the upload finalize endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        if upload_token is not None:
            extra['HTTP_X_UPLOAD_TOKEN'] = upload_token
        return client.patch(
            f'/uploads/image/{self.upload.id}.json',
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def _valid_patch(self, client, payload, token):
        """Issue a valid PATCH request with the correct upload token."""
        return self._patch(client, payload, token=token, upload_token=self.upload.token)

    def test_unauthenticated_request_returns_401_for_collection_upload(self):
        """Test that a request without an auth token returns 401."""
        response = self._patch(self.client, {'status': 'uploading'}, upload_token=self.upload.token)
        assert response.status_code == 401

    def test_non_staff_user_returns_403_for_collection_upload(self):
        """Test that a non-staff user is rejected with 403."""
        response = self._valid_patch(
            self.client, {'status': 'uploading'}, token=self.regular_token,
        )
        assert response.status_code == 403

    def test_uploading_status_returns_200_for_collection_upload(self):
        """Test that status=uploading returns 200 for a staff user."""
        response = self._valid_patch(
            self.client, {'status': 'uploading'}, token=self.staff_token,
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.upload.file_path

    def test_uploaded_status_sets_collection_photo_ready(self):
        """Test that status=uploaded sets CollectionPhoto.ready to True."""
        self._valid_patch(self.client, {'status': 'uploaded'}, token=self.staff_token)
        self.photo.refresh_from_db()
        assert self.photo.ready is True

    def test_uploaded_status_does_not_change_collection_photo_on_second_gallery_upload(self):
        """Test that finalize does not re-promote a later gallery upload over the first one."""
        first_photo = CollectionPhoto.objects.create(
            collection=self.collection,
            path=f'photos/collections/{self.collection.id}/first.png',
            ready=True,
        )
        self.collection.photo = first_photo
        self.collection.save()

        self._valid_patch(self.client, {'status': 'uploaded'}, token=self.staff_token)

        self.collection.refresh_from_db()
        assert self.collection.photo == first_photo
        assert self.collection.photo != self.photo

    def test_staff_user_returns_200_for_collection_upload(self):
        """Test that status=uploaded returns 200 for a staff user owning the upload."""
        response = self._valid_patch(
            self.client, {'status': 'uploaded'}, token=self.staff_token,
        )
        assert response.status_code == 200

    def test_superuser_returns_200_for_collection_upload(self):
        """Test that status=uploaded returns 200 for a superuser owning the upload."""
        Upload.objects.filter(pk=self.upload.pk).update(user=self.superuser)

        response = self._valid_patch(
            self.client, {'status': 'uploaded'}, token=self.superuser_token,
        )
        assert response.status_code == 200
