"""Tests for the upload finalize endpoint."""

import json

import pytest
from django.utils import timezone
from rest_framework.authtoken.models import Token

from games.models import (
    CharacterPhoto,
    GamePhoto,
    TreasurePhoto,
    Upload,
)
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    GameMasterFactory,
    PlayerFactory,
    SuperUserFactory,
    TreasureFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestUploadFinalizeView:
    """Tests for PATCH /uploads/<upload_id>.json."""

    def setup_method(self):
        """Set up a game, a DM user, an upload, and a linked game photo."""
        self.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)

        self.upload = Upload.objects.create(
            user=self.dm_user,
            file_path='photos/games/epic-quest/hero_abc.jpg',
        )
        self.game_photo = GamePhoto.objects.create(
            game=self.game,
            path='photos/games/epic-quest/hero_abc.jpg',
            ready=False,
        )
        self.upload.content_object = self.game_photo
        self.upload.save()

        self.player = PlayerFactory(name='Bob')
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.character = CharacterFactory(
            name='Aragorn', game=self.game, player=self.player, npc=False
        )
        self.owner_token = Token.objects.create(user=self.owner)

        self.character_upload = Upload.objects.create(
            user=self.owner,
            file_path='photos/games/epic-quest/characters/1/hero_abc.jpg',
        )
        self.character_photo = CharacterPhoto.objects.create(
            character=self.character,
            path='photos/games/epic-quest/characters/1/hero_abc.jpg',
            ready=False,
        )
        self.character_upload.content_object = self.character_photo
        self.character_upload.save()

        self.player_of_game_user = UserFactory(
            username='player_of_game', password='secret-password'
        )
        self.player_of_game = PlayerFactory(name='Pippin', user=self.player_of_game_user)
        self.player_of_game.games.add(self.game)
        self.player_of_game_token = Token.objects.create(user=self.player_of_game_user)

        self.npc = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.npc_upload = Upload.objects.create(
            user=self.player_of_game_user,
            file_path='photos/games/epic-quest/characters/2/npc.jpg',
        )
        self.npc_photo = CharacterPhoto.objects.create(
            character=self.npc,
            path='photos/games/epic-quest/characters/2/npc.jpg',
            ready=False,
        )
        self.npc_upload.content_object = self.npc_photo
        self.npc_upload.save()

        self.pc_upload_by_player_of_game = Upload.objects.create(
            user=self.player_of_game_user,
            file_path='photos/games/epic-quest/characters/1/pc_other.jpg',
        )
        self.pc_photo_by_player_of_game = CharacterPhoto.objects.create(
            character=self.character,
            path='photos/games/epic-quest/characters/1/pc_other.jpg',
            ready=False,
        )
        self.pc_upload_by_player_of_game.content_object = self.pc_photo_by_player_of_game
        self.pc_upload_by_player_of_game.save()

        self.superuser = SuperUserFactory(
            username='admin', password='secret-password'
        )
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.treasure = TreasureFactory(name='Golden Crown', value=500)

        self.treasure_upload = Upload.objects.create(
            user=self.superuser,
            file_path=f'photos/treasures/{self.treasure.id}/photo.jpg',
        )
        self.treasure_photo = TreasurePhoto.objects.create(
            treasure=self.treasure,
            path=f'photos/treasures/{self.treasure.id}/photo.jpg',
            ready=False,
        )
        self.treasure_upload.content_object = self.treasure_photo
        self.treasure_upload.save()

    def _patch(self, client, upload_id, payload, token=None, upload_token=None):
        """Issue a PATCH request to the upload finalize endpoint."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        if upload_token is not None:
            extra['HTTP_X_UPLOAD_TOKEN'] = upload_token
        return client.patch(
            f'/uploads/{upload_id}.json',
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def _valid_patch(self, client, payload=None):
        """Issue a valid PATCH request with correct token, auth, and upload token."""
        if payload is None:
            payload = {'status': 'uploading'}
        return self._patch(
            client,
            self.upload.id,
            payload,
            token=self.dm_token,
            upload_token=self.upload.token,
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

    def _valid_treasure_patch(self, client, payload=None):
        """Issue a valid PATCH request for the treasure upload, owned by the superuser."""
        if payload is None:
            payload = {'status': 'uploading'}
        return self._patch(
            client,
            self.treasure_upload.id,
            payload,
            token=self.superuser_token,
            upload_token=self.treasure_upload.token,
        )

    def test_nonexistent_upload_returns_403(self, client):
        """Test that a request for a non-existent upload ID returns 403, not 404."""
        response = self._patch(
            client,
            upload_id=99999,
            payload={'status': 'uploading'},
            token=self.dm_token,
            upload_token='any-token',
        )
        assert response.status_code == 403

    def test_wrong_upload_token_returns_403(self, client):
        """Test that a mismatched X-Upload-Token header returns 403."""
        response = self._patch(
            client,
            self.upload.id,
            {'status': 'uploading'},
            token=self.dm_token,
            upload_token='wrong-token',
        )
        assert response.status_code == 403

    def test_different_user_returns_403(self, client):
        """Test that an authenticated user who does not own the upload gets 403."""
        other_user = UserFactory(username='other', password='secret-password')
        other_token = Token.objects.create(user=other_user)
        response = self._patch(
            client,
            self.upload.id,
            {'status': 'uploading'},
            token=other_token,
            upload_token=self.upload.token,
        )
        assert response.status_code == 403

    def test_expired_upload_returns_403(self, client):
        """Test that an expired upload returns 403."""
        self.upload.expiration_time = timezone.now() - timezone.timedelta(minutes=1)
        self.upload.save()
        response = self._valid_patch(client)
        assert response.status_code == 403

    def test_already_uploaded_status_returns_403(self, client):
        """Test that an upload already in 'uploaded' state returns 403."""
        self.upload.status = Upload.STATUS_UPLOADED
        Upload.objects.filter(pk=self.upload.pk).update(status=Upload.STATUS_UPLOADED)
        response = self._valid_patch(client)
        assert response.status_code == 403

    def test_non_game_master_user_returns_403(self, client):
        """Test that a user with no game master role returns 403 on game permission check."""
        non_dm = UserFactory(username='non_dm', password='secret-password')
        non_dm_token = Token.objects.create(user=non_dm)
        self.upload.user = non_dm
        Upload.objects.filter(pk=self.upload.pk).update(user=non_dm)
        response = self._patch(
            client,
            self.upload.id,
            {'status': 'uploading'},
            token=non_dm_token,
            upload_token=self.upload.token,
        )
        assert response.status_code == 403

    def test_uploading_status_returns_200_with_file_path(self, client):
        """Test that status=uploading returns 200 with the file_path."""
        response = self._valid_patch(client, {'status': 'uploading'})
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.upload.file_path

    def test_uploading_status_sets_upload_status(self, client):
        """Test that status=uploading updates the Upload record's status."""
        self._valid_patch(client, {'status': 'uploading'})
        self.upload.refresh_from_db()
        assert self.upload.status == Upload.STATUS_UPLOADING

    def test_uploaded_status_returns_200(self, client):
        """Test that status=uploaded returns 200."""
        response = self._valid_patch(client, {'status': 'uploaded'})
        assert response.status_code == 200

    def test_uploaded_status_sets_game_photo_ready(self, client):
        """Test that status=uploaded sets GamePhoto.ready to True."""
        self._valid_patch(client, {'status': 'uploaded'})
        self.game_photo.refresh_from_db()
        assert self.game_photo.ready is True

    def test_uploaded_status_sets_game_cover_photo(self, client):
        """Test that status=uploaded sets game.cover_photo when it was unset."""
        self._valid_patch(client, {'status': 'uploaded'})
        self.game.refresh_from_db()
        assert self.game.cover_photo == self.game_photo

    def test_uploaded_status_does_not_overwrite_existing_cover_photo(self, client):
        """Test that status=uploaded does not overwrite an existing game.cover_photo."""
        existing_cover = GamePhoto.objects.create(
            game=self.game,
            path='photos/games/epic-quest/existing.jpg',
            ready=True,
        )
        self.game.cover_photo = existing_cover
        self.game.save()

        self._valid_patch(client, {'status': 'uploaded'})

        self.game.refresh_from_db()
        assert self.game.cover_photo == existing_cover

    def test_invalid_status_value_returns_400(self, client):
        """Test that an invalid status value returns 400."""
        response = self._valid_patch(client, {'status': 'invalid'})
        assert response.status_code == 400

    def test_unauthenticated_request_returns_401(self, client):
        """Test that a request without an auth token returns 401."""
        response = self._patch(
            client,
            self.upload.id,
            {'status': 'uploading'},
            upload_token=self.upload.token,
        )
        assert response.status_code == 401

    def test_uploading_status_via_session_cookie(self, client):
        """Test that status=uploading succeeds for a cookie-authenticated DM."""
        session = client.session
        session['auth_token'] = self.dm_token.key
        session.save()
        response = self._patch(
            client,
            self.upload.id,
            {'status': 'uploading'},
            upload_token=self.upload.token,
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.upload.file_path

    def test_unrelated_user_returns_403_for_character_upload(self, client):
        """Test that a user unrelated to the character is rejected on a CharacterPhoto upload."""
        other_user = UserFactory(username='other', password='secret-password')
        other_token = Token.objects.create(user=other_user)
        self.character_upload.user = other_user
        Upload.objects.filter(pk=self.character_upload.pk).update(user=other_user)
        response = self._patch(
            client,
            self.character_upload.id,
            {'status': 'uploading'},
            token=other_token,
            upload_token=self.character_upload.token,
        )
        assert response.status_code == 403

    def test_uploading_status_returns_200_for_character_upload(self, client):
        """Test that status=uploading returns 200 for a CharacterPhoto-backed upload."""
        response = self._valid_character_patch(client, {'status': 'uploading'})
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.character_upload.file_path

    def test_uploaded_status_sets_character_photo_ready(self, client):
        """Test that status=uploaded sets CharacterPhoto.ready to True."""
        self._valid_character_patch(client, {'status': 'uploaded'})
        self.character_photo.refresh_from_db()
        assert self.character_photo.ready is True

    def test_uploaded_status_sets_character_profile_photo(self, client):
        """Test that status=uploaded sets character.profile_photo when it was unset."""
        self._valid_character_patch(client, {'status': 'uploaded'})
        self.character.refresh_from_db()
        assert self.character.profile_photo == self.character_photo

    def test_uploaded_status_does_not_overwrite_existing_profile_photo(self, client):
        """Test that status=uploaded does not overwrite an existing character.profile_photo."""
        existing_profile_photo = CharacterPhoto.objects.create(
            character=self.character,
            path='photos/games/epic-quest/characters/1/existing.jpg',
            ready=True,
        )
        self.character.profile_photo = existing_profile_photo
        self.character.save()

        self._valid_character_patch(client, {'status': 'uploaded'})

        self.character.refresh_from_db()
        assert self.character.profile_photo == existing_profile_photo

    def test_uploading_status_returns_200_for_npc_upload_by_player_of_game(self, client):
        """Test that a player of the game finalizing an NPC CharacterPhoto upload gets 200."""
        response = self._valid_npc_patch(client, {'status': 'uploading'})
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.npc_upload.file_path

    def test_uploaded_status_sets_npc_photo_ready_for_player_of_game(self, client):
        """Test that status=uploaded sets NPC CharacterPhoto.ready for a player of the game."""
        self._valid_npc_patch(client, {'status': 'uploaded'})
        self.npc_photo.refresh_from_db()
        assert self.npc_photo.ready is True

    def test_player_of_game_returns_403_for_pc_upload(self, client):
        """Test that a player of the game cannot finalize a PC CharacterPhoto upload."""
        response = self._patch(
            client,
            self.pc_upload_by_player_of_game.id,
            {'status': 'uploading'},
            token=self.player_of_game_token,
            upload_token=self.pc_upload_by_player_of_game.token,
        )
        assert response.status_code == 403

    def test_unauthenticated_request_returns_401_for_treasure_upload(self, client):
        """Test that an unauthenticated request on a TreasurePhoto upload returns 401."""
        response = self._patch(
            client,
            self.treasure_upload.id,
            {'status': 'uploading'},
            upload_token=self.treasure_upload.token,
        )
        assert response.status_code == 401

    def test_non_superuser_returns_403_for_treasure_upload(self, client):
        """Test that a non-superuser is rejected on a TreasurePhoto upload with 403."""
        other_user = UserFactory(username='other', password='secret-password')
        other_token = Token.objects.create(user=other_user)
        self.treasure_upload.user = other_user
        Upload.objects.filter(pk=self.treasure_upload.pk).update(user=other_user)
        response = self._patch(
            client,
            self.treasure_upload.id,
            {'status': 'uploading'},
            token=other_token,
            upload_token=self.treasure_upload.token,
        )
        assert response.status_code == 403

    def test_uploading_status_returns_200_for_treasure_upload(self, client):
        """Test that status=uploading returns 200 for a TreasurePhoto-backed upload."""
        response = self._valid_treasure_patch(client, {'status': 'uploading'})
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.treasure_upload.file_path

    def test_uploaded_status_sets_treasure_photo_ready(self, client):
        """Test that status=uploaded sets TreasurePhoto.ready to True."""
        self._valid_treasure_patch(client, {'status': 'uploaded'})
        self.treasure_photo.refresh_from_db()
        assert self.treasure_photo.ready is True

    def test_uploaded_status_sets_treasure_photo(self, client):
        """Test that status=uploaded sets treasure.photo when it was unset."""
        self._valid_treasure_patch(client, {'status': 'uploaded'})
        self.treasure.refresh_from_db()
        assert self.treasure.photo == self.treasure_photo

    def test_uploaded_status_replaces_existing_treasure_photo(self, client):
        """Test that status=uploaded replaces an existing treasure.photo (no unset guard)."""
        existing_photo = TreasurePhoto.objects.create(
            treasure=self.treasure,
            path=f'photos/treasures/{self.treasure.id}/old.jpg',
            ready=True,
        )
        self.treasure.photo = existing_photo
        self.treasure.save()

        self._valid_treasure_patch(client, {'status': 'uploaded'})

        self.treasure.refresh_from_db()
        assert self.treasure.photo == self.treasure_photo
        assert self.treasure.photo != existing_photo
