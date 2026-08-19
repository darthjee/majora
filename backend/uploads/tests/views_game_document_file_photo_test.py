"""Tests for the upload finalize endpoint's GameDocumentFilePhoto handling."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.models import GameDocumentFile, GameDocumentFilePhoto
from games.tests.factories import GameDocumentFactory, GameFactory, UserFactory
from uploads.models import Upload
from uploads.tests.fixtures import UploadFinalizeFixtureMixin


class TestUploadFinalizeGameDocumentFilePhoto(UploadFinalizeFixtureMixin, TestCase):
    """Tests for PATCH /uploads/image/<upload_id>.json against a GameDocumentFilePhoto upload."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a document, three linked document-file photos, and an orphaned one."""
        cls.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        cls.dm_user, cls.dm_token = cls._create_dm(cls.game)
        cls.player_of_game_user, cls.player_of_game_token = cls._create_player_of_game(cls.game)
        cls.staff_user, cls.staff_token = cls._create_staff_user()

        cls.game_document = GameDocumentFactory(game=cls.game, name='Ancient Scroll')

        (
            cls.document_file_upload,
            cls.document_file,
            cls.document_file_photo_upload,
            cls.document_file_photo,
        ) = cls._create_game_document_file(cls.dm_user, 'file.pdf', 'photo.jpg')

        cls.document_file_2 = cls._create_document_file('file_2.pdf')
        (
            cls.document_file_photo_upload_by_player_of_game,
            cls.document_file_photo_by_player_of_game,
        ) = cls._create_document_file_photo(
            cls.document_file_2, cls.player_of_game_user, 'photo_2.jpg'
        )

        cls.document_file_3 = cls._create_document_file('file_3.pdf')
        (
            cls.document_file_photo_upload_by_staff,
            cls.document_file_photo_by_staff,
        ) = cls._create_document_file_photo(cls.document_file_3, cls.staff_user, 'photo_3.jpg')

        cls.orphaned_document_file_photo_upload, cls.orphaned_document_file_photo = (
            cls._create_upload_and_photo(
                GameDocumentFilePhoto,
                cls.dm_user,
                (
                    f'photos/games/epic-quest/documents/{cls.game_document.id}'
                    '/files/orphaned/photo.jpg'
                ),
                ready=False,
            )
        )

    @classmethod
    def _create_game_document_file(cls, user, file_filename, photo_filename):
        """Create a GameDocumentFile backed by a raw-file Upload, plus its photo Upload."""
        file_upload, document_file = cls._create_upload_and_photo(
            GameDocumentFile,
            user,
            f'files/games/epic-quest/documents/{cls.game_document.id}/{file_filename}',
            game_document=cls.game_document,
            ready=False,
        )
        file_upload.upload_type = Upload.UPLOAD_TYPE_FILE
        file_upload.save()
        photo_upload, photo = cls._create_document_file_photo(document_file, user, photo_filename)
        return file_upload, document_file, photo_upload, photo

    @classmethod
    def _create_document_file(cls, filename):
        """Create a ready GameDocumentFile directly, without a backing raw-file Upload."""
        return GameDocumentFile.objects.create(
            game_document=cls.game_document,
            path=f'files/games/epic-quest/documents/{cls.game_document.id}/{filename}',
            ready=True,
        )

    @classmethod
    def _create_document_file_photo(cls, document_file, user, filename):
        """Create a GameDocumentFilePhoto Upload and link it as `document_file`'s photo."""
        file_path = (
            f'photos/games/epic-quest/documents/{cls.game_document.id}'
            f'/files/{document_file.id}/{filename}'
        )
        upload, photo = cls._create_upload_and_photo(
            GameDocumentFilePhoto, user, file_path, ready=False,
        )
        document_file.photo = photo
        document_file.save()
        return upload, photo

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

    def _valid_document_file_photo_patch(self, client, payload=None):
        """Issue a valid PATCH request for the document file photo upload, owned by the DM."""
        if payload is None:
            payload = {'status': 'uploading'}
        return self._patch(
            client,
            self.document_file_photo_upload.id,
            payload,
            token=self.dm_token,
            upload_token=self.document_file_photo_upload.token,
        )

    def test_unauthenticated_request_returns_401_for_document_file_photo_upload(self):
        """Test that an unauthenticated request on a GameDocumentFilePhoto upload returns 401."""
        response = self._patch(
            self.client,
            self.document_file_photo_upload.id,
            {'status': 'uploading'},
            upload_token=self.document_file_photo_upload.token,
        )
        assert response.status_code == 401

    def test_unrelated_user_returns_403_for_document_file_photo_upload(self):
        """Test that a user unrelated to the game is rejected on a GameDocumentFilePhoto."""
        other_user = UserFactory(username='other_document_file_photo', password='secret-password')
        other_token = Token.objects.create(user=other_user)
        self.document_file_photo_upload.user = other_user
        Upload.objects.filter(pk=self.document_file_photo_upload.pk).update(user=other_user)
        response = self._patch(
            self.client,
            self.document_file_photo_upload.id,
            {'status': 'uploading'},
            token=other_token,
            upload_token=self.document_file_photo_upload.token,
        )
        assert response.status_code == 403

    def test_uploading_status_returns_200_for_document_file_photo_upload(self):
        """Test that status=uploading returns 200 for a GameDocumentFilePhoto-backed upload."""
        response = self._valid_document_file_photo_patch(self.client, {'status': 'uploading'})
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.document_file_photo_upload.file_path

    def test_uploaded_status_sets_document_file_photo_ready(self):
        """Test that status=uploaded sets GameDocumentFilePhoto.ready to True."""
        self._valid_document_file_photo_patch(self.client, {'status': 'uploaded'})
        self.document_file_photo.refresh_from_db()
        assert self.document_file_photo.ready is True

    def test_uploaded_status_does_not_change_document_file_photo_assignment(self):
        """Test that status=uploaded leaves GameDocumentFile.photo unchanged (no-op mark_ready)."""
        self._valid_document_file_photo_patch(self.client, {'status': 'uploaded'})
        self.document_file.refresh_from_db()
        assert self.document_file.photo_id == self.document_file_photo.id

    def test_uploading_status_returns_200_for_document_file_photo_upload_by_player_of_game(self):
        """Test that a player of the game finalizing a document file photo upload gets 200."""
        response = self._patch(
            self.client,
            self.document_file_photo_upload_by_player_of_game.id,
            {'status': 'uploading'},
            token=self.player_of_game_token,
            upload_token=self.document_file_photo_upload_by_player_of_game.token,
        )
        assert response.status_code == 200

    def test_uploaded_status_sets_document_file_photo_ready_for_player_of_game(self):
        """Test that status=uploaded sets GameDocumentFilePhoto.ready for a player of the game."""
        response = self._patch(
            self.client,
            self.document_file_photo_upload_by_player_of_game.id,
            {'status': 'uploaded'},
            token=self.player_of_game_token,
            upload_token=self.document_file_photo_upload_by_player_of_game.token,
        )
        assert response.status_code == 200
        self.document_file_photo_by_player_of_game.refresh_from_db()
        assert self.document_file_photo_by_player_of_game.ready is True

    def test_uploading_status_returns_200_for_document_file_photo_upload_by_staff(self):
        """Test that a staff user (not owner) finalizing a document file photo upload gets 200."""
        response = self._patch(
            self.client,
            self.document_file_photo_upload_by_staff.id,
            {'status': 'uploading'},
            token=self.staff_token,
            upload_token=self.document_file_photo_upload_by_staff.token,
        )
        assert response.status_code == 200

    def test_uploaded_status_sets_document_file_photo_ready_for_staff(self):
        """Test that status=uploaded sets GameDocumentFilePhoto.ready for a staff user."""
        response = self._patch(
            self.client,
            self.document_file_photo_upload_by_staff.id,
            {'status': 'uploaded'},
            token=self.staff_token,
            upload_token=self.document_file_photo_upload_by_staff.token,
        )
        assert response.status_code == 200
        self.document_file_photo_by_staff.refresh_from_db()
        assert self.document_file_photo_by_staff.ready is True

    def test_orphaned_document_file_photo_upload_returns_403(self):
        """Test that finalizing an orphaned GameDocumentFilePhoto upload returns 403, not 500."""
        response = self._patch(
            self.client,
            self.orphaned_document_file_photo_upload.id,
            {'status': 'uploading'},
            token=self.dm_token,
            upload_token=self.orphaned_document_file_photo_upload.token,
        )
        assert response.status_code == 403
