"""Tests for the NPC photo deletable-check endpoint."""

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
class TestGameNpcPhotoDeletableView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/npcs/<character_id>/photos/<photo_id>/deletable.json."""

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
        """Return the deletable endpoint URL for the given character/photo id."""
        character_id = character_id if character_id is not None else self.character.id
        photo_id = photo_id if photo_id is not None else self.photo.id
        return f'/games/epic-quest/npcs/{character_id}/photos/{photo_id}/deletable.json'

    def _get(self, client, token=None, character_id=None, photo_id=None):
        """Issue a GET request to the deletable endpoint, optionally with a token."""
        return self.get(client, self._url(character_id, photo_id), token=token)

    def test_unauthenticated_request_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._get(client)
        assert response.status_code == 401

    def test_non_dm_player_of_game_returns_403(self, client):
        """Test that a non-DM player of the game is rejected with 403."""
        player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Alice', user=player_user, game=self.game)
        token = Token.objects.create(user=player_user)
        response = self._get(client, token=token)
        assert response.status_code == 403

    def test_owning_player_of_unrelated_pc_returns_403(self, client):
        """Test that owning a Player never grants access to an NPC's photo deletable check."""
        player = PlayerFactory(name='Bob')
        owner = UserFactory(username='owner', password='secret-password')
        player.user = owner
        player.save()
        CharacterFactory(name='Aragorn', game=self.game, player=player, npc=False)
        token = Token.objects.create(user=owner)
        response = self._get(client, token=token)
        assert response.status_code == 403

    def test_dm_returns_200(self, client):
        """Test that the game's DM sees the photo as deletable."""
        response = self._get(client, token=self.dm_token)
        assert response.status_code == 200

    def test_staff_returns_200(self, client):
        """Test that a staff user sees the photo as deletable."""
        response = self._get(client, token=self.staff_token)
        assert response.status_code == 200

    def test_superuser_returns_200(self, client):
        """Test that a superuser sees the photo as deletable."""
        response = self._get(client, token=self.superuser_token)
        assert response.status_code == 200

    def test_returns_deletable_true_and_path_when_ready_is_false(self, client):
        """Test that a 200 response includes deletable=true and the photo's path."""
        response = self._get(client, token=self.dm_token)
        assert response.status_code == 200
        assert response.data == {'deletable': True, 'path': self.photo.path}

    def test_returns_422_when_ready_is_true(self, client):
        """Test that a photo still marked ready returns 422."""
        self.photo.ready = True
        self.photo.save()
        response = self._get(client, token=self.dm_token)
        assert response.status_code == 422

    def test_carries_skip_cache_header(self, client):
        """Test that the response carries the X-Skip-Cache: true header."""
        response = self._get(client, token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        response = self._get(client, token=self.dm_token, character_id=99999)
        assert response.status_code == 404

    def test_opposite_role_id_returns_404(self, client):
        """Test that an id belonging to the opposite role returns 404."""
        other = CharacterFactory(name='Other', game=self.game, npc=False)
        response = self._get(client, token=self.dm_token, character_id=other.id)
        assert response.status_code == 404

    def test_unknown_photo_id_returns_404(self, client):
        """Test that a non-existent photo_id returns 404."""
        response = self._get(client, token=self.dm_token, photo_id=99999)
        assert response.status_code == 404

    def test_photo_of_another_character_returns_404(self, client):
        """Test that a photo id belonging to a different character returns 404."""
        other_character = CharacterFactory(name='Legolas', game=self.game, npc=True)
        other_photo = CharacterPhoto.objects.create(
            path='photos/games/epic-quest/characters/2/img1.jpg', character=other_character
        )
        response = self._get(client, token=self.dm_token, photo_id=other_photo.id)
        assert response.status_code == 404

    def test_unknown_game_slug_returns_404(self, client):
        """Test that an unknown game slug returns 404."""
        response = client.get(
            f'/games/unknown-game/npcs/{self.character.id}/photos/{self.photo.id}/deletable.json',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )
        assert response.status_code == 404


@pytest.mark.django_db
class TestGameNpcPhotoDeletableHiddenCharacter(TokenAuthRequestMixin):
    """Tests confirming the deletable-check endpoint ignores a hidden NPC's hidden state."""

    def setup_method(self):
        """Set up a game, a hidden NPC, a DM, and a photo."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.character = CharacterFactory(
            name='Secret NPC', game=self.game, npc=True, hidden=True,
        )
        self.photo = CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/img1.jpg',
            character=self.character,
            ready=False,
        )

    def _url(self):
        """Return the deletable endpoint URL for the hidden character's photo."""
        return f'/games/test-game/npcs/{self.character.id}/photos/{self.photo.id}/deletable.json'

    def test_dm_can_check_deletable_for_hidden_npc(self, client):
        """Test that a DM can check deletability for a hidden NPC's photo."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200

    def test_non_dm_player_of_game_returns_403_for_hidden_npc(self, client):
        """Test that a non-DM player of the game is rejected with 403 for a hidden NPC's photo."""
        player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Alice', user=player_user, game=self.game)
        token = Token.objects.create(user=player_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 403

    def test_anonymous_returns_401_for_hidden_npc(self, client):
        """Test that an anonymous request for a hidden NPC's photo returns 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401
