"""Tests for the NPC photo detail (update-ready / delete) endpoint."""

import pytest
from rest_framework.authtoken.models import Token

from games.models import CharacterPhoto
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameNpcPhotoDetailView(TokenAuthRequestMixin):
    """Tests for PATCH/DELETE /games/<game_slug>/npcs/<character_id>/photos/<photo_id>.json."""

    def setup_method(self):
        """Set up a game, an NPC, a DM, a staff user, a superuser, and a photo."""
        self.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.photo = CharacterPhoto.objects.create(
            path='photos/games/epic-quest/characters/1/img1.jpg',
            character=self.character,
            ready=False,
        )
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.staff_user = UserFactory(
            username='staff_user', password='secret-password', is_staff=True,
        )
        self.superuser = SuperUserFactory(username='admin', password='secret-password')
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.staff_token = Token.objects.create(user=self.staff_user)
        self.superuser_token = Token.objects.create(user=self.superuser)

    def _url(self, character_id=None, photo_id=None):
        """Return the photo detail endpoint URL for the given character/photo id."""
        character_id = character_id if character_id is not None else self.character.id
        photo_id = photo_id if photo_id is not None else self.photo.id
        return f'/games/epic-quest/npcs/{character_id}/photos/{photo_id}.json'

    def _patch(self, client, token=None, character_id=None, photo_id=None):
        """Issue a PATCH request to the photo detail endpoint, optionally with a token."""
        return self.patch(
            client, self._url(character_id, photo_id), {'ready': False}, token=token
        )

    def _delete(self, client, token=None, character_id=None, photo_id=None):
        """Issue a DELETE request to the photo detail endpoint, optionally with a token."""
        return self.delete(client, self._url(character_id, photo_id), token=token)

    def test_patch_unauthenticated_request_returns_401(self, client):
        """Test that a PATCH request without a token is rejected with 401."""
        response = self._patch(client)
        assert response.status_code == 401

    def test_delete_unauthenticated_request_returns_401(self, client):
        """Test that a DELETE request without a token is rejected with 401."""
        response = self._delete(client)
        assert response.status_code == 401

    def test_patch_non_dm_player_of_game_returns_403(self, client):
        """Test that a non-DM player of the game is rejected with 403 on PATCH."""
        player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Alice', user=player_user, game=self.game)
        token = Token.objects.create(user=player_user)
        response = self._patch(client, token=token)
        assert response.status_code == 403

    def test_delete_non_dm_player_of_game_returns_403(self, client):
        """Test that a non-DM player of the game is rejected with 403 on DELETE."""
        player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Alice', user=player_user, game=self.game)
        token = Token.objects.create(user=player_user)
        response = self._delete(client, token=token)
        assert response.status_code == 403

    def test_owning_player_of_unrelated_pc_returns_403(self, client):
        """Test that owning a Player never grants edit access to an NPC's photo detail."""
        player = PlayerFactory(name='Bob')
        owner = UserFactory(username='owner', password='secret-password')
        player.user = owner
        player.save()
        CharacterFactory(name='Aragorn', game=self.game, player=player, npc=False)
        token = Token.objects.create(user=owner)
        response = self._delete(client, token=token)
        assert response.status_code == 403

    def test_patch_dm_returns_200(self, client):
        """Test that the game's DM can PATCH the photo to not-ready."""
        response = self._patch(client, token=self.dm_token)
        assert response.status_code == 200

    def test_patch_staff_returns_200(self, client):
        """Test that a staff user can PATCH the photo to not-ready."""
        response = self._patch(client, token=self.staff_token)
        assert response.status_code == 200

    def test_patch_superuser_returns_200(self, client):
        """Test that a superuser can PATCH the photo to not-ready."""
        response = self._patch(client, token=self.superuser_token)
        assert response.status_code == 200

    def test_patch_sets_photo_not_ready(self, client):
        """Test that PATCH marks the photo as not ready."""
        self.photo.ready = True
        self.photo.save()
        response = self._patch(client, token=self.dm_token)
        assert response.status_code == 200
        self.photo.refresh_from_db()
        assert self.photo.ready is False

    def test_patch_clears_photo_when_patched_photo_is_profile(self, client):
        """Test that PATCH clears photo when the patched photo was the profile photo."""
        self.character.photo = self.photo
        self.character.save()
        response = self._patch(client, token=self.dm_token)
        assert response.status_code == 200
        self.character.refresh_from_db()
        assert self.character.photo is None

    def test_patch_carries_skip_cache_header(self, client):
        """Test that the PATCH response carries the X-Skip-Cache: true header."""
        response = self._patch(client, token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_delete_dm_returns_204(self, client):
        """Test that the game's DM can delete a not-ready photo, receiving 204."""
        response = self._delete(client, token=self.dm_token)
        assert response.status_code == 204

    def test_delete_staff_returns_204(self, client):
        """Test that a staff user can delete a not-ready photo, receiving 204."""
        response = self._delete(client, token=self.staff_token)
        assert response.status_code == 204

    def test_delete_superuser_returns_204(self, client):
        """Test that a superuser can delete a not-ready photo, receiving 204."""
        response = self._delete(client, token=self.superuser_token)
        assert response.status_code == 204

    def test_delete_removes_photo_record(self, client):
        """Test that DELETE removes the photo's database record."""
        photo_id = self.photo.id
        response = self._delete(client, token=self.dm_token)
        assert response.status_code == 204
        assert not CharacterPhoto.objects.filter(id=photo_id).exists()

    def test_delete_carries_skip_cache_header(self, client):
        """Test that the DELETE response carries the X-Skip-Cache: true header."""
        response = self._delete(client, token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_delete_returns_422_when_photo_is_ready(self, client):
        """Test that deleting a photo still marked ready returns 422."""
        self.photo.ready = True
        self.photo.save()
        response = self._delete(client, token=self.dm_token)
        assert response.status_code == 422
        assert CharacterPhoto.objects.filter(id=self.photo.id).exists()

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        response = self._delete(client, token=self.dm_token, character_id=99999)
        assert response.status_code == 404

    def test_opposite_role_id_returns_404(self, client):
        """Test that an id belonging to the opposite role returns 404."""
        other = CharacterFactory(name='Other', game=self.game, npc=False)
        response = self._delete(client, token=self.dm_token, character_id=other.id)
        assert response.status_code == 404

    def test_unknown_photo_id_returns_404(self, client):
        """Test that a non-existent photo_id returns 404."""
        response = self._delete(client, token=self.dm_token, photo_id=99999)
        assert response.status_code == 404

    def test_photo_of_another_character_returns_404(self, client):
        """Test that a photo id belonging to a different character returns 404."""
        other_character = CharacterFactory(name='Legolas', game=self.game, npc=True)
        other_photo = CharacterPhoto.objects.create(
            path='photos/games/epic-quest/characters/2/img1.jpg', character=other_character
        )
        response = self._delete(client, token=self.dm_token, photo_id=other_photo.id)
        assert response.status_code == 404

    def test_unknown_game_slug_returns_404(self, client):
        """Test that an unknown game slug returns 404."""
        response = client.delete(
            f'/games/unknown-game/npcs/{self.character.id}/photos/{self.photo.id}.json',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )
        assert response.status_code == 404
