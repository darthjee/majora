"""Tests for the NPC detail view (GET detail / PATCH update / hidden-NPC gate).

Field-level serialization (every field, every can_edit permutation) is covered by
`games/tests/serializers/test_character_detail.py` and `test_character_update.py`.
This module only owns what those serializer tests cannot: routing, status codes,
the request/token permission pipeline, and view-specific response shape (e.g.
headers). See `docs/agents/security-guidelines.md` section 8 for why
`test_patch_ignores_non_editable_fields` must stay.
"""

import json

import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from games.models import Character, Game, GameMaster, Player
from games.tests.views.support import assert_json_response


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
        assert_json_response(response, 200, name='Gandalf', game_slug='test-game')

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

    def test_can_edit_is_false_for_anonymous_request(self, client):
        """Test that can_edit is false when the request has no token."""
        response = client.get(f'/games/test-game/npcs/{self.npc.id}.json')
        assert_json_response(response, 200, can_edit=False)

    def test_can_edit_is_true_for_superuser(self, client):
        """Test that can_edit is true when the token belongs to a superuser."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = client.get(
            f'/games/test-game/npcs/{self.npc.id}.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert_json_response(response, 200, can_edit=True)

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

    def test_patch_with_superuser_token_updates_multiple_fields(self, client):
        """Test that a superuser's PATCH updates several editable fields in one request."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = self._patch(
            client,
            {
                'name': 'Saruman',
                'role': 'Wizard',
                'public_description': 'The White Wizard.',
                'private_description': 'Secret wizard lore.',
                'money': 200,
            },
            token=token,
        )

        assert_json_response(response, 200, name='Saruman', money=200)
        self.npc.refresh_from_db()
        assert self.npc.name == 'Saruman'
        assert self.npc.private_description == 'Secret wizard lore.'

    def test_patch_negative_money_returns_400(self, client):
        """Test that PATCH with a negative money value is rejected with 400."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = self._patch(client, {'money': -1}, token=token)

        data = assert_json_response(response, 400)
        assert 'money' in data['errors']
        self.npc.refresh_from_db()
        assert self.npc.money == 0

    def test_patch_ignores_non_editable_fields(self, client):
        """Test that fields outside the allowed set are silently ignored.

        This is the view-level regression test required for update serializers by
        docs/agents/security-guidelines.md section 8 — `game` here is a
        relationship/ownership field and must never be settable via a generic
        update payload.
        """
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


@pytest.mark.django_db
class TestGameNpcDetailHidden:
    """Tests for the hidden-NPC visibility gate in game_npc_detail.

    Kept in full: these are the access-control tests for NPC visibility, required
    to stay intact per docs/agents/security-guidelines.md section 8.
    """

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
        assert_json_response(response, 200, name='Secret NPC')

    def test_hidden_npc_returns_200_for_superuser(self, client):
        """Test that a superuser can access a hidden NPC detail."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = client.get(
            f'/games/test-game/npcs/{self.hidden_npc.id}.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert_json_response(response, 200, name='Secret NPC')

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

    def test_hidden_npc_404_response_includes_x_skip_cache_header_for_anonymous(self, client):
        """Test that an anonymous 404 response for a hidden NPC includes X-Skip-Cache: true."""
        response = client.get(f'/games/test-game/npcs/{self.hidden_npc.id}.json')
        assert response['X-Skip-Cache'] == 'true'
