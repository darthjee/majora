"""Tests for the upload finalize endpoint's SourcePhoto handling."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.tests.factories import SuperUserFactory, UserFactory
from miniatures.models import SourcePhoto
from miniatures.tests.factories import SourceFactory
from uploads.models import Upload


class TestUploadFinalizeSourcePhoto(TestCase):
    """Tests for PATCH /uploads/image/<upload_id>.json against a SourcePhoto upload."""

    @classmethod
    def setUpTestData(cls):
        """Set up a source, a staff user, a superuser, and a pending photo upload."""
        cls.source = SourceFactory(name='Some Publisher')
        cls.staff_user = UserFactory(
            username='staffer', password='secret-password', is_staff=True,
        )
        cls.staff_token = Token.objects.create(user=cls.staff_user)
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.regular_user = UserFactory(username='player', password='secret-password')
        cls.regular_token = Token.objects.create(user=cls.regular_user)

        cls.upload = Upload.objects.create(
            user=cls.staff_user,
            file_path=f'photos/sources/{cls.source.id}/photo.png',
        )
        cls.photo = SourcePhoto.objects.create(
            source=cls.source,
            path=f'photos/sources/{cls.source.id}/photo.png',
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

    def test_unauthenticated_request_returns_401(self):
        """Test that a request without an auth token returns 401."""
        response = self._patch(self.client, {'status': 'uploading'}, upload_token=self.upload.token)
        assert response.status_code == 401

    def test_non_staff_returns_403(self):
        """Test that a non-staff user is rejected with 403."""
        response = self._valid_patch(
            self.client, {'status': 'uploading'}, token=self.regular_token,
        )
        assert response.status_code == 403

    def test_staff_uploading_status_returns_200(self):
        """Test that status=uploading returns 200 for a staff user."""
        response = self._valid_patch(
            self.client, {'status': 'uploading'}, token=self.staff_token,
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.upload.file_path

    def test_superuser_uploaded_status_returns_200(self):
        """Test that status=uploaded returns 200 for a superuser owning the upload."""
        self.upload.user = self.superuser
        Upload.objects.filter(pk=self.upload.pk).update(user=self.superuser)

        response = self._valid_patch(
            self.client, {'status': 'uploaded'}, token=self.superuser_token,
        )
        assert response.status_code == 200

    def test_uploaded_status_sets_source_photo_ready(self):
        """Test that status=uploaded sets SourcePhoto.ready to True."""
        self._valid_patch(self.client, {'status': 'uploaded'}, token=self.staff_token)
        self.photo.refresh_from_db()
        assert self.photo.ready is True

    def test_uploaded_status_sets_source_photo(self):
        """Test that status=uploaded sets source.photo, always replacing any existing one."""
        existing_photo = SourcePhoto.objects.create(
            source=self.source,
            path=f'photos/sources/{self.source.id}/existing.png',
            ready=True,
        )
        self.source.photo = existing_photo
        self.source.save()

        self._valid_patch(self.client, {'status': 'uploaded'}, token=self.staff_token)

        self.source.refresh_from_db()
        assert self.source.photo == self.photo
        assert self.source.photo != existing_photo
