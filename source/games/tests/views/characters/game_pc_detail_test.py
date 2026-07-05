"""Tests for the PC detail view (GET detail / PATCH update)."""

import json

import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from games.models import Character, CharacterPhoto, Game, Player


@pytest.mark.django_db
class TestGamePcDetailView:
    """Tests for the PC detail endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Bob')
        self.character = Character.objects.create(
            name='Aragorn',
            game=self.game,
            player=self.player,
            role='Ranger',
            public_description='The future king of Gondor.',
            npc=False,
        )

    def test_returns_character_detail(self, client):
        """Test that character detail is returned for a valid character_id."""
        response = client.get(f'/games/test-game/pcs/{self.character.id}.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Aragorn'
        assert data['role'] == 'Ranger'
        assert data['is_pc'] is True
        assert data['game_slug'] == 'test-game'

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get('/games/test-game/pcs/99999.json')
        assert response.status_code == 404

    def test_returns_404_for_character_in_wrong_game(self, client):
        """Test that 404 is returned when character belongs to a different game."""
        Game.objects.create(name='Other Game', game_slug='other-game')
        response = client.get(f'/games/other-game/pcs/{self.character.id}.json')
        assert response.status_code == 404

    def test_returns_404_for_npc_id(self, client):
        """Test that 404 is returned when the id belongs to an NPC."""
        npc = Character.objects.create(name='Gandalf', game=self.game, npc=True)
        response = client.get(f'/games/test-game/pcs/{npc.id}.json')
        assert response.status_code == 404

    def test_includes_photos(self, client):
        """Test that character detail includes associated photos."""
        photo = CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/aragorn.png', character=self.character
        )
        response = client.get(f'/games/test-game/pcs/{self.character.id}.json')
        data = json.loads(response.content)
        assert len(data['photos']) == 1
        assert data['photos'][0]['id'] == photo.id

    def test_role_is_null_when_not_set(self, client):
        """Test that role is null in the response when not set."""
        pc = Character.objects.create(
            name='Unnamed PC',
            game=self.game,
            player=self.player,
            role=None,
            npc=False,
        )
        response = client.get(f'/games/test-game/pcs/{pc.id}.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['role'] is None

    def test_can_edit_is_false_for_anonymous_request(self, client):
        """Test that can_edit is false when the request has no token."""
        response = client.get(f'/games/test-game/pcs/{self.character.id}.json')
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_can_edit_is_true_for_connected_player_user(self, client):
        """Test that can_edit is true when the token belongs to the character's player's user."""
        user = User.objects.create_user(username='owner', password='secret-password')
        self.player.user = user
        self.player.save()
        token = Token.objects.create(user=user)

        response = client.get(
            f'/games/test-game/pcs/{self.character.id}.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_can_edit_is_true_for_superuser(self, client):
        """Test that can_edit is true when the token belongs to a superuser."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = client.get(
            f'/games/test-game/pcs/{self.character.id}.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        data = json.loads(response.content)
        assert data['can_edit'] is True


@pytest.mark.django_db
class TestGamePcUpdateView:
    """Tests for the PC update (PATCH) endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Bob')
        self.owner = User.objects.create_user(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.character = Character.objects.create(
            name='Aragorn',
            game=self.game,
            player=self.player,
            role='Ranger',
            public_description='The future king of Gondor.',
            npc=False,
        )

    def _patch(self, client, payload, token=None):
        """Issue a PATCH request to the PC detail endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.patch(
            f'/games/test-game/pcs/{self.character.id}.json',
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_patch_without_token_returns_401(self, client):
        """Test that PATCH without a token is rejected with 401."""
        response = self._patch(client, {'name': 'Strider'})
        assert response.status_code == 401

    def test_patch_with_unrelated_user_returns_403(self, client):
        """Test that PATCH from an unrelated user's token is rejected with 403."""
        other_user = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)

        response = self._patch(client, {'name': 'Strider'}, token=token)

        assert response.status_code == 403
        self.character.refresh_from_db()
        assert self.character.name == 'Aragorn'

    def test_patch_with_owner_token_updates_character(self, client):
        """Test that PATCH from the connected player's user's token updates fields."""
        token = Token.objects.create(user=self.owner)

        response = self._patch(
            client,
            {
                'name': 'Strider',
                'role': 'Ranger King',
                'public_description': 'King of Gondor.',
            },
            token=token,
        )

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Strider'
        assert data['role'] == 'Ranger King'
        assert data['public_description'] == 'King of Gondor.'

        self.character.refresh_from_db()
        assert self.character.name == 'Strider'

    def test_patch_with_superuser_token_returns_200(self, client):
        """Test that PATCH from a superuser's token is allowed."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = self._patch(client, {'name': 'Strider'}, token=token)

        assert response.status_code == 200
        self.character.refresh_from_db()
        assert self.character.name == 'Strider'

    def test_patch_ignores_non_editable_fields(self, client):
        """Test that fields outside the allowed set are silently ignored."""
        token = Token.objects.create(user=self.owner)
        other_game = Game.objects.create(name='Other Game', game_slug='other-game')

        response = self._patch(
            client,
            {'name': 'Strider', 'npc': True, 'game': other_game.id},
            token=token,
        )

        assert response.status_code == 200
        self.character.refresh_from_db()
        assert self.character.name == 'Strider'
        assert self.character.npc is False
        assert self.character.game_id == self.game.id

    def test_patch_with_invalid_value_returns_400(self, client):
        """Test that an invalid field value is rejected with 400 and leaves data unchanged."""
        token = Token.objects.create(user=self.owner)

        response = self._patch(client, {'name': 'x' * 201}, token=token)

        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']
        self.character.refresh_from_db()
        assert self.character.name == 'Aragorn'

    def test_patch_partial_body_only_changes_given_fields(self, client):
        """Test that a partial PATCH body only updates the provided field."""
        token = Token.objects.create(user=self.owner)

        response = self._patch(client, {'name': 'Strider'}, token=token)

        assert response.status_code == 200
        self.character.refresh_from_db()
        assert self.character.name == 'Strider'
        assert self.character.role == 'Ranger'

    def test_patch_private_description_saves(self, client):
        """Test that PATCH with private_description saves the value."""
        token = Token.objects.create(user=self.owner)

        response = self._patch(client, {'private_description': 'Secret backstory.'}, token=token)

        assert response.status_code == 200
        self.character.refresh_from_db()
        assert self.character.private_description == 'Secret backstory.'

    def test_patch_money_saves(self, client):
        """Test that PATCH with money saves the value."""
        token = Token.objects.create(user=self.owner)

        response = self._patch(client, {'money': 150}, token=token)

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['money'] == 150
        self.character.refresh_from_db()
        assert self.character.money == 150

    def test_patch_negative_money_returns_400(self, client):
        """Test that PATCH with a negative money value is rejected with 400."""
        token = Token.objects.create(user=self.owner)

        response = self._patch(client, {'money': -1}, token=token)

        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'money' in data['errors']
        self.character.refresh_from_db()
        assert self.character.money == 0
