"""Tests for the upload finalize endpoint's GameFactionPhoto handling."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.models import GameFactionPhoto
from games.tests.factories import GameFactionFactory, GameFactory, UserFactory
from uploads.models import Upload
from uploads.tests.fixtures import UploadFinalizeFixtureMixin


class TestUploadFinalizeGameFactionPhoto(UploadFinalizeFixtureMixin, TestCase):
    """Tests for PATCH /uploads/image/<upload_id>.json against a GameFactionPhoto upload."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, a player of the game, a staff user, and pending photo uploads."""
        cls.game = GameFactory(name='Epic Quest', game_slug='epic-quest-faction')
        cls.dm_user, cls.dm_token = cls._create_dm(cls.game, username='dm_user_faction')
        cls.player_of_game_user, cls.player_of_game_token = cls._create_player_of_game(
            cls.game, username='player_of_game_faction',
        )
        cls.staff_user, cls.staff_token = cls._create_staff_user(username='staff_user_faction')

        cls.faction = GameFactionFactory(game=cls.game, name='The Silver Hand')

        cls.upload, cls.photo = cls._create_faction_photo(cls.dm_user, 'photo.jpg')
        cls.upload_by_player_of_game, cls.photo_by_player_of_game = cls._create_faction_photo(
            cls.player_of_game_user, 'photo_2.jpg'
        )
        cls.upload_by_staff, cls.photo_by_staff = cls._create_faction_photo(
            cls.staff_user, 'photo_3.jpg'
        )

    @classmethod
    def _create_faction_photo(cls, user, filename):
        """Create a pending Upload/GameFactionPhoto pair for `cls.faction`, by `user`."""
        file_path = f'photos/games/epic-quest-faction/factions/{cls.faction.id}/{filename}'
        return cls._create_upload_and_photo(
            GameFactionPhoto, user, file_path, faction=cls.faction, ready=False,
        )

    def _patch(self, client, upload, payload, token=None, upload_token=None):
        """Issue a PATCH request to the upload finalize endpoint."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        if upload_token is not None:
            extra['HTTP_X_UPLOAD_TOKEN'] = upload_token
        return client.patch(
            f'/uploads/image/{upload.id}.json',
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def _valid_patch(self, client, payload):
        """Issue a valid PATCH request for the DM-owned faction upload."""
        return self._patch(
            client, self.upload, payload, token=self.dm_token, upload_token=self.upload.token,
        )

    def test_unauthenticated_request_returns_401_for_faction_upload(self):
        """Test that an unauthenticated request on a GameFactionPhoto upload returns 401."""
        response = self._patch(
            self.client, self.upload, {'status': 'uploading'}, upload_token=self.upload.token,
        )
        assert response.status_code == 401

    def test_unrelated_user_returns_403_for_faction_upload(self):
        """Test that a user unrelated to the game is rejected on a GameFactionPhoto upload."""
        other_user = UserFactory(username='other_faction', password='secret-password')
        other_token = Token.objects.create(user=other_user)
        Upload.objects.filter(pk=self.upload.pk).update(user=other_user)
        response = self._patch(
            self.client,
            self.upload,
            {'status': 'uploading'},
            token=other_token,
            upload_token=self.upload.token,
        )
        assert response.status_code == 403

    def test_uploading_status_returns_200_for_faction_upload(self):
        """Test that status=uploading returns 200 for a GameFactionPhoto-backed upload."""
        response = self._valid_patch(self.client, {'status': 'uploading'})
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.upload.file_path

    def test_uploaded_status_sets_faction_photo_ready(self):
        """Test that status=uploaded sets GameFactionPhoto.ready to True."""
        self._valid_patch(self.client, {'status': 'uploaded'})
        self.photo.refresh_from_db()
        assert self.photo.ready is True

    def test_uploaded_status_sets_game_faction_photo(self):
        """Test that status=uploaded sets GameFaction.photo when it was unset."""
        self._valid_patch(self.client, {'status': 'uploaded'})
        self.faction.refresh_from_db()
        assert self.faction.photo == self.photo

    def test_uploaded_status_replaces_existing_game_faction_photo(self):
        """Test that status=uploaded replaces an existing GameFaction.photo (no unset guard)."""
        existing_photo = GameFactionPhoto.objects.create(
            faction=self.faction,
            path=f'photos/games/epic-quest-faction/factions/{self.faction.id}/old.jpg',
            ready=True,
        )
        self.faction.photo = existing_photo
        self.faction.save()

        self._valid_patch(self.client, {'status': 'uploaded'})

        self.faction.refresh_from_db()
        assert self.faction.photo == self.photo
        assert self.faction.photo != existing_photo

    def test_uploading_status_returns_200_for_faction_upload_by_player_of_game(self):
        """Test that a player of the game finalizing a faction 'uploading' step gets 200."""
        response = self._patch(
            self.client,
            self.upload_by_player_of_game,
            {'status': 'uploading'},
            token=self.player_of_game_token,
            upload_token=self.upload_by_player_of_game.token,
        )
        assert response.status_code == 200

    def test_uploaded_status_sets_faction_photo_ready_for_player_of_game(self):
        """Test that status=uploaded sets GameFactionPhoto.ready for a player of the game."""
        response = self._patch(
            self.client,
            self.upload_by_player_of_game,
            {'status': 'uploaded'},
            token=self.player_of_game_token,
            upload_token=self.upload_by_player_of_game.token,
        )
        assert response.status_code == 200
        self.photo_by_player_of_game.refresh_from_db()
        assert self.photo_by_player_of_game.ready is True

    def test_uploading_status_returns_200_for_faction_upload_by_staff(self):
        """Test that a staff user (not owner) finalizing a faction 'uploading' step gets 200."""
        response = self._patch(
            self.client,
            self.upload_by_staff,
            {'status': 'uploading'},
            token=self.staff_token,
            upload_token=self.upload_by_staff.token,
        )
        assert response.status_code == 200

    def test_uploaded_status_sets_faction_photo_ready_for_staff(self):
        """Test that status=uploaded sets GameFactionPhoto.ready for a staff user (not owner)."""
        response = self._patch(
            self.client,
            self.upload_by_staff,
            {'status': 'uploaded'},
            token=self.staff_token,
            upload_token=self.upload_by_staff.token,
        )
        assert response.status_code == 200
        self.photo_by_staff.refresh_from_db()
        assert self.photo_by_staff.ready is True
