"""Tests for the upload finalize endpoint's GameDocumentFilePhoto handling."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.models import GameDocumentFile, GameDocumentFilePhoto
from games.tests.factories import GameDocumentFactory, GameFactory, PlayerFactory, UserFactory
from uploads.models import Upload


class TestUploadFinalizeGameDocumentFilePhoto(TestCase):
    """Tests for PATCH /uploads/image/<upload_id>.json against a GameDocumentFilePhoto upload."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a document, three linked document-file photos, and an orphaned one."""
        cls.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)

        cls.player_of_game_user = UserFactory(
            username='player_of_game', password='secret-password'
        )
        cls.player_of_game = PlayerFactory(
            name='Pippin', user=cls.player_of_game_user, game=cls.game
        )
        cls.player_of_game_token = Token.objects.create(user=cls.player_of_game_user)

        cls.staff_user = UserFactory(
            username='staff_user', password='secret-password', is_staff=True
        )
        cls.staff_token = Token.objects.create(user=cls.staff_user)

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

        cls.document_file_photo_upload = Upload.objects.create(
            user=cls.dm_user,
            file_path=(
                f'photos/games/epic-quest/documents/{cls.game_document.id}'
                f'/files/{cls.document_file.id}/photo.jpg'
            ),
        )
        cls.document_file_photo = GameDocumentFilePhoto.objects.create(
            path=(
                f'photos/games/epic-quest/documents/{cls.game_document.id}'
                f'/files/{cls.document_file.id}/photo.jpg'
            ),
            ready=False,
        )
        cls.document_file.photo = cls.document_file_photo
        cls.document_file.save()
        cls.document_file_photo_upload.content_object = cls.document_file_photo
        cls.document_file_photo_upload.save()

        cls.document_file_2 = GameDocumentFile.objects.create(
            game_document=cls.game_document,
            path=f'files/games/epic-quest/documents/{cls.game_document.id}/file_2.pdf',
            ready=True,
        )
        cls.document_file_photo_upload_by_player_of_game = Upload.objects.create(
            user=cls.player_of_game_user,
            file_path=(
                f'photos/games/epic-quest/documents/{cls.game_document.id}'
                f'/files/{cls.document_file_2.id}/photo_2.jpg'
            ),
        )
        cls.document_file_photo_by_player_of_game = GameDocumentFilePhoto.objects.create(
            path=(
                f'photos/games/epic-quest/documents/{cls.game_document.id}'
                f'/files/{cls.document_file_2.id}/photo_2.jpg'
            ),
            ready=False,
        )
        cls.document_file_2.photo = cls.document_file_photo_by_player_of_game
        cls.document_file_2.save()
        cls.document_file_photo_upload_by_player_of_game.content_object = (
            cls.document_file_photo_by_player_of_game
        )
        cls.document_file_photo_upload_by_player_of_game.save()

        cls.document_file_3 = GameDocumentFile.objects.create(
            game_document=cls.game_document,
            path=f'files/games/epic-quest/documents/{cls.game_document.id}/file_3.pdf',
            ready=True,
        )
        cls.document_file_photo_upload_by_staff = Upload.objects.create(
            user=cls.staff_user,
            file_path=(
                f'photos/games/epic-quest/documents/{cls.game_document.id}'
                f'/files/{cls.document_file_3.id}/photo_3.jpg'
            ),
        )
        cls.document_file_photo_by_staff = GameDocumentFilePhoto.objects.create(
            path=(
                f'photos/games/epic-quest/documents/{cls.game_document.id}'
                f'/files/{cls.document_file_3.id}/photo_3.jpg'
            ),
            ready=False,
        )
        cls.document_file_3.photo = cls.document_file_photo_by_staff
        cls.document_file_3.save()
        cls.document_file_photo_upload_by_staff.content_object = cls.document_file_photo_by_staff
        cls.document_file_photo_upload_by_staff.save()

        cls.orphaned_document_file_photo = GameDocumentFilePhoto.objects.create(
            path=(
                f'photos/games/epic-quest/documents/{cls.game_document.id}'
                '/files/orphaned/photo.jpg'
            ),
            ready=False,
        )
        cls.orphaned_document_file_photo_upload = Upload.objects.create(
            user=cls.dm_user,
            file_path=(
                f'photos/games/epic-quest/documents/{cls.game_document.id}'
                '/files/orphaned/photo.jpg'
            ),
        )
        cls.orphaned_document_file_photo_upload.content_object = (
            cls.orphaned_document_file_photo
        )
        cls.orphaned_document_file_photo_upload.save()

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
