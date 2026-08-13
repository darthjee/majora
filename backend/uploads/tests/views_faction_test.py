"""Tests for the upload finalize endpoint's FactionPhoto handling."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.models import FactionPhoto
from games.tests.factories import FactionFactory, GameFactory, PlayerFactory, UserFactory
from uploads.models import Upload


class TestUploadFinalizeFactionPhoto(TestCase):
    """Tests for PATCH /uploads/image/<upload_id>.json against a FactionPhoto upload."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, a player of the game, a staff user, and pending photo uploads."""
        cls.game = GameFactory(name='Epic Quest', game_slug='epic-quest-faction')
        cls.dm_user = UserFactory(username='dm_user_faction', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)

        cls.player_of_game_user = UserFactory(
            username='player_of_game_faction', password='secret-password',
        )
        PlayerFactory(name='Pippin', user=cls.player_of_game_user, game=cls.game)
        cls.player_of_game_token = Token.objects.create(user=cls.player_of_game_user)

        cls.staff_user = UserFactory(
            username='staff_user_faction', password='secret-password', is_staff=True,
        )
        cls.staff_token = Token.objects.create(user=cls.staff_user)

        cls.faction = FactionFactory(game=cls.game, name='The Silver Hand')

        cls.upload = Upload.objects.create(
            user=cls.dm_user,
            file_path=f'photos/games/epic-quest-faction/factions/{cls.faction.id}/photo.jpg',
        )
        cls.photo = FactionPhoto.objects.create(
            faction=cls.faction,
            path=f'photos/games/epic-quest-faction/factions/{cls.faction.id}/photo.jpg',
            ready=False,
        )
        cls.upload.content_object = cls.photo
        cls.upload.save()

        cls.upload_by_player_of_game = Upload.objects.create(
            user=cls.player_of_game_user,
            file_path=(
                f'photos/games/epic-quest-faction/factions/{cls.faction.id}/photo_2.jpg'
            ),
        )
        cls.photo_by_player_of_game = FactionPhoto.objects.create(
            faction=cls.faction,
            path=(
                f'photos/games/epic-quest-faction/factions/{cls.faction.id}/photo_2.jpg'
            ),
            ready=False,
        )
        cls.upload_by_player_of_game.content_object = cls.photo_by_player_of_game
        cls.upload_by_player_of_game.save()

        cls.upload_by_staff = Upload.objects.create(
            user=cls.staff_user,
            file_path=(
                f'photos/games/epic-quest-faction/factions/{cls.faction.id}/photo_3.jpg'
            ),
        )
        cls.photo_by_staff = FactionPhoto.objects.create(
            faction=cls.faction,
            path=(
                f'photos/games/epic-quest-faction/factions/{cls.faction.id}/photo_3.jpg'
            ),
            ready=False,
        )
        cls.upload_by_staff.content_object = cls.photo_by_staff
        cls.upload_by_staff.save()

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
        """Test that an unauthenticated request on a FactionPhoto upload returns 401."""
        response = self._patch(
            self.client, self.upload, {'status': 'uploading'}, upload_token=self.upload.token,
        )
        assert response.status_code == 401

    def test_unrelated_user_returns_403_for_faction_upload(self):
        """Test that a user unrelated to the game is rejected on a FactionPhoto upload."""
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
        """Test that status=uploading returns 200 for a FactionPhoto-backed upload."""
        response = self._valid_patch(self.client, {'status': 'uploading'})
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.upload.file_path

    def test_uploaded_status_sets_faction_photo_ready(self):
        """Test that status=uploaded sets FactionPhoto.ready to True."""
        self._valid_patch(self.client, {'status': 'uploaded'})
        self.photo.refresh_from_db()
        assert self.photo.ready is True

    def test_uploaded_status_sets_game_faction_photo(self):
        """Test that status=uploaded sets Faction.photo when it was unset."""
        self._valid_patch(self.client, {'status': 'uploaded'})
        self.faction.refresh_from_db()
        assert self.faction.photo == self.photo

    def test_uploaded_status_replaces_existing_game_faction_photo(self):
        """Test that status=uploaded replaces an existing Faction.photo (no unset guard)."""
        existing_photo = FactionPhoto.objects.create(
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
        """Test that status=uploaded sets FactionPhoto.ready for a player of the game."""
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
        """Test that status=uploaded sets FactionPhoto.ready for a staff user (not owner)."""
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
