"""Tests for the NPC detail view (GET detail / PATCH update / hidden-NPC gate)."""

import json

import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from games.models import Character, CharacterPhoto, Game, GameMaster, Player


@pytest.mark.django_db
class TestGameNpcDetailView:
    """Tests for the NPC detail endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Bob')
        self.npc = Character.objects.create(
            name='Gandalf',
            game=self.game,
            role='Wizard',
            public_description='A wandering wizard.',
            npc=True,
        )

    def test_returns_character_detail(self, client):
        """Test that character detail is returned for a valid character_id."""
        response = client.get(f'/games/test-game/npcs/{self.npc.id}.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Gandalf'
        assert data['role'] == 'Wizard'
        assert data['is_pc'] is False
        assert data['game_slug'] == 'test-game'

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get('/games/test-game/npcs/99999.json')
        assert response.status_code == 404

    def test_returns_404_for_character_in_wrong_game(self, client):
        """Test that 404 is returned when character belongs to a different game."""
        Game.objects.create(name='Other Game', game_slug='other-game')
        response = client.get(f'/games/other-game/npcs/{self.npc.id}.json')
        assert response.status_code == 404

    def test_returns_404_for_pc_id(self, client):
        """Test that 404 is returned when the id belongs to a PC."""
        pc = Character.objects.create(
            name='Aragorn', game=self.game, player=self.player, npc=False
        )
        response = client.get(f'/games/test-game/npcs/{pc.id}.json')
        assert response.status_code == 404

    def test_includes_photos(self, client):
        """Test that character detail includes associated photos."""
        photo = CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/gandalf.png', character=self.npc
        )
        response = client.get(f'/games/test-game/npcs/{self.npc.id}.json')
        data = json.loads(response.content)
        assert len(data['photos']) == 1
        assert data['photos'][0]['id'] == photo.id

    def test_role_is_null_when_not_set(self, client):
        """Test that role is null in the response when not set."""
        npc = Character.objects.create(
            name='Unnamed NPC', game=self.game, role=None, npc=True
        )
        response = client.get(f'/games/test-game/npcs/{npc.id}.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['role'] is None

    def test_can_edit_is_false_for_anonymous_request(self, client):
        """Test that can_edit is false when the request has no token."""
        response = client.get(f'/games/test-game/npcs/{self.npc.id}.json')
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_can_edit_is_false_for_regular_user_with_connected_player(self, client):
        """Test that can_edit is false for a regular user even if they own a Player."""
        user = User.objects.create_user(username='owner', password='secret-password')
        self.player.user = user
        self.player.save()
        token = Token.objects.create(user=user)

        response = client.get(
            f'/games/test-game/npcs/{self.npc.id}.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_can_edit_is_true_for_superuser(self, client):
        """Test that can_edit is true when the token belongs to a superuser."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = client.get(
            f'/games/test-game/npcs/{self.npc.id}.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = client.get(f'/games/test-game/npcs/{self.npc.id}.json')
        assert response['X-Skip-Cache'] == 'true'


@pytest.mark.django_db
class TestGameNpcUpdateView:
    """Tests for the NPC update (PATCH) endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Bob')
        self.npc = Character.objects.create(
            name='Gandalf',
            game=self.game,
            role='Wizard',
            public_description='A wandering wizard.',
            npc=True,
        )

    def _patch(self, client, payload, token=None):
        """Issue a PATCH request to the NPC detail endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.patch(
            f'/games/test-game/npcs/{self.npc.id}.json',
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_patch_without_token_returns_401(self, client):
        """Test that PATCH without a token is rejected with 401."""
        response = self._patch(client, {'name': 'Saruman'})
        assert response.status_code == 401

    def test_patch_with_regular_user_returns_403(self, client):
        """Test that PATCH from a regular (non-superuser) user's token is rejected with 403."""
        other_user = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)

        response = self._patch(client, {'name': 'Saruman'}, token=token)

        assert response.status_code == 403
        self.npc.refresh_from_db()
        assert self.npc.name == 'Gandalf'

    def test_patch_with_connected_player_user_returns_403(self, client):
        """Test that owning a Player never grants edit access to an NPC."""
        owner = User.objects.create_user(username='owner', password='secret-password')
        self.player.user = owner
        self.player.save()
        token = Token.objects.create(user=owner)

        response = self._patch(client, {'name': 'Saruman'}, token=token)

        assert response.status_code == 403
        self.npc.refresh_from_db()
        assert self.npc.name == 'Gandalf'

    def test_patch_with_superuser_token_returns_200(self, client):
        """Test that PATCH from a superuser's token is allowed."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = self._patch(
            client,
            {
                'name': 'Saruman',
                'role': 'Wizard',
                'public_description': 'The White Wizard.',
            },
            token=token,
        )

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Saruman'
        assert data['role'] == 'Wizard'
        assert data['public_description'] == 'The White Wizard.'

        self.npc.refresh_from_db()
        assert self.npc.name == 'Saruman'

    def test_patch_private_description_saves(self, client):
        """Test that PATCH with private_description saves the value."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = self._patch(client, {'private_description': 'Secret wizard lore.'}, token=token)

        assert response.status_code == 200
        self.npc.refresh_from_db()
        assert self.npc.private_description == 'Secret wizard lore.'

    def test_patch_money_saves(self, client):
        """Test that PATCH with money saves the value."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = self._patch(client, {'money': 200}, token=token)

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['money'] == 200
        self.npc.refresh_from_db()
        assert self.npc.money == 200

    def test_patch_negative_money_returns_400(self, client):
        """Test that PATCH with a negative money value is rejected with 400."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = self._patch(client, {'money': -1}, token=token)

        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'money' in data['errors']
        self.npc.refresh_from_db()
        assert self.npc.money == 0

    def test_patch_ignores_non_editable_fields(self, client):
        """Test that fields outside the allowed set are silently ignored."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        other_game = Game.objects.create(name='Other Game', game_slug='other-game')

        response = self._patch(
            client,
            {'name': 'Saruman', 'npc': False, 'game': other_game.id},
            token=token,
        )

        assert response.status_code == 200
        self.npc.refresh_from_db()
        assert self.npc.name == 'Saruman'
        assert self.npc.npc is True
        assert self.npc.game_id == self.game.id

    def test_patch_with_invalid_value_returns_400(self, client):
        """Test that an invalid field value is rejected with 400 and leaves data unchanged."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = self._patch(client, {'name': 'x' * 201}, token=token)

        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']
        self.npc.refresh_from_db()
        assert self.npc.name == 'Gandalf'

    def test_patch_partial_body_only_changes_given_fields(self, client):
        """Test that a partial PATCH body only updates the provided field."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = self._patch(client, {'name': 'Saruman'}, token=token)

        assert response.status_code == 200
        self.npc.refresh_from_db()
        assert self.npc.name == 'Saruman'
        assert self.npc.role == 'Wizard'
        assert self.npc.public_description == 'A wandering wizard.'


@pytest.mark.django_db
class TestGameNpcDetailHidden:
    """Tests for the hidden-NPC visibility gate in game_npc_detail."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.hidden_npc = Character.objects.create(
            name='Secret NPC', game=self.game, npc=True, hidden=True
        )

    def test_hidden_npc_returns_404_for_anonymous(self, client):
        """Test that an anonymous request to a hidden NPC gets 404."""
        response = client.get(f'/games/test-game/npcs/{self.hidden_npc.id}.json')
        assert response.status_code == 404

    def test_hidden_npc_returns_404_for_regular_user(self, client):
        """Test that a non-DM authenticated user gets 404 for a hidden NPC."""
        other_user = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = client.get(
            f'/games/test-game/npcs/{self.hidden_npc.id}.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 404

    def test_hidden_npc_returns_200_for_dm(self, client):
        """Test that a DM can access a hidden NPC detail."""
        token = Token.objects.create(user=self.dm_user)
        response = client.get(
            f'/games/test-game/npcs/{self.hidden_npc.id}.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Secret NPC'

    def test_hidden_npc_returns_200_for_superuser(self, client):
        """Test that a superuser can access a hidden NPC detail."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = client.get(
            f'/games/test-game/npcs/{self.hidden_npc.id}.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Secret NPC'

    def test_visible_npc_returns_200_for_anonymous(self, client):
        """Test that a visible NPC is still accessible to anonymous users."""
        visible_npc = Character.objects.create(
            name='Visible NPC', game=self.game, npc=True, hidden=False
        )
        response = client.get(f'/games/test-game/npcs/{visible_npc.id}.json')
        assert response.status_code == 200

    def test_hidden_npc_response_includes_x_skip_cache_header_for_dm(self, client):
        """Test that a DM's response for a hidden NPC includes X-Skip-Cache: true."""
        token = Token.objects.create(user=self.dm_user)
        response = client.get(
            f'/games/test-game/npcs/{self.hidden_npc.id}.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response['X-Skip-Cache'] == 'true'
