"""Tests for the upload finalize endpoint's GamePossessionPhoto handling."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.models import GamePossessionPhoto
from games.tests.factories import (
    GameFactory,
    GamePossessionFactory,
    PlayerFactory,
    UserFactory,
)
from uploads.models import Upload


class TestUploadFinalizeGamePossessionPhoto(TestCase):
    """Tests for PATCH /uploads/image/<upload_id>.json against a GamePossessionPhoto upload."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a game possession, and pending photo uploads by DM, player, staff."""
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

        cls.game_possession = GamePossessionFactory(game=cls.game, name='Tavern')

        cls.possession_upload = Upload.objects.create(
            user=cls.dm_user,
            file_path=f'photos/games/epic-quest/possessions/{cls.game_possession.id}/photo.jpg',
        )
        cls.possession_photo = GamePossessionPhoto.objects.create(
            game_possession=cls.game_possession,
            path=f'photos/games/epic-quest/possessions/{cls.game_possession.id}/photo.jpg',
            ready=False,
        )
        cls.possession_upload.content_object = cls.possession_photo
        cls.possession_upload.save()

        cls.possession_upload_by_player_of_game = Upload.objects.create(
            user=cls.player_of_game_user,
            file_path=(
                f'photos/games/epic-quest/possessions/{cls.game_possession.id}/photo_2.jpg'
            ),
        )
        cls.possession_photo_by_player_of_game = GamePossessionPhoto.objects.create(
            game_possession=cls.game_possession,
            path=(
                f'photos/games/epic-quest/possessions/{cls.game_possession.id}/photo_2.jpg'
            ),
            ready=False,
        )
        cls.possession_upload_by_player_of_game.content_object = (
            cls.possession_photo_by_player_of_game
        )
        cls.possession_upload_by_player_of_game.save()

        cls.possession_upload_by_staff = Upload.objects.create(
            user=cls.staff_user,
            file_path=(
                f'photos/games/epic-quest/possessions/{cls.game_possession.id}/photo_3.jpg'
            ),
        )
        cls.possession_photo_by_staff = GamePossessionPhoto.objects.create(
            game_possession=cls.game_possession,
            path=(
                f'photos/games/epic-quest/possessions/{cls.game_possession.id}/photo_3.jpg'
            ),
            ready=False,
        )
        cls.possession_upload_by_staff.content_object = cls.possession_photo_by_staff
        cls.possession_upload_by_staff.save()

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

    def _valid_possession_patch(self, client, payload=None):
        """Issue a valid PATCH request for the possession upload, owned by the DM."""
        if payload is None:
            payload = {'status': 'uploading'}
        return self._patch(
            client,
            self.possession_upload.id,
            payload,
            token=self.dm_token,
            upload_token=self.possession_upload.token,
        )

    def test_unauthenticated_request_returns_401_for_possession_upload(self):
        """Test that an unauthenticated request on a GamePossessionPhoto upload returns 401."""
        response = self._patch(
            self.client,
            self.possession_upload.id,
            {'status': 'uploading'},
            upload_token=self.possession_upload.token,
        )
        assert response.status_code == 401

    def test_unrelated_user_returns_403_for_possession_upload(self):
        """Test that a user unrelated to the game is rejected on a GamePossessionPhoto upload."""
        other_user = UserFactory(username='other_possession', password='secret-password')
        other_token = Token.objects.create(user=other_user)
        self.possession_upload.user = other_user
        Upload.objects.filter(pk=self.possession_upload.pk).update(user=other_user)
        response = self._patch(
            self.client,
            self.possession_upload.id,
            {'status': 'uploading'},
            token=other_token,
            upload_token=self.possession_upload.token,
        )
        assert response.status_code == 403

    def test_uploading_status_returns_200_for_possession_upload(self):
        """Test that status=uploading returns 200 for a GamePossessionPhoto-backed upload."""
        response = self._valid_possession_patch(self.client, {'status': 'uploading'})
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.possession_upload.file_path

    def test_uploaded_status_sets_possession_photo_ready(self):
        """Test that status=uploaded sets GamePossessionPhoto.ready to True."""
        self._valid_possession_patch(self.client, {'status': 'uploaded'})
        self.possession_photo.refresh_from_db()
        assert self.possession_photo.ready is True

    def test_uploaded_status_sets_game_possession_photo(self):
        """Test that status=uploaded sets GamePossession.photo when it was unset."""
        self._valid_possession_patch(self.client, {'status': 'uploaded'})
        self.game_possession.refresh_from_db()
        assert self.game_possession.photo == self.possession_photo

    def test_uploaded_status_replaces_existing_game_possession_photo(self):
        """Test that status=uploaded replaces an existing GamePossession.photo (no unset guard)."""
        existing_photo = GamePossessionPhoto.objects.create(
            game_possession=self.game_possession,
            path=f'photos/games/epic-quest/possessions/{self.game_possession.id}/old.jpg',
            ready=True,
        )
        self.game_possession.photo = existing_photo
        self.game_possession.save()

        self._valid_possession_patch(self.client, {'status': 'uploaded'})

        self.game_possession.refresh_from_db()
        assert self.game_possession.photo == self.possession_photo
        assert self.game_possession.photo != existing_photo

    def test_uploading_status_returns_200_for_possession_upload_by_player_of_game(self):
        """Test that a player of the game finalizing a possession 'uploading' step gets 200."""
        response = self._patch(
            self.client,
            self.possession_upload_by_player_of_game.id,
            {'status': 'uploading'},
            token=self.player_of_game_token,
            upload_token=self.possession_upload_by_player_of_game.token,
        )
        assert response.status_code == 200

    def test_uploaded_status_sets_possession_photo_ready_for_player_of_game(self):
        """Test that status=uploaded sets GamePossessionPhoto.ready for a player of the game."""
        response = self._patch(
            self.client,
            self.possession_upload_by_player_of_game.id,
            {'status': 'uploaded'},
            token=self.player_of_game_token,
            upload_token=self.possession_upload_by_player_of_game.token,
        )
        assert response.status_code == 200
        self.possession_photo_by_player_of_game.refresh_from_db()
        assert self.possession_photo_by_player_of_game.ready is True

    def test_uploading_status_returns_200_for_possession_upload_by_staff(self):
        """Test that a staff user (not owner) finalizing a possession 'uploading' step gets 200."""
        response = self._patch(
            self.client,
            self.possession_upload_by_staff.id,
            {'status': 'uploading'},
            token=self.staff_token,
            upload_token=self.possession_upload_by_staff.token,
        )
        assert response.status_code == 200

    def test_uploaded_status_sets_possession_photo_ready_for_staff(self):
        """Test that status=uploaded sets GamePossessionPhoto.ready for a staff user (not owner)."""
        response = self._patch(
            self.client,
            self.possession_upload_by_staff.id,
            {'status': 'uploaded'},
            token=self.staff_token,
            upload_token=self.possession_upload_by_staff.token,
        )
        assert response.status_code == 200
        self.possession_photo_by_staff.refresh_from_db()
        assert self.possession_photo_by_staff.ready is True
