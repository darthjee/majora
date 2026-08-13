"""Tests for the upload finalize endpoint's TreasurePhoto handling."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.models import TreasurePhoto
from games.tests.factories import SuperUserFactory, TreasureFactory, UserFactory
from uploads.models import Upload


class TestUploadFinalizeTreasurePhoto(TestCase):
    """Tests for PATCH /uploads/image/<upload_id>.json against a TreasurePhoto upload."""

    @classmethod
    def setUpTestData(cls):
        """Set up a superuser, a treasure, and a pending photo upload."""
        cls.superuser = SuperUserFactory(
            username='admin', password='secret-password'
        )
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.treasure = TreasureFactory(name='Golden Crown', value=500)

        cls.treasure_upload = Upload.objects.create(
            user=cls.superuser,
            file_path=f'photos/treasures/{cls.treasure.id}/photo.jpg',
        )
        cls.treasure_photo = TreasurePhoto.objects.create(
            treasure=cls.treasure,
            path=f'photos/treasures/{cls.treasure.id}/photo.jpg',
            ready=False,
        )
        cls.treasure_upload.content_object = cls.treasure_photo
        cls.treasure_upload.save()

    def _patch(
        self, client, upload_id, payload, token=None, upload_token=None, upload_type='image',
    ):
        """Issue a PATCH request to the upload finalize endpoint."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        if upload_token is not None:
            extra['HTTP_X_UPLOAD_TOKEN'] = upload_token
        return client.patch(
            f'/uploads/{upload_type}/{upload_id}.json',
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def _valid_treasure_patch(self, client, payload=None):
        """Issue a valid PATCH request for the treasure upload, owned by the superuser."""
        if payload is None:
            payload = {'status': 'uploading'}
        return self._patch(
            client,
            self.treasure_upload.id,
            payload,
            token=self.superuser_token,
            upload_token=self.treasure_upload.token,
        )

    def test_unauthenticated_request_returns_401_for_treasure_upload(self):
        """Test that an unauthenticated request on a TreasurePhoto upload returns 401."""
        response = self._patch(
            self.client,
            self.treasure_upload.id,
            {'status': 'uploading'},
            upload_token=self.treasure_upload.token,
        )
        assert response.status_code == 401

    def test_non_superuser_returns_403_for_treasure_upload(self):
        """Test that a non-superuser is rejected on a TreasurePhoto upload with 403."""
        other_user = UserFactory(username='other', password='secret-password')
        other_token = Token.objects.create(user=other_user)
        self.treasure_upload.user = other_user
        Upload.objects.filter(pk=self.treasure_upload.pk).update(user=other_user)
        response = self._patch(
            self.client,
            self.treasure_upload.id,
            {'status': 'uploading'},
            token=other_token,
            upload_token=self.treasure_upload.token,
        )
        assert response.status_code == 403

    def test_uploading_status_returns_200_for_treasure_upload(self):
        """Test that status=uploading returns 200 for a TreasurePhoto-backed upload."""
        response = self._valid_treasure_patch(self.client, {'status': 'uploading'})
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.treasure_upload.file_path

    def test_uploaded_status_sets_treasure_photo_ready(self):
        """Test that status=uploaded sets TreasurePhoto.ready to True."""
        self._valid_treasure_patch(self.client, {'status': 'uploaded'})
        self.treasure_photo.refresh_from_db()
        assert self.treasure_photo.ready is True

    def test_uploaded_status_sets_treasure_photo(self):
        """Test that status=uploaded sets treasure.photo when it was unset."""
        self._valid_treasure_patch(self.client, {'status': 'uploaded'})
        self.treasure.refresh_from_db()
        assert self.treasure.photo == self.treasure_photo

    def test_uploaded_status_replaces_existing_treasure_photo(self):
        """Test that status=uploaded replaces an existing treasure.photo (no unset guard)."""
        existing_photo = TreasurePhoto.objects.create(
            treasure=self.treasure,
            path=f'photos/treasures/{self.treasure.id}/old.jpg',
            ready=True,
        )
        self.treasure.photo = existing_photo
        self.treasure.save()

        self._valid_treasure_patch(self.client, {'status': 'uploaded'})

        self.treasure.refresh_from_db()
        assert self.treasure.photo == self.treasure_photo
        assert self.treasure.photo != existing_photo
