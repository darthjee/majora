"""Tests for games app views."""

import json

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import Character, Game, GameMaster, Link, Photo, Player


@pytest.mark.django_db
class TestGamesListView:
    """Tests for the games list endpoint."""

    def test_returns_empty_list(self, client):
        """Test that an empty list is returned when no games exist."""
        response = client.get('/games.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_games(self, client):
        """Test that created games are returned in the list."""
        Game.objects.create(name='Game One', game_slug='game-one')
        Game.objects.create(name='Game Two', game_slug='game-two')
        response = client.get('/games.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2
        slugs = [g['game_slug'] for g in data]
        assert 'game-one' in slugs
        assert 'game-two' in slugs

    def test_returns_photo_field(self, client):
        """Test that the photo field is included in the list response."""
        Game.objects.create(name='Visual Game', game_slug='visual-game', photo='http://example.com/cover.png')
        response = client.get('/games.json')
        data = json.loads(response.content)
        assert data[0]['photo'] == 'http://example.com/cover.png'

    def test_photo_field_is_null_when_not_set(self, client):
        """Test that photo is null in the response when not set."""
        Game.objects.create(name='No Photo', game_slug='no-photo')
        response = client.get('/games.json')
        data = json.loads(response.content)
        assert data[0]['photo'] is None

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('games-list')
        response = client.get(url)
        assert response.status_code == 200

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get('/games.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get('/games.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get('/games.json?per_page=5')
        assert response['per_page'] == '5'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            Game.objects.create(name=f'Game {i}', game_slug=f'game-{i}')
        response = client.get('/games.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_per_page_param(self, client):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            Game.objects.create(name=f'Game {i}', game_slug=f'game-{i}')
        response = client.get('/games.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2


@pytest.mark.django_db
class TestGameDetailView:
    """Tests for the game detail endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Epic Quest', game_slug='epic-quest')

    def test_returns_game_detail(self, client):
        """Test that game detail is returned for a valid game_slug."""
        response = client.get('/games/epic-quest.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Epic Quest'
        assert data['game_slug'] == 'epic-quest'
        assert 'photo' in data

    def test_returns_description_field(self, client):
        """Test that description is included in the detail response."""
        self.game.description = 'A heroic adventure in Middle Earth.'
        self.game.save()
        response = client.get('/games/epic-quest.json')
        data = json.loads(response.content)
        assert data['description'] == 'A heroic adventure in Middle Earth.'

    def test_description_is_empty_string_when_not_set(self, client):
        """Test that description defaults to empty string."""
        response = client.get('/games/epic-quest.json')
        data = json.loads(response.content)
        assert data['description'] == ''

    def test_returns_404_for_unknown_slug(self, client):
        """Test that 404 is returned for a non-existent game_slug."""
        response = client.get('/games/unknown-game.json')
        assert response.status_code == 404

    def test_includes_links(self, client):
        """Test that game detail includes associated links."""
        Link.objects.create(text='Rulebook', url='http://example.com/rules', game=self.game)
        response = client.get('/games/epic-quest.json')
        data = json.loads(response.content)
        assert len(data['links']) == 1
        assert data['links'][0]['text'] == 'Rulebook'


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
class TestGameMastersListView:
    """Tests for the game masters list endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.user = User.objects.create_user(username='dm_user', password='secret-password')

    def _get(self, client, game_slug=None):
        url = f'/games/{game_slug or self.game.game_slug}/game-masters.json'
        return client.get(url)

    def _post(self, client, token=None, game_slug=None):
        url = f'/games/{game_slug or self.game.game_slug}/game-masters.json'
        headers = {'HTTP_AUTHORIZATION': f'Token {token}'} if token else {}
        return client.post(url, content_type='application/json', **headers)

    def test_get_returns_empty_list(self, client):
        """Test that an empty list is returned when no game masters exist."""
        response = self._get(client)
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_get_returns_game_masters(self, client):
        """Test that existing game masters are returned."""
        GameMaster.objects.create(game=self.game, user=self.user)
        response = self._get(client)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['user'] == self.user.id

    def test_get_returns_404_for_unknown_game(self, client):
        """Test that 404 is returned for an unknown game slug."""
        response = self._get(client, game_slug='unknown-game')
        assert response.status_code == 404

    def test_post_requires_authentication(self, client):
        """Test that POST returns 401 when unauthenticated."""
        response = self._post(client)
        assert response.status_code == 401

    def test_post_creates_game_master(self, client):
        """Test that POST creates a new game master assignment."""
        token = Token.objects.create(user=self.user)
        response = self._post(client, token=token)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert data['user'] == self.user.id
        assert GameMaster.objects.filter(game=self.game, user=self.user).exists()

    def test_post_returns_400_when_already_game_master(self, client):
        """Test that POST returns 400 when user is already a game master."""
        GameMaster.objects.create(game=self.game, user=self.user)
        token = Token.objects.create(user=self.user)
        response = self._post(client, token=token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_post_returns_404_for_unknown_game(self, client):
        """Test that POST returns 404 for an unknown game slug."""
        token = Token.objects.create(user=self.user)
        response = self._post(client, token=token, game_slug='unknown-game')
        assert response.status_code == 404


@pytest.mark.django_db
class TestGameMasterDetailView:
    """Tests for the game master detail (DELETE) endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.user = User.objects.create_user(username='dm_user', password='secret-password')
        self.game_master = GameMaster.objects.create(game=self.game, user=self.user)

    def _delete(self, client, token=None, game_master_id=None):
        gm_id = game_master_id if game_master_id is not None else self.game_master.id
        url = f'/games/{self.game.game_slug}/game-masters/{gm_id}.json'
        headers = {'HTTP_AUTHORIZATION': f'Token {token}'} if token else {}
        return client.delete(url, **headers)

    def test_delete_requires_authentication(self, client):
        """Test that DELETE returns 401 when unauthenticated."""
        response = self._delete(client)
        assert response.status_code == 401

    def test_delete_removes_game_master(self, client):
        """Test that DELETE removes the game master assignment."""
        token = Token.objects.create(user=self.user)
        response = self._delete(client, token=token)
        assert response.status_code == 204
        assert not GameMaster.objects.filter(id=self.game_master.id).exists()

    def test_delete_by_superuser_removes_any_game_master(self, client):
        """Test that a superuser can delete any game master assignment."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._delete(client, token=token)
        assert response.status_code == 204
        assert not GameMaster.objects.filter(id=self.game_master.id).exists()

    def test_delete_by_other_user_returns_403(self, client):
        """Test that a non-superuser who is not the DM cannot delete the assignment."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._delete(client, token=token)
        assert response.status_code == 403

    def test_delete_returns_404_for_unknown_id(self, client):
        """Test that DELETE returns 404 for an unknown game master id."""
        token = Token.objects.create(user=self.user)
        response = self._delete(client, token=token, game_master_id=99999)
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

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get('/games/test-game/pcs/99999/access.json')
        assert response.status_code == 404

    def test_returns_404_for_character_in_wrong_game(self, client):
        """Test that 404 is returned when character belongs to a different game."""
        Game.objects.create(name='Other Game', game_slug='other-game')
        response = client.get(f'/games/other-game/pcs/{self.character.id}/access.json')
        assert response.status_code == 404

    def test_returns_404_for_npc_id(self, client):
        """Test that 404 is returned when the id belongs to an NPC."""
        npc = Character.objects.create(name='Gandalf', game=self.game, npc=True)
        response = client.get(f'/games/test-game/pcs/{npc.id}/access.json')
        assert response.status_code == 404


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

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get('/games/test-game/npcs/99999/access.json')
        assert response.status_code == 404

    def test_returns_404_for_character_in_wrong_game(self, client):
        """Test that 404 is returned when character belongs to a different game."""
        Game.objects.create(name='Other Game', game_slug='other-game')
        response = client.get(f'/games/other-game/npcs/{self.npc.id}/access.json')
        assert response.status_code == 404

    def test_returns_404_for_pc_id(self, client):
        """Test that 404 is returned when the id belongs to a PC."""
        pc = Character.objects.create(
            name='Aragorn', game=self.game, player=self.player, npc=False
        )
        response = client.get(f'/games/test-game/npcs/{pc.id}/access.json')
        assert response.status_code == 404
