"""Tests for the upload finalize endpoint's CharacterPhoto handling."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.models import CharacterPhoto
from games.tests.factories import CharacterFactory, GameFactory, PlayerFactory, UserFactory
from uploads.models import Upload


class TestUploadFinalizeCharacterPhoto(TestCase):
    """Tests for PATCH /uploads/image/<upload_id>.json against a CharacterPhoto upload."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a PC and NPC character, and pending photo uploads for both."""
        cls.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)

        cls.player = PlayerFactory(name='Bob')
        cls.owner = UserFactory(username='owner', password='secret-password')
        cls.player.user = cls.owner
        cls.player.save()
        cls.character = CharacterFactory(
            name='Aragorn', game=cls.game, player=cls.player, npc=False
        )
        cls.owner_token = Token.objects.create(user=cls.owner)

        cls.character_upload = Upload.objects.create(
            user=cls.owner,
            file_path='photos/games/epic-quest/characters/1/hero_abc.jpg',
        )
        cls.character_photo = CharacterPhoto.objects.create(
            character=cls.character,
            path='photos/games/epic-quest/characters/1/hero_abc.jpg',
            ready=False,
        )
        cls.character_upload.content_object = cls.character_photo
        cls.character_upload.save()

        cls.player_of_game_user = UserFactory(
            username='player_of_game', password='secret-password'
        )
        cls.player_of_game = PlayerFactory(
            name='Pippin', user=cls.player_of_game_user, game=cls.game
        )
        cls.player_of_game_token = Token.objects.create(user=cls.player_of_game_user)

        cls.npc = CharacterFactory(name='Gandalf', game=cls.game, npc=True)
        cls.npc_upload = Upload.objects.create(
            user=cls.player_of_game_user,
            file_path='photos/games/epic-quest/characters/2/npc.jpg',
        )
        cls.npc_photo = CharacterPhoto.objects.create(
            character=cls.npc,
            path='photos/games/epic-quest/characters/2/npc.jpg',
            ready=False,
        )
        cls.npc_upload.content_object = cls.npc_photo
        cls.npc_upload.save()

        cls.pc_upload_by_player_of_game = Upload.objects.create(
            user=cls.player_of_game_user,
            file_path='photos/games/epic-quest/characters/1/pc_other.jpg',
        )
        cls.pc_photo_by_player_of_game = CharacterPhoto.objects.create(
            character=cls.character,
            path='photos/games/epic-quest/characters/1/pc_other.jpg',
            ready=False,
        )
        cls.pc_upload_by_player_of_game.content_object = cls.pc_photo_by_player_of_game
        cls.pc_upload_by_player_of_game.save()

        cls.staff_user = UserFactory(
            username='staff_user', password='secret-password', is_staff=True
        )
        cls.staff_token = Token.objects.create(user=cls.staff_user)

        cls.pc_upload_by_staff = Upload.objects.create(
            user=cls.staff_user,
            file_path='photos/games/epic-quest/characters/1/pc_staff.jpg',
        )
        cls.pc_photo_by_staff = CharacterPhoto.objects.create(
            character=cls.character,
            path='photos/games/epic-quest/characters/1/pc_staff.jpg',
            ready=False,
        )
        cls.pc_upload_by_staff.content_object = cls.pc_photo_by_staff
        cls.pc_upload_by_staff.save()

        cls.npc_upload_by_staff = Upload.objects.create(
            user=cls.staff_user,
            file_path='photos/games/epic-quest/characters/2/npc_staff.jpg',
        )
        cls.npc_photo_by_staff = CharacterPhoto.objects.create(
            character=cls.npc,
            path='photos/games/epic-quest/characters/2/npc_staff.jpg',
            ready=False,
        )
        cls.npc_upload_by_staff.content_object = cls.npc_photo_by_staff
        cls.npc_upload_by_staff.save()

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

    def _valid_character_patch(self, client, payload=None):
        """Issue a valid PATCH request for the character upload, owned by the owning player."""
        if payload is None:
            payload = {'status': 'uploading'}
        return self._patch(
            client,
            self.character_upload.id,
            payload,
            token=self.owner_token,
            upload_token=self.character_upload.token,
        )

    def _valid_npc_patch(self, client, payload=None):
        """Issue a valid PATCH request for the NPC upload, owned by a player of the game."""
        if payload is None:
            payload = {'status': 'uploading'}
        return self._patch(
            client,
            self.npc_upload.id,
            payload,
            token=self.player_of_game_token,
            upload_token=self.npc_upload.token,
        )

    def test_unrelated_user_returns_403_for_character_upload(self):
        """Test that a user unrelated to the character is rejected on a CharacterPhoto upload."""
        other_user = UserFactory(username='other', password='secret-password')
        other_token = Token.objects.create(user=other_user)
        self.character_upload.user = other_user
        Upload.objects.filter(pk=self.character_upload.pk).update(user=other_user)
        response = self._patch(
            self.client,
            self.character_upload.id,
            {'status': 'uploading'},
            token=other_token,
            upload_token=self.character_upload.token,
        )
        assert response.status_code == 403

    def test_uploading_status_returns_200_for_character_upload(self):
        """Test that status=uploading returns 200 for a CharacterPhoto-backed upload."""
        response = self._valid_character_patch(self.client, {'status': 'uploading'})
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.character_upload.file_path

    def test_uploaded_status_sets_character_photo_ready(self):
        """Test that status=uploaded sets CharacterPhoto.ready to True."""
        self._valid_character_patch(self.client, {'status': 'uploaded'})
        self.character_photo.refresh_from_db()
        assert self.character_photo.ready is True

    def test_uploaded_status_sets_character_photo(self):
        """Test that status=uploaded sets character.photo when it was unset."""
        self._valid_character_patch(self.client, {'status': 'uploaded'})
        self.character.refresh_from_db()
        assert self.character.photo == self.character_photo

    def test_uploaded_status_does_not_overwrite_existing_character_photo(self):
        """Test that status=uploaded does not overwrite an existing character.photo."""
        existing_photo = CharacterPhoto.objects.create(
            character=self.character,
            path='photos/games/epic-quest/characters/1/existing.jpg',
            ready=True,
        )
        self.character.photo = existing_photo
        self.character.save()

        self._valid_character_patch(self.client, {'status': 'uploaded'})

        self.character.refresh_from_db()
        assert self.character.photo == existing_photo

    def test_uploading_status_returns_200_for_npc_upload_by_player_of_game(self):
        """Test that a player of the game finalizing an NPC CharacterPhoto upload gets 200."""
        response = self._valid_npc_patch(self.client, {'status': 'uploading'})
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.npc_upload.file_path

    def test_uploaded_status_sets_npc_photo_ready_for_player_of_game(self):
        """Test that status=uploaded sets NPC CharacterPhoto.ready for a player of the game."""
        self._valid_npc_patch(self.client, {'status': 'uploaded'})
        self.npc_photo.refresh_from_db()
        assert self.npc_photo.ready is True

    def test_player_of_game_returns_200_for_pc_upload(self):
        """Test that a player of the game can finalize a PC CharacterPhoto upload."""
        response = self._patch(
            self.client,
            self.pc_upload_by_player_of_game.id,
            {'status': 'uploading'},
            token=self.player_of_game_token,
            upload_token=self.pc_upload_by_player_of_game.token,
        )
        assert response.status_code == 200

    def test_uploaded_status_sets_pc_photo_ready_for_player_of_game(self):
        """Test that status=uploaded sets PC CharacterPhoto.ready for a player of the game."""
        response = self._patch(
            self.client,
            self.pc_upload_by_player_of_game.id,
            {'status': 'uploaded'},
            token=self.player_of_game_token,
            upload_token=self.pc_upload_by_player_of_game.token,
        )
        assert response.status_code == 200
        self.pc_photo_by_player_of_game.refresh_from_db()
        assert self.pc_photo_by_player_of_game.ready is True

    def test_uploading_status_returns_200_for_pc_upload_by_staff(self):
        """Test that a staff user (not owner) finalizing a PC upload's 'uploading' step gets 200."""
        response = self._patch(
            self.client,
            self.pc_upload_by_staff.id,
            {'status': 'uploading'},
            token=self.staff_token,
            upload_token=self.pc_upload_by_staff.token,
        )
        assert response.status_code == 200

    def test_uploaded_status_sets_pc_photo_ready_for_staff(self):
        """Test that status=uploaded sets PC CharacterPhoto.ready for a staff user (not owner)."""
        response = self._patch(
            self.client,
            self.pc_upload_by_staff.id,
            {'status': 'uploaded'},
            token=self.staff_token,
            upload_token=self.pc_upload_by_staff.token,
        )
        assert response.status_code == 200
        self.pc_photo_by_staff.refresh_from_db()
        assert self.pc_photo_by_staff.ready is True

    def test_uploading_status_returns_200_for_npc_upload_by_staff(self):
        """Test that a staff user (not owner) finalizing an NPC 'uploading' step gets 200."""
        response = self._patch(
            self.client,
            self.npc_upload_by_staff.id,
            {'status': 'uploading'},
            token=self.staff_token,
            upload_token=self.npc_upload_by_staff.token,
        )
        assert response.status_code == 200

    def test_uploaded_status_sets_npc_photo_ready_for_staff(self):
        """Test that status=uploaded sets NPC CharacterPhoto.ready for a staff user (not owner)."""
        response = self._patch(
            self.client,
            self.npc_upload_by_staff.id,
            {'status': 'uploaded'},
            token=self.staff_token,
            upload_token=self.npc_upload_by_staff.token,
        )
        assert response.status_code == 200
        self.npc_photo_by_staff.refresh_from_db()
        assert self.npc_photo_by_staff.ready is True
