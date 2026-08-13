"""Tests for the upload finalize endpoint's GameDocumentFile handling."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.models import GameDocumentFile
from games.tests.factories import GameDocumentFactory, GameFactory, PlayerFactory, UserFactory
from uploads.models import Upload


class TestUploadFinalizeGameDocumentFile(TestCase):
    """Tests for PATCH /uploads/file/<upload_id>.json against a GameDocumentFile upload."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a game document, and a pending document-file upload owned by the DM."""
        cls.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)

        cls.game_document = GameDocumentFactory(game=cls.game, name='Ancient Scroll')

        cls.document_file_upload = Upload.objects.create(
            user=cls.dm_user,
            file_path=f'files/games/epic-quest/documents/{cls.game_document.id}/file.pdf',
            upload_type=Upload.UPLOAD_TYPE_FILE,
        )
        cls.document_file = GameDocumentFile.objects.create(
            game_document=cls.game_document,
            path=f'files/games/epic-quest/documents/{cls.game_document.id}/file.pdf',
            ready=False,
        )
        cls.document_file_upload.content_object = cls.document_file
        cls.document_file_upload.save()

    def _patch(
        self, client, upload_id, payload, token=None, upload_token=None, upload_type='file',
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

    def _valid_document_file_patch(self, client, payload=None):
        """Issue a valid PATCH request for the document file upload, owned by the DM."""
        if payload is None:
            payload = {'status': 'uploading'}
        return self._patch(
            client,
            self.document_file_upload.id,
            payload,
            token=self.dm_token,
            upload_token=self.document_file_upload.token,
            upload_type='file',
        )

    def test_unauthenticated_request_returns_401_for_document_file_upload(self):
        """Test that an unauthenticated request on a GameDocumentFile upload returns 401."""
        response = self._patch(
            self.client,
            self.document_file_upload.id,
            {'status': 'uploading'},
            upload_token=self.document_file_upload.token,
            upload_type='file',
        )
        assert response.status_code == 401

    def test_unrelated_user_returns_403_for_document_file_upload(self):
        """Test that a user unrelated to the game is rejected on a GameDocumentFile upload."""
        other_user = UserFactory(username='other_document_file', password='secret-password')
        other_token = Token.objects.create(user=other_user)
        self.document_file_upload.user = other_user
        Upload.objects.filter(pk=self.document_file_upload.pk).update(user=other_user)
        response = self._patch(
            self.client,
            self.document_file_upload.id,
            {'status': 'uploading'},
            token=other_token,
            upload_token=self.document_file_upload.token,
            upload_type='file',
        )
        assert response.status_code == 403

    def test_uploading_status_returns_200_for_document_file_upload(self):
        """Test that status=uploading returns 200 for a GameDocumentFile-backed upload."""
        response = self._valid_document_file_patch(self.client, {'status': 'uploading'})
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.document_file_upload.file_path

    def test_uploaded_status_sets_document_file_ready(self):
        """Test that status=uploaded sets GameDocumentFile.ready to True."""
        self._valid_document_file_patch(self.client, {'status': 'uploaded'})
        self.document_file.refresh_from_db()
        assert self.document_file.ready is True

    def test_wrong_upload_type_for_document_file_upload_returns_404(self):
        """Test that finalizing a GameDocumentFile upload with `upload_type=image` returns 404."""
        response = self._patch(
            self.client,
            self.document_file_upload.id,
            {'status': 'uploading'},
            token=self.dm_token,
            upload_token=self.document_file_upload.token,
            upload_type='image',
        )
        assert response.status_code == 404
