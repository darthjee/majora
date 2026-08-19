"""Tests for the upload finalize endpoint's GameDocumentPhoto handling."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.models import GameDocumentPhoto
from games.tests.factories import GameDocumentFactory, GameFactory, UserFactory
from uploads.models import Upload
from uploads.tests.fixtures import UploadFinalizeFixtureMixin


class TestUploadFinalizeGameDocumentPhoto(UploadFinalizeFixtureMixin, TestCase):
    """Tests for PATCH /uploads/image/<upload_id>.json against a GameDocumentPhoto upload."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a game document, and pending photo uploads by DM, player, staff."""
        cls.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        cls.dm_user, cls.dm_token = cls._create_dm(cls.game)
        cls.player_of_game_user, cls.player_of_game_token = cls._create_player_of_game(cls.game)
        cls.staff_user, cls.staff_token = cls._create_staff_user()

        cls.game_document = GameDocumentFactory(game=cls.game, name='Ancient Scroll')

        cls.document_upload, cls.document_photo = cls._create_document_photo(
            cls.dm_user, 'photo.jpg'
        )
        (
            cls.document_upload_by_player_of_game,
            cls.document_photo_by_player_of_game,
        ) = cls._create_document_photo(cls.player_of_game_user, 'photo_2.jpg')
        cls.document_upload_by_staff, cls.document_photo_by_staff = cls._create_document_photo(
            cls.staff_user, 'photo_3.jpg'
        )

    @classmethod
    def _create_document_photo(cls, user, filename):
        """Create a pending Upload/GameDocumentPhoto pair for `cls.game_document`, by `user`."""
        file_path = f'photos/games/epic-quest/documents/{cls.game_document.id}/{filename}'
        return cls._create_upload_and_photo(
            GameDocumentPhoto, user, file_path, game_document=cls.game_document, ready=False,
        )

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

    def _valid_document_patch(self, client, payload=None):
        """Issue a valid PATCH request for the document upload, owned by the DM."""
        if payload is None:
            payload = {'status': 'uploading'}
        return self._patch(
            client,
            self.document_upload.id,
            payload,
            token=self.dm_token,
            upload_token=self.document_upload.token,
        )

    def test_unauthenticated_request_returns_401_for_document_upload(self):
        """Test that an unauthenticated request on a GameDocumentPhoto upload returns 401."""
        response = self._patch(
            self.client,
            self.document_upload.id,
            {'status': 'uploading'},
            upload_token=self.document_upload.token,
        )
        assert response.status_code == 401

    def test_unrelated_user_returns_403_for_document_upload(self):
        """Test that a user unrelated to the game is rejected on a GameDocumentPhoto upload."""
        other_user = UserFactory(username='other_document', password='secret-password')
        other_token = Token.objects.create(user=other_user)
        self.document_upload.user = other_user
        Upload.objects.filter(pk=self.document_upload.pk).update(user=other_user)
        response = self._patch(
            self.client,
            self.document_upload.id,
            {'status': 'uploading'},
            token=other_token,
            upload_token=self.document_upload.token,
        )
        assert response.status_code == 403

    def test_uploading_status_returns_200_for_document_upload(self):
        """Test that status=uploading returns 200 for a GameDocumentPhoto-backed upload."""
        response = self._valid_document_patch(self.client, {'status': 'uploading'})
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.document_upload.file_path

    def test_uploaded_status_sets_document_photo_ready(self):
        """Test that status=uploaded sets GameDocumentPhoto.ready to True."""
        self._valid_document_patch(self.client, {'status': 'uploaded'})
        self.document_photo.refresh_from_db()
        assert self.document_photo.ready is True

    def test_uploaded_status_sets_game_document_photo(self):
        """Test that status=uploaded sets GameDocument.photo when it was unset."""
        self._valid_document_patch(self.client, {'status': 'uploaded'})
        self.game_document.refresh_from_db()
        assert self.game_document.photo == self.document_photo

    def test_uploaded_status_does_not_overwrite_existing_document_photo(self):
        """Test that status=uploaded does not overwrite an existing GameDocument.photo."""
        existing_photo = GameDocumentPhoto.objects.create(
            game_document=self.game_document,
            path=f'photos/games/epic-quest/documents/{self.game_document.id}/existing.jpg',
            ready=True,
        )
        self.game_document.photo = existing_photo
        self.game_document.save()

        self._valid_document_patch(self.client, {'status': 'uploaded'})

        self.game_document.refresh_from_db()
        assert self.game_document.photo == existing_photo

    def test_uploading_status_returns_200_for_document_upload_by_player_of_game(self):
        """Test that a player of the game finalizing a document 'uploading' step gets 200."""
        response = self._patch(
            self.client,
            self.document_upload_by_player_of_game.id,
            {'status': 'uploading'},
            token=self.player_of_game_token,
            upload_token=self.document_upload_by_player_of_game.token,
        )
        assert response.status_code == 200

    def test_uploaded_status_sets_document_photo_ready_for_player_of_game(self):
        """Test that status=uploaded sets GameDocumentPhoto.ready for a player of the game."""
        response = self._patch(
            self.client,
            self.document_upload_by_player_of_game.id,
            {'status': 'uploaded'},
            token=self.player_of_game_token,
            upload_token=self.document_upload_by_player_of_game.token,
        )
        assert response.status_code == 200
        self.document_photo_by_player_of_game.refresh_from_db()
        assert self.document_photo_by_player_of_game.ready is True

    def test_uploading_status_returns_200_for_document_upload_by_staff(self):
        """Test that a staff user (not owner) finalizing a document 'uploading' step gets 200."""
        response = self._patch(
            self.client,
            self.document_upload_by_staff.id,
            {'status': 'uploading'},
            token=self.staff_token,
            upload_token=self.document_upload_by_staff.token,
        )
        assert response.status_code == 200

    def test_uploaded_status_sets_document_photo_ready_for_staff(self):
        """Test that status=uploaded sets GameDocumentPhoto.ready for a staff user (not owner)."""
        response = self._patch(
            self.client,
            self.document_upload_by_staff.id,
            {'status': 'uploaded'},
            token=self.staff_token,
            upload_token=self.document_upload_by_staff.token,
        )
        assert response.status_code == 200
        self.document_photo_by_staff.refresh_from_db()
        assert self.document_photo_by_staff.ready is True
