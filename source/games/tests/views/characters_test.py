"""Tests for character views."""

import json

import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from games.models import Character, Game, GameMaster, Photo, Player


@pytest.mark.django_db
class TestGamePcsView:
    """Tests for the game PCs list endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Alice')

    def test_returns_only_pcs(self, client):
        """Test that only characters with npc=False are returned."""
        Character.objects.create(name='Hero', game=self.game, player=self.player, npc=False)
        Character.objects.create(name='Villain', game=self.game)
        response = client.get('/games/test-game/pcs.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Hero'
        assert data[0]['game_slug'] == 'test-game'

    def test_returns_empty_list_when_no_pcs(self, client):
        """Test that an empty list is returned when there are no PCs."""
        response = client.get('/games/test-game/pcs.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_404_for_unknown_game(self, client):
        """Test that 404 is returned for a non-existent game_slug."""
        response = client.get('/games/unknown-game/pcs.json')
        assert response.status_code == 404

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get('/games/test-game/pcs.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get('/games/test-game/pcs.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get('/games/test-game/pcs.json?per_page=5')
        assert response['per_page'] == '5'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            Character.objects.create(
                name=f'Hero {i}', game=self.game, player=self.player, npc=False
            )
        response = client.get('/games/test-game/pcs.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_per_page_param(self, client):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            Character.objects.create(
                name=f'Hero {i}', game=self.game, player=self.player, npc=False
            )
        response = client.get('/games/test-game/pcs.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2


@pytest.mark.django_db
class TestGameNpcsView:
    """Tests for the game NPCs list endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Alice')

    def test_returns_only_npcs(self, client):
        """Test that only characters with npc=True are returned."""
        Character.objects.create(name='Hero', game=self.game, player=self.player, npc=False)
        Character.objects.create(name='Villain', game=self.game)
        response = client.get('/games/test-game/npcs.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Villain'
        assert data[0]['game_slug'] == 'test-game'

    def test_returns_empty_list_when_no_npcs(self, client):
        """Test that an empty list is returned when there are no NPCs."""
        response = client.get('/games/test-game/npcs.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get('/games/test-game/npcs.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get('/games/test-game/npcs.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get('/games/test-game/npcs.json?per_page=5')
        assert response['per_page'] == '5'

    def test_response_includes_total_header(self, client):
        """Test that the response includes the total item count header."""
        for i in range(3):
            Character.objects.create(name=f'NPC {i}', game=self.game, npc=True)
        response = client.get('/games/test-game/npcs.json')
        assert response['total'] == '3'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            Character.objects.create(name=f'NPC {i}', game=self.game, npc=True)
        response = client.get('/games/test-game/npcs.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_per_page_param(self, client):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            Character.objects.create(name=f'NPC {i}', game=self.game, npc=True)
        response = client.get('/games/test-game/npcs.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_default_page_size_uses_settings(self, client, monkeypatch):
        """Test that default per_page comes from Settings.pagination_size()."""
        monkeypatch.setenv('MAJORA_PAGINATION_SIZE', '3')
        for i in range(5):
            Character.objects.create(name=f'NPC {i}', game=self.game, npc=True)
        response = client.get('/games/test-game/npcs.json')
        assert response['per_page'] == '3'
        data = json.loads(response.content)
        assert len(data) == 3


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
            character_class='Wizard',
            level=20,
            public_description='A wandering wizard.',
            npc=True,
        )

    def test_returns_character_detail(self, client):
        """Test that character detail is returned for a valid character_id."""
        response = client.get(f'/games/test-game/npcs/{self.npc.id}.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Gandalf'
        assert data['character_class'] == 'Wizard'
        assert data['level'] == 20
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
        Photo.objects.create(url='http://example.com/gandalf.png', character=self.npc)
        response = client.get(f'/games/test-game/npcs/{self.npc.id}.json')
        data = json.loads(response.content)
        assert len(data['photos']) == 1
        assert data['photos'][0]['url'] == 'http://example.com/gandalf.png'

    def test_character_class_is_null_when_not_set(self, client):
        """Test that character_class is null in the response when not set."""
        npc = Character.objects.create(
            name='Unnamed NPC', game=self.game, character_class=None, npc=True
        )
        response = client.get(f'/games/test-game/npcs/{npc.id}.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['character_class'] is None

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
            character_class='Wizard',
            level=20,
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
                'avatar_url': 'http://example.com/saruman.png',
                'character_class': 'Wizard',
                'level': 25,
                'public_description': 'The White Wizard.',
            },
            token=token,
        )

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Saruman'
        assert data['avatar_url'] == 'http://example.com/saruman.png'
        assert data['character_class'] == 'Wizard'
        assert data['level'] == 25
        assert data['public_description'] == 'The White Wizard.'

        self.npc.refresh_from_db()
        assert self.npc.name == 'Saruman'
        assert self.npc.level == 25

    def test_patch_private_description_saves(self, client):
        """Test that PATCH with private_description saves the value."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = self._patch(client, {'private_description': 'Secret wizard lore.'}, token=token)

        assert response.status_code == 200
        self.npc.refresh_from_db()
        assert self.npc.private_description == 'Secret wizard lore.'

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

        response = self._patch(client, {'level': 'not-a-number'}, token=token)

        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'level' in data['errors']
        self.npc.refresh_from_db()
        assert self.npc.level == 20

    def test_patch_partial_body_only_changes_given_fields(self, client):
        """Test that a partial PATCH body only updates the provided field."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = self._patch(client, {'name': 'Saruman'}, token=token)

        assert response.status_code == 200
        self.npc.refresh_from_db()
        assert self.npc.name == 'Saruman'
        assert self.npc.character_class == 'Wizard'
        assert self.npc.level == 20
        assert self.npc.public_description == 'A wandering wizard.'


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
            character_class='Ranger',
            level=20,
            public_description='The future king of Gondor.',
            npc=False,
        )

    def test_returns_character_detail(self, client):
        """Test that character detail is returned for a valid character_id."""
        response = client.get(f'/games/test-game/pcs/{self.character.id}.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Aragorn'
        assert data['character_class'] == 'Ranger'
        assert data['level'] == 20
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
        Photo.objects.create(
            url='http://example.com/aragorn.png', character=self.character
        )
        response = client.get(f'/games/test-game/pcs/{self.character.id}.json')
        data = json.loads(response.content)
        assert len(data['photos']) == 1
        assert data['photos'][0]['url'] == 'http://example.com/aragorn.png'

    def test_character_class_is_null_when_not_set(self, client):
        """Test that character_class is null in the response when not set."""
        pc = Character.objects.create(
            name='Unnamed PC',
            game=self.game,
            player=self.player,
            character_class=None,
            npc=False,
        )
        response = client.get(f'/games/test-game/pcs/{pc.id}.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['character_class'] is None

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
            character_class='Ranger',
            level=20,
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
                'avatar_url': 'http://example.com/strider.png',
                'character_class': 'Ranger King',
                'level': 21,
                'public_description': 'King of Gondor.',
            },
            token=token,
        )

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Strider'
        assert data['avatar_url'] == 'http://example.com/strider.png'
        assert data['character_class'] == 'Ranger King'
        assert data['level'] == 21
        assert data['public_description'] == 'King of Gondor.'

        self.character.refresh_from_db()
        assert self.character.name == 'Strider'
        assert self.character.level == 21

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

        response = self._patch(client, {'level': 'not-a-number'}, token=token)

        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'level' in data['errors']
        self.character.refresh_from_db()
        assert self.character.level == 20

    def test_patch_partial_body_only_changes_given_fields(self, client):
        """Test that a partial PATCH body only updates the provided field."""
        token = Token.objects.create(user=self.owner)

        response = self._patch(client, {'name': 'Strider'}, token=token)

        assert response.status_code == 200
        self.character.refresh_from_db()
        assert self.character.name == 'Strider'
        assert self.character.character_class == 'Ranger'
        assert self.character.level == 20

    def test_patch_private_description_saves(self, client):
        """Test that PATCH with private_description saves the value."""
        token = Token.objects.create(user=self.owner)

        response = self._patch(client, {'private_description': 'Secret backstory.'}, token=token)

        assert response.status_code == 200
        self.character.refresh_from_db()
        assert self.character.private_description == 'Secret backstory.'


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
            character_class='Wizard',
            level=20,
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


@pytest.mark.django_db
class TestGamePcFullView:
    """Tests for the PC full detail endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Bob')
        self.owner = User.objects.create_user(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.character = Character.objects.create(
            name='Aragorn',
            game=self.game,
            player=self.player,
            character_class='Ranger',
            level=20,
            public_description='The future king of Gondor.',
            private_description='Secret heir to the throne.',
            npc=False,
        )

    def _get(self, client, token=None):
        """Issue a GET request to the PC full endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get(f'/games/test-game/pcs/{self.character.id}/full.json', **extra)

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

    def test_returns_200_with_descriptions_for_player_owner(self, client):
        """Test that the PC's owning player gets full detail including both descriptions."""
        token = Token.objects.create(user=self.owner)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['public_description'] == 'The future king of Gondor.'
        assert data['private_description'] == 'Secret heir to the throne.'

    def test_returns_200_with_descriptions_for_dm(self, client):
        """Test that a DM gets full detail including both descriptions."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['public_description'] == 'The future king of Gondor.'
        assert data['private_description'] == 'Secret heir to the throne.'

    def test_returns_200_with_descriptions_for_superuser(self, client):
        """Test that a superuser gets full detail including both descriptions."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['public_description'] == 'The future king of Gondor.'
        assert data['private_description'] == 'Secret heir to the throne.'

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        token = Token.objects.create(user=self.owner)
        response = client.get(
            '/games/test-game/pcs/99999/full.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 404

    def test_returns_404_for_npc_id(self, client):
        """Test that 404 is returned when the id belongs to an NPC."""
        npc = Character.objects.create(name='Gandalf', game=self.game, npc=True)
        token = Token.objects.create(user=self.owner)
        response = client.get(
            f'/games/test-game/pcs/{npc.id}/full.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 404


@pytest.mark.django_db
class TestGamePcAccessView:
    """Tests for the PC access endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Bob')
        self.owner = User.objects.create_user(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.character = Character.objects.create(
            name='Aragorn',
            game=self.game,
            player=self.player,
            npc=False,
        )

    def _get(self, client, token=None):
        """Issue a GET request to the PC access endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get(f'/games/test-game/pcs/{self.character.id}/access.json', **extra)

    def test_anonymous_returns_200_with_can_edit_false(self, client):
        """Test that an anonymous request returns 200 with can_edit false."""
        response = self._get(client)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_owner_returns_can_edit_true(self, client):
        """Test that the PC owner returns 200 with can_edit true."""
        token = Token.objects.create(user=self.owner)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_dm_returns_can_edit_true(self, client):
        """Test that the DM of the game returns 200 with can_edit true."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_superuser_returns_can_edit_true(self, client):
        """Test that a superuser returns 200 with can_edit true."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_unrelated_user_returns_can_edit_false(self, client):
        """Test that an unrelated user returns 200 with can_edit false."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._get(client)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_200_with_can_edit_false_for_unknown_character(self, client):
        """Test that 200 with can_edit false is returned for a non-existent character_id."""
        response = client.get('/games/test-game/pcs/99999/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_returns_200_with_can_edit_false_for_character_in_wrong_game(self, client):
        """Test that 200 with can_edit false is returned when character belongs to another game."""
        Game.objects.create(name='Other Game', game_slug='other-game')
        response = client.get(f'/games/other-game/pcs/{self.character.id}/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_returns_200_with_can_edit_false_for_npc_id(self, client):
        """Test that 200 with can_edit false is returned when the id belongs to an NPC."""
        npc = Character.objects.create(name='Gandalf', game=self.game, npc=True)
        response = client.get(f'/games/test-game/pcs/{npc.id}/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_dm_who_is_also_owner_returns_can_edit_true(self, client):
        """Test that a user who is both DM and character owner returns can_edit true."""
        dm_player = Player.objects.create(name='DM Player')
        dm_player.user = self.dm_user
        dm_player.save()
        self.character.player = dm_player
        self.character.save()
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_anonymous_returns_null_user_context_fields(self, client):
        """Test unauthenticated request returns null for username, is_superuser, is_dm, is_owner."""
        response = self._get(client)
        data = json.loads(response.content)
        assert data['username'] is None
        assert data['is_superuser'] is None
        assert data['is_dm'] is None
        assert data['is_owner'] is None

    def test_owner_returns_correct_user_context_fields(self, client):
        """Test that owner returns username, is_superuser=False, is_dm=False, is_owner=True."""
        token = Token.objects.create(user=self.owner)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'owner'
        assert data['is_superuser'] is False
        assert data['is_dm'] is False
        assert data['is_owner'] is True

    def test_dm_returns_correct_user_context_fields(self, client):
        """Test that DM returns username, is_superuser=False, is_dm=True, is_owner=False."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'dm_user'
        assert data['is_superuser'] is False
        assert data['is_dm'] is True
        assert data['is_owner'] is False

    def test_superuser_returns_correct_user_context_fields(self, client):
        """Test that superuser returns username, is_superuser=True, is_dm=False, is_owner=False."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'admin'
        assert data['is_superuser'] is True
        assert data['is_dm'] is False
        assert data['is_owner'] is False

    def test_unrelated_user_returns_correct_user_context_fields(self, client):
        """Test unrelated user returns username, is_superuser=False, is_dm=False, is_owner=False."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'other'
        assert data['is_superuser'] is False
        assert data['is_dm'] is False
        assert data['is_owner'] is False

    def test_owner_via_session_returns_can_edit_true(self, client):
        """Test that the PC owner authenticated via session cookie returns can_edit true."""
        token = Token.objects.create(user=self.owner)
        session = client.session
        session['auth_token'] = token.key
        session.save()
        response = client.get(f'/games/test-game/pcs/{self.character.id}/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_unrelated_user_via_session_returns_can_edit_false(self, client):
        """Test that an unrelated user authenticated via session cookie returns can_edit false."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        session = client.session
        session['auth_token'] = token.key
        session.save()
        response = client.get(f'/games/test-game/pcs/{self.character.id}/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False


@pytest.mark.django_db
class TestGameNpcAccessView:
    """Tests for the NPC access endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Alice')
        self.pc_owner = User.objects.create_user(username='pc_owner', password='secret-password')
        self.player.user = self.pc_owner
        self.player.save()
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        Character.objects.create(name='Frodo', game=self.game, player=self.player, npc=False)
        self.npc = Character.objects.create(
            name='Gandalf',
            game=self.game,
            npc=True,
        )

    def _get(self, client, token=None):
        """Issue a GET request to the NPC access endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get(f'/games/test-game/npcs/{self.npc.id}/access.json', **extra)

    def test_anonymous_returns_200_with_can_edit_false(self, client):
        """Test that an anonymous request returns 200 with can_edit false."""
        response = self._get(client)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_dm_returns_can_edit_true(self, client):
        """Test that the DM of the game returns 200 with can_edit true."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_superuser_returns_can_edit_true(self, client):
        """Test that a superuser returns 200 with can_edit true."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_player_owner_not_dm_returns_can_edit_false(self, client):
        """Test that a PC player (not a DM) returns 200 with can_edit false."""
        token = Token.objects.create(user=self.pc_owner)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_unrelated_user_returns_can_edit_false(self, client):
        """Test that an unrelated user returns 200 with can_edit false."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._get(client)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_200_with_can_edit_false_for_unknown_character(self, client):
        """Test that 200 with can_edit false is returned for a non-existent character_id."""
        response = client.get('/games/test-game/npcs/99999/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_returns_200_with_can_edit_false_for_character_in_wrong_game(self, client):
        """Test that 200 with can_edit false is returned when character belongs to another game."""
        Game.objects.create(name='Other Game', game_slug='other-game')
        response = client.get(f'/games/other-game/npcs/{self.npc.id}/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_returns_200_with_can_edit_false_for_pc_id(self, client):
        """Test that 200 with can_edit false is returned when the id belongs to a PC."""
        pc = Character.objects.create(
            name='Aragorn', game=self.game, player=self.player, npc=False
        )
        response = client.get(f'/games/test-game/npcs/{pc.id}/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_dm_who_is_also_pc_owner_returns_can_edit_true(self, client):
        """Test that a DM who also owns a PC in the game returns can_edit true for NPC."""
        dm_player = Player.objects.create(name='DM Player')
        dm_player.user = self.dm_user
        dm_player.save()
        Character.objects.create(name='DM PC', game=self.game, player=dm_player, npc=False)
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_anonymous_returns_null_user_context_fields(self, client):
        """Test that unauthenticated request returns null for username, is_superuser, is_dm."""
        response = self._get(client)
        data = json.loads(response.content)
        assert data['username'] is None
        assert data['is_superuser'] is None
        assert data['is_dm'] is None

    def test_dm_returns_correct_user_context_fields(self, client):
        """Test that DM returns username, is_superuser=False, is_dm=True."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'dm_user'
        assert data['is_superuser'] is False
        assert data['is_dm'] is True

    def test_superuser_returns_correct_user_context_fields(self, client):
        """Test that superuser returns username, is_superuser=True, is_dm=False."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'admin'
        assert data['is_superuser'] is True
        assert data['is_dm'] is False

    def test_non_dm_user_returns_correct_user_context_fields(self, client):
        """Test that non-DM authenticated user returns username, is_superuser=False, is_dm=False."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'other'
        assert data['is_superuser'] is False
        assert data['is_dm'] is False

    def test_dm_via_session_returns_can_edit_true(self, client):
        """Test that the DM authenticated via session cookie returns can_edit true."""
        token = Token.objects.create(user=self.dm_user)
        session = client.session
        session['auth_token'] = token.key
        session.save()
        response = client.get(f'/games/test-game/npcs/{self.npc.id}/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_non_dm_user_via_session_returns_can_edit_false(self, client):
        """Test that a non-DM user authenticated via session cookie returns can_edit false."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        session = client.session
        session['auth_token'] = token.key
        session.save()
        response = client.get(f'/games/test-game/npcs/{self.npc.id}/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False


@pytest.mark.django_db
class TestGameNpcsHiddenFilter:
    """Tests that game_npcs excludes hidden NPCs from the public listing."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')

    def test_hidden_npc_excluded_from_listing(self, client):
        """Test that an NPC with hidden=True is not returned by the public listing."""
        Character.objects.create(name='Visible NPC', game=self.game, npc=True, hidden=False)
        Character.objects.create(name='Hidden NPC', game=self.game, npc=True, hidden=True)
        response = client.get('/games/test-game/npcs.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Visible NPC'

    def test_visible_npc_included_in_listing(self, client):
        """Test that an NPC with hidden=False is returned by the public listing."""
        Character.objects.create(name='Visible NPC', game=self.game, npc=True, hidden=False)
        response = client.get('/games/test-game/npcs.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_total_header_excludes_hidden_npcs(self, client):
        """Test that the total header reflects only visible NPCs."""
        Character.objects.create(name='Visible NPC', game=self.game, npc=True, hidden=False)
        Character.objects.create(name='Hidden NPC', game=self.game, npc=True, hidden=True)
        response = client.get('/games/test-game/npcs.json')
        assert response['total'] == '1'


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


@pytest.mark.django_db
class TestGameNpcsAllView:
    """Tests for the game_npcs_all endpoint (DM/superuser only, includes hidden NPCs)."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.visible_npc = Character.objects.create(
            name='Visible NPC', game=self.game, npc=True, hidden=False
        )
        self.hidden_npc = Character.objects.create(
            name='Hidden NPC', game=self.game, npc=True, hidden=True
        )

    def _get(self, client, token=None):
        """Issue a GET request to the npcs/all endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get('/games/test-game/npcs/all.json', **extra)

    def test_returns_401_for_unauthenticated(self, client):
        """Test that unauthenticated request returns 401."""
        response = self._get(client)
        assert response.status_code == 401

    def test_returns_403_for_non_dm_authenticated_user(self, client):
        """Test that an authenticated user who is not a DM gets 403."""
        other_user = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self._get(client, token=token)
        assert response.status_code == 403

    def test_returns_200_for_dm_with_all_npcs(self, client):
        """Test that a DM gets 200 with both visible and hidden NPCs."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Visible NPC' in names
        assert 'Hidden NPC' in names

    def test_returns_200_for_superuser_with_all_npcs(self, client):
        """Test that a superuser gets 200 with both visible and hidden NPCs."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_returns_404_for_unknown_game(self, client):
        """Test that 404 is returned for a non-existent game_slug."""
        token = Token.objects.create(user=self.dm_user)
        response = client.get(
            '/games/unknown-game/npcs/all.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 404

    def test_response_includes_pagination_headers(self, client):
        """Test that the response includes page/pages/per_page/total headers."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response['page'] == '1'
        assert response['pages'] == '1'
        assert 'per_page' in response
        assert response['total'] == '2'

    def test_does_not_include_pcs(self, client):
        """Test that the endpoint only returns NPCs, not PCs."""
        player = Player.objects.create(name='Alice')
        Character.objects.create(name='Alice PC', game=self.game, player=player, npc=False)
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Alice PC' not in names
