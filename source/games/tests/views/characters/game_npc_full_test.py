"""Tests for the NPC full detail view."""

import json

import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from games.models import Character, Game, GameMaster, Player


@pytest.mark.django_db
class TestGameNpcFullView:

    """Tests for the NPC full detail endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.npc = Character.objects.create(
            name='Gandalf',
            game=self.game,
            role='Wizard',
            public_description='A wandering wizard.',
            private_description='The secret guardian of Middle Earth.',
            npc=True,
        )

    def _get(self, client, token=None):
        """Issue a GET request to the NPC full endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get(f'/games/test-game/npcs/{self.npc.id}/full.json', **extra)

    def test_returns_401_for_unauthenticated(self, client):
        """Test that unauthenticated request returns 401."""
        response = self._get(client)
        assert response.status_code == 401

    def test_returns_403_for_non_editor(self, client):
        """Test that authenticated non-editor returns 403."""
        other_user = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self._get(client, token=token)
        assert response.status_code == 403

    def test_returns_403_for_pc_player_who_is_not_dm(self, client):
        """Test that a PC player (not a DM) cannot access NPC full detail."""
        player = Player.objects.create(name='Alice')
        pc_user = User.objects.create_user(username='alice', password='secret-password')
        player.user = pc_user
        player.save()
        Character.objects.create(name='Frodo', game=self.game, player=player, npc=False)
        token = Token.objects.create(user=pc_user)
        response = self._get(client, token=token)
        assert response.status_code == 403

    def test_returns_200_with_descriptions_for_dm(self, client):
        """Test that a DM gets full detail including both descriptions."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['public_description'] == 'A wandering wizard.'
        assert data['private_description'] == 'The secret guardian of Middle Earth.'

    def test_returns_200_with_descriptions_for_superuser(self, client):
        """Test that a superuser gets full detail including both descriptions."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['public_description'] == 'A wandering wizard.'
        assert data['private_description'] == 'The secret guardian of Middle Earth.'

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        token = Token.objects.create(user=self.dm_user)
        response = client.get(
            '/games/test-game/npcs/99999/full.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 404

    def test_returns_404_for_pc_id(self, client):
        """Test that 404 is returned when the id belongs to a PC."""
        player = Player.objects.create(name='Alice')
        pc = Character.objects.create(name='Frodo', game=self.game, player=player, npc=False)
        token = Token.objects.create(user=self.dm_user)
        response = client.get(
            f'/games/test-game/npcs/{pc.id}/full.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 404
