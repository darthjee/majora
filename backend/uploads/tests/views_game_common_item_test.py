"""Tests for the upload finalize endpoint's GameCommonItemPhoto handling."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.models import GameCommonItemPhoto
from games.tests.factories import (
    GameCommonItemFactory,
    GameFactory,
    PlayerFactory,
    UserFactory,
)
from uploads.models import Upload


class TestUploadFinalizeGameCommonItemPhoto(TestCase):
    """Tests for PATCH /uploads/image/<upload_id>.json against a GameCommonItemPhoto upload."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a game common item, and pending photo uploads by DM, player, staff."""
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

        cls.game_common_item = GameCommonItemFactory(game=cls.game, name='Healing Potion')

        cls.common_item_upload = Upload.objects.create(
            user=cls.dm_user,
            file_path=(
                f'photos/games/epic-quest/common_items/{cls.game_common_item.id}/photo.jpg'
            ),
        )
        cls.common_item_photo = GameCommonItemPhoto.objects.create(
            game_common_item=cls.game_common_item,
            path=f'photos/games/epic-quest/common_items/{cls.game_common_item.id}/photo.jpg',
            ready=False,
        )
        cls.common_item_upload.content_object = cls.common_item_photo
        cls.common_item_upload.save()

        cls.common_item_upload_by_player_of_game = Upload.objects.create(
            user=cls.player_of_game_user,
            file_path=(
                f'photos/games/epic-quest/common_items/{cls.game_common_item.id}/photo_2.jpg'
            ),
        )
        cls.common_item_photo_by_player_of_game = GameCommonItemPhoto.objects.create(
            game_common_item=cls.game_common_item,
            path=(
                f'photos/games/epic-quest/common_items/{cls.game_common_item.id}/photo_2.jpg'
            ),
            ready=False,
        )
        cls.common_item_upload_by_player_of_game.content_object = (
            cls.common_item_photo_by_player_of_game
        )
        cls.common_item_upload_by_player_of_game.save()

        cls.common_item_upload_by_staff = Upload.objects.create(
            user=cls.staff_user,
            file_path=(
                f'photos/games/epic-quest/common_items/{cls.game_common_item.id}/photo_3.jpg'
            ),
        )
        cls.common_item_photo_by_staff = GameCommonItemPhoto.objects.create(
            game_common_item=cls.game_common_item,
            path=(
                f'photos/games/epic-quest/common_items/{cls.game_common_item.id}/photo_3.jpg'
            ),
            ready=False,
        )
        cls.common_item_upload_by_staff.content_object = cls.common_item_photo_by_staff
        cls.common_item_upload_by_staff.save()

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

    def _valid_common_item_patch(self, client, payload=None):
        """Issue a valid PATCH request for the common item upload, owned by the DM."""
        if payload is None:
            payload = {'status': 'uploading'}
        return self._patch(
            client,
            self.common_item_upload.id,
            payload,
            token=self.dm_token,
            upload_token=self.common_item_upload.token,
        )

    def test_unauthenticated_request_returns_401_for_common_item_upload(self):
        """Test that an unauthenticated request on a GameCommonItemPhoto upload returns 401."""
        response = self._patch(
            self.client,
            self.common_item_upload.id,
            {'status': 'uploading'},
            upload_token=self.common_item_upload.token,
        )
        assert response.status_code == 401

    def test_unrelated_user_returns_403_for_common_item_upload(self):
        """Test that a user unrelated to the game is rejected on a GameCommonItemPhoto upload."""
        other_user = UserFactory(username='other_common_item', password='secret-password')
        other_token = Token.objects.create(user=other_user)
        self.common_item_upload.user = other_user
        Upload.objects.filter(pk=self.common_item_upload.pk).update(user=other_user)
        response = self._patch(
            self.client,
            self.common_item_upload.id,
            {'status': 'uploading'},
            token=other_token,
            upload_token=self.common_item_upload.token,
        )
        assert response.status_code == 403

    def test_uploading_status_returns_200_for_common_item_upload(self):
        """Test that status=uploading returns 200 for a GameCommonItemPhoto-backed upload."""
        response = self._valid_common_item_patch(self.client, {'status': 'uploading'})
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.common_item_upload.file_path

    def test_uploaded_status_sets_common_item_photo_ready(self):
        """Test that status=uploaded sets GameCommonItemPhoto.ready to True."""
        self._valid_common_item_patch(self.client, {'status': 'uploaded'})
        self.common_item_photo.refresh_from_db()
        assert self.common_item_photo.ready is True

    def test_uploaded_status_sets_game_common_item_photo(self):
        """Test that status=uploaded sets GameCommonItem.photo when it was unset."""
        self._valid_common_item_patch(self.client, {'status': 'uploaded'})
        self.game_common_item.refresh_from_db()
        assert self.game_common_item.photo == self.common_item_photo

    def test_uploaded_status_replaces_existing_game_common_item_photo(self):
        """Test that status=uploaded replaces an existing GameCommonItem.photo (no unset guard)."""
        existing_photo = GameCommonItemPhoto.objects.create(
            game_common_item=self.game_common_item,
            path=f'photos/games/epic-quest/common_items/{self.game_common_item.id}/old.jpg',
            ready=True,
        )
        self.game_common_item.photo = existing_photo
        self.game_common_item.save()

        self._valid_common_item_patch(self.client, {'status': 'uploaded'})

        self.game_common_item.refresh_from_db()
        assert self.game_common_item.photo == self.common_item_photo
        assert self.game_common_item.photo != existing_photo

    def test_uploading_status_returns_200_for_common_item_upload_by_player_of_game(self):
        """Test that a player of the game finalizing a common item 'uploading' step gets 200."""
        response = self._patch(
            self.client,
            self.common_item_upload_by_player_of_game.id,
            {'status': 'uploading'},
            token=self.player_of_game_token,
            upload_token=self.common_item_upload_by_player_of_game.token,
        )
        assert response.status_code == 200

    def test_uploaded_status_sets_common_item_photo_ready_for_player_of_game(self):
        """Test that status=uploaded sets GameCommonItemPhoto.ready for a player of the game."""
        response = self._patch(
            self.client,
            self.common_item_upload_by_player_of_game.id,
            {'status': 'uploaded'},
            token=self.player_of_game_token,
            upload_token=self.common_item_upload_by_player_of_game.token,
        )
        assert response.status_code == 200
        self.common_item_photo_by_player_of_game.refresh_from_db()
        assert self.common_item_photo_by_player_of_game.ready is True

    def test_uploading_status_returns_200_for_common_item_upload_by_staff(self):
        """Test that a staff user (not owner) finalizing a common item 'uploading' step gets 200."""
        response = self._patch(
            self.client,
            self.common_item_upload_by_staff.id,
            {'status': 'uploading'},
            token=self.staff_token,
            upload_token=self.common_item_upload_by_staff.token,
        )
        assert response.status_code == 200

    def test_uploaded_status_sets_common_item_photo_ready_for_staff(self):
        """Test that status=uploaded sets GameCommonItemPhoto.ready for a staff user (not owner)."""
        response = self._patch(
            self.client,
            self.common_item_upload_by_staff.id,
            {'status': 'uploaded'},
            token=self.staff_token,
            upload_token=self.common_item_upload_by_staff.token,
        )
        assert response.status_code == 200
        self.common_item_photo_by_staff.refresh_from_db()
        assert self.common_item_photo_by_staff.ready is True
