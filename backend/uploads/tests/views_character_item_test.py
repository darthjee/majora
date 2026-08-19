"""Tests for the upload finalize endpoint's CharacterItemPhoto handling."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.models import CharacterItemPhoto
from games.tests.factories import (
    CharacterFactory,
    CharacterItemFactory,
    GameFactory,
    PlayerFactory,
    UserFactory,
)
from uploads.models import Upload
from uploads.tests.fixtures import UploadFinalizeFixtureMixin


class TestUploadFinalizeCharacterItemPhoto(UploadFinalizeFixtureMixin, TestCase):
    """Tests for PATCH /uploads/image/<upload_id>.json against a CharacterItemPhoto upload."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a PC-owned character item, and pending uploads by owner, DM, staff."""
        cls.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        cls.dm_user, cls.dm_token = cls._create_dm(cls.game)

        cls.player = PlayerFactory(name='Bob')
        cls.owner = UserFactory(username='owner', password='secret-password')
        cls.player.user = cls.owner
        cls.player.save()
        cls.character = CharacterFactory(
            name='Aragorn', game=cls.game, player=cls.player, npc=False
        )
        cls.owner_token = Token.objects.create(user=cls.owner)

        cls.staff_user, cls.staff_token = cls._create_staff_user()

        cls.character_item = CharacterItemFactory(character=cls.character)

        cls.character_item_upload, cls.character_item_photo = cls._create_character_item_photo(
            cls.owner, 'photo.jpg'
        )
        cls.character_item_upload_by_dm, cls.character_item_photo_by_dm = (
            cls._create_character_item_photo(cls.dm_user, 'photo_dm.jpg')
        )
        cls.character_item_upload_by_staff, cls.character_item_photo_by_staff = (
            cls._create_character_item_photo(cls.staff_user, 'photo_staff.jpg')
        )

    @classmethod
    def _create_character_item_photo(cls, user, filename):
        """Create a pending Upload/CharacterItemPhoto pair for `cls.character_item`, by `user`."""
        file_path = (
            f'photos/games/epic-quest/pcs/{cls.character.id}'
            f'/items/{cls.character_item.id}/{filename}'
        )
        return cls._create_upload_and_photo(
            CharacterItemPhoto,
            user,
            file_path,
            character_item=cls.character_item,
            ready=False,
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

    def _valid_character_item_patch(self, client, payload=None):
        """Issue a valid PATCH request for the character item upload, owned by the PC's owner."""
        if payload is None:
            payload = {'status': 'uploading'}
        return self._patch(
            client,
            self.character_item_upload.id,
            payload,
            token=self.owner_token,
            upload_token=self.character_item_upload.token,
        )

    def test_unauthenticated_request_returns_401_for_character_item_upload(self):
        """Test that an unauthenticated request on a CharacterItemPhoto upload returns 401."""
        response = self._patch(
            self.client,
            self.character_item_upload.id,
            {'status': 'uploading'},
            upload_token=self.character_item_upload.token,
        )
        assert response.status_code == 401

    def test_unrelated_user_returns_403_for_character_item_upload(self):
        """Test that a user unrelated to the character is rejected on a CharacterItemPhoto."""
        other_user = UserFactory(username='other_char_item', password='secret-password')
        other_token = Token.objects.create(user=other_user)
        self.character_item_upload.user = other_user
        Upload.objects.filter(pk=self.character_item_upload.pk).update(user=other_user)
        response = self._patch(
            self.client,
            self.character_item_upload.id,
            {'status': 'uploading'},
            token=other_token,
            upload_token=self.character_item_upload.token,
        )
        assert response.status_code == 403

    def test_uploading_status_returns_200_for_character_item_upload(self):
        """Test that status=uploading returns 200 for a CharacterItemPhoto-backed upload."""
        response = self._valid_character_item_patch(self.client, {'status': 'uploading'})
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.character_item_upload.file_path

    def test_uploaded_status_sets_character_item_photo_ready(self):
        """Test that status=uploaded sets CharacterItemPhoto.ready to True."""
        self._valid_character_item_patch(self.client, {'status': 'uploaded'})
        self.character_item_photo.refresh_from_db()
        assert self.character_item_photo.ready is True

    def test_uploaded_status_sets_character_item_photo(self):
        """Test that status=uploaded sets CharacterItem.photo when it was unset."""
        self._valid_character_item_patch(self.client, {'status': 'uploaded'})
        self.character_item.refresh_from_db()
        assert self.character_item.photo == self.character_item_photo

    def test_uploaded_status_replaces_existing_character_item_photo(self):
        """Test that status=uploaded replaces an existing CharacterItem.photo (no unset guard)."""
        existing_photo = CharacterItemPhoto.objects.create(
            character_item=self.character_item,
            path=(
                f'photos/games/epic-quest/pcs/{self.character.id}'
                f'/items/{self.character_item.id}/old.jpg'
            ),
            ready=True,
        )
        self.character_item.photo = existing_photo
        self.character_item.save()

        self._valid_character_item_patch(self.client, {'status': 'uploaded'})

        self.character_item.refresh_from_db()
        assert self.character_item.photo == self.character_item_photo
        assert self.character_item.photo != existing_photo

    def test_uploading_status_returns_200_for_character_item_upload_by_dm(self):
        """Test that the game's DM finalizing a character item 'uploading' step gets 200."""
        response = self._patch(
            self.client,
            self.character_item_upload_by_dm.id,
            {'status': 'uploading'},
            token=self.dm_token,
            upload_token=self.character_item_upload_by_dm.token,
        )
        assert response.status_code == 200

    def test_uploaded_status_sets_character_item_photo_ready_for_dm(self):
        """Test that status=uploaded sets CharacterItemPhoto.ready for the game's DM."""
        response = self._patch(
            self.client,
            self.character_item_upload_by_dm.id,
            {'status': 'uploaded'},
            token=self.dm_token,
            upload_token=self.character_item_upload_by_dm.token,
        )
        assert response.status_code == 200
        self.character_item_photo_by_dm.refresh_from_db()
        assert self.character_item_photo_by_dm.ready is True

    def test_uploading_status_returns_200_for_character_item_upload_by_staff(self):
        """Test that a staff user (not owner) finalizing a character item 'uploading' gets 200."""
        response = self._patch(
            self.client,
            self.character_item_upload_by_staff.id,
            {'status': 'uploading'},
            token=self.staff_token,
            upload_token=self.character_item_upload_by_staff.token,
        )
        assert response.status_code == 200

    def test_uploaded_status_sets_character_item_photo_ready_for_staff(self):
        """Test that status=uploaded sets CharacterItemPhoto.ready for a staff user (not owner)."""
        response = self._patch(
            self.client,
            self.character_item_upload_by_staff.id,
            {'status': 'uploaded'},
            token=self.staff_token,
            upload_token=self.character_item_upload_by_staff.token,
        )
        assert response.status_code == 200
        self.character_item_photo_by_staff.refresh_from_db()
        assert self.character_item_photo_by_staff.ready is True
