"""Tests for the PC/NPC full detail view (GET full detail / PATCH update).

The PATCH-endpoint tests below moved here from `game_character_detail_test.py` (issue #428):
the character update action now lives on `full.json` rather than the plain detail endpoint.
See `docs/agents/security-guidelines.md` section 8 for why
`test_patch_ignores_non_editable_fields` must stay.
"""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.models import CharacterLink
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    GameMasterFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)
from games.tests.views.support import assert_json_response


class _BaseCharacterFullViewTest(TokenAuthRequestMixin):
    """Shared behavior for the PC and NPC full detail endpoints."""

    npc = None
    segment = None
    character_name = None
    character_role = None
    public_description = None
    private_description = None

    def setup_method(self):
        """Set up a game, a DM, a player, and a character (NPC or PC)."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.player = PlayerFactory(name='Bob')
        self.character = CharacterFactory(
            name=self.character_name,
            game=self.game,
            player=None if self.npc else self.player,
            role=self.character_role,
            public_description=self.public_description,
            private_description=self.private_description,
            npc=self.npc,
        )

    def _editor_token(self):
        """Return a token belonging to a user allowed to view the full character detail."""
        raise NotImplementedError

    def _url(self, character_id=None):
        """Return the full-detail URL for the given character id (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/test-game/{self.segment}/{character_id}/full.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that unauthenticated request returns 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_returns_403_for_non_editor(self, client):
        """Test that authenticated non-editor returns 403."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 403

    def test_returns_200_with_descriptions_for_editor(self, client):
        """Test that an authorized editor gets full detail including both descriptions."""
        token = self._editor_token()
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['public_description'] == self.public_description
        assert data['private_description'] == self.private_description

    def test_returns_200_with_descriptions_for_dm(self, client):
        """Test that a DM gets full detail including both descriptions."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['public_description'] == self.public_description
        assert data['private_description'] == self.private_description

    def test_returns_200_with_descriptions_for_superuser(self, client):
        """Test that a superuser gets full detail including both descriptions."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['public_description'] == self.public_description
        assert data['private_description'] == self.private_description

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        token = self._editor_token()
        response = self.get(client, self._url(), token=token)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        token = self._editor_token()
        response = self.get(client, self._url(character_id=99999), token=token)
        assert response.status_code == 404


@pytest.mark.django_db
class TestGameNpcFullView(_BaseCharacterFullViewTest):
    """Tests for the NPC full detail endpoint."""

    npc = True
    segment = 'npcs'
    character_name = 'Gandalf'
    character_role = 'Wizard'
    public_description = 'A wandering wizard.'
    private_description = 'The secret guardian of Middle Earth.'

    def _editor_token(self):
        """Return the DM's token (a DM is the NPC's editor)."""
        return Token.objects.create(user=self.dm_user)

    def test_returns_403_for_pc_player_who_is_not_dm(self, client):
        """Test that a PC player (not a DM) cannot access NPC full detail."""
        pc_user = UserFactory(username='alice', password='secret-password')
        self.player.user = pc_user
        self.player.save()
        CharacterFactory(name='Frodo', game=self.game, player=self.player, npc=False)
        token = Token.objects.create(user=pc_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 403

    def test_returns_404_for_pc_id(self, client):
        """Test that 404 is returned when the id belongs to a PC."""
        pc = CharacterFactory(name='Frodo', game=self.game, player=self.player, npc=False)
        token = self._editor_token()
        response = self.get(client, self._url(character_id=pc.id), token=token)
        assert response.status_code == 404


@pytest.mark.django_db
class TestGamePcFullView(_BaseCharacterFullViewTest):
    """Tests for the PC full detail endpoint."""

    npc = False
    segment = 'pcs'
    character_name = 'Aragorn'
    character_role = 'Ranger'
    public_description = 'The future king of Gondor.'
    private_description = 'Secret heir to the throne.'

    def setup_method(self):
        """Set up a game, an owning player/user, a DM, and the PC."""
        super().setup_method()
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()

    def _editor_token(self):
        """Return the PC's owning player's user token."""
        return Token.objects.create(user=self.owner)

    def test_returns_404_for_npc_id(self, client):
        """Test that 404 is returned when the id belongs to an NPC."""
        npc = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        token = self._editor_token()
        response = self.get(client, self._url(character_id=npc.id), token=token)
        assert response.status_code == 404


class _BaseCharacterFullUpdateViewTest(TokenAuthRequestMixin):
    """Shared PATCH behavior for the PC and NPC full-detail update endpoints."""

    npc = None
    segment = None
    character_name = None
    character_role = None
    public_description = None
    private_description = None
    new_name = None
    new_role = None
    new_public_description = None
    new_private_description = None
    new_money = None

    def setup_method(self):
        """Set up a game, a DM, a player, and a character (NPC or PC)."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.player = PlayerFactory(name='Bob')
        self.character = CharacterFactory(
            name=self.character_name,
            game=self.game,
            player=None if self.npc else self.player,
            role=self.character_role,
            public_description=self.public_description,
            private_description=self.private_description,
            npc=self.npc,
        )

    def _editor_token(self):
        """Return a token belonging to a user allowed to edit the character."""
        raise NotImplementedError

    def _url(self):
        """Return the full-detail update URL for the fixture character."""
        return f'/games/test-game/{self.segment}/{self.character.id}/full.json'

    def _patch(self, client, payload, token=None):
        """Issue a PATCH request to the full-detail update endpoint, optionally with a token."""
        return self.patch(client, self._url(), payload, token=token)

    def test_patch_without_token_returns_401(self, client):
        """Test that PATCH without a token is rejected with 401."""
        response = self._patch(client, {'name': self.new_name})
        assert response.status_code == 401

    def test_patch_with_unrelated_user_returns_403(self, client):
        """Test that PATCH from an unrelated user's token is rejected with 403."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)

        response = self._patch(client, {'name': self.new_name}, token=token)

        assert response.status_code == 403
        self.character.refresh_from_db()
        assert self.character.name == self.character_name

    def test_patch_updates_multiple_fields(self, client):
        """Test that an authorized PATCH updates several editable fields in one request."""
        token = self._editor_token()

        response = self._patch(
            client,
            {
                'name': self.new_name,
                'role': self.new_role,
                'public_description': self.new_public_description,
                'private_description': self.new_private_description,
                'money': self.new_money,
            },
            token=token,
        )

        assert_json_response(response, 200, name=self.new_name, money=self.new_money)
        self.character.refresh_from_db()
        assert self.character.name == self.new_name
        assert self.character.private_description == self.new_private_description

    def test_patch_negative_money_returns_400(self, client):
        """Test that PATCH with a negative money value is rejected with 400."""
        token = self._editor_token()

        response = self._patch(client, {'money': -1}, token=token)

        data = assert_json_response(response, 400)
        assert 'money' in data['errors']
        self.character.refresh_from_db()
        assert self.character.money == 0

    def test_patch_ignores_non_editable_fields(self, client):
        """Test that fields outside the allowed set are silently ignored.

        This is the view-level regression test required for update serializers by
        docs/agents/security-guidelines.md section 8 — `game` here is a
        relationship/ownership field and must never be settable via a generic
        update payload.
        """
        token = self._editor_token()
        other_game = GameFactory(name='Other Game', game_slug='other-game')

        response = self._patch(
            client,
            {'name': self.new_name, 'npc': not self.npc, 'game': other_game.id},
            token=token,
        )

        assert response.status_code == 200
        self.character.refresh_from_db()
        assert self.character.name == self.new_name
        assert self.character.npc is self.npc
        assert self.character.game_id == self.game.id

    def test_patch_creates_link_via_links_payload(self, client):
        """Test that PATCH with a links entry without an id creates a new CharacterLink."""
        token = self._editor_token()

        response = self._patch(
            client,
            {'links': [{'text': 'Loot table', 'url': 'http://example.com/loot'}]},
            token=token,
        )

        data = assert_json_response(response, 200)
        assert any(link['url'] == 'http://example.com/loot' for link in data['links'])
        assert self.character.links.filter(url='http://example.com/loot').exists()

    def test_patch_updates_link_via_links_payload(self, client):
        """Test that PATCH with a links entry carrying an id updates the existing link."""
        token = self._editor_token()
        link = CharacterLink.objects.create(
            text='Old text', url='http://example.com/old', character=self.character,
        )

        response = self._patch(
            client,
            {'links': [{'id': link.id, 'text': 'New text', 'url': 'http://example.com/new'}]},
            token=token,
        )

        assert response.status_code == 200
        link.refresh_from_db()
        assert link.text == 'New text'
        assert link.url == 'http://example.com/new'

    def test_patch_deletes_link_via_links_payload(self, client):
        """Test that PATCH with a links entry marked delete=True deletes that link."""
        token = self._editor_token()
        link = CharacterLink.objects.create(
            text='Doomed', url='http://example.com/doomed', character=self.character,
        )

        response = self._patch(
            client, {'links': [{'id': link.id, 'delete': True}]}, token=token,
        )

        assert response.status_code == 200
        assert not CharacterLink.objects.filter(id=link.id).exists()

    def test_patch_rejects_link_missing_url(self, client):
        """Test that PATCH with a non-delete link entry missing a url returns 400."""
        token = self._editor_token()

        response = self._patch(client, {'links': [{'text': 'No url'}]}, token=token)

        data = assert_json_response(response, 400)
        assert 'links' in data['errors']

    def test_patch_cannot_edit_link_of_another_character(self, client):
        """Test that a link id belonging to a different character cannot be updated."""
        token = self._editor_token()
        other_character = CharacterFactory(name='Other', game=self.game, npc=self.npc)
        other_link = CharacterLink.objects.create(
            text='Not yours', url='http://example.com/other', character=other_character,
        )

        response = self._patch(
            client,
            {'links': [{'id': other_link.id, 'text': 'Hijacked'}]},
            token=token,
        )

        data = assert_json_response(response, 400)
        assert 'links' in data['errors']
        other_link.refresh_from_db()
        assert other_link.text == 'Not yours'

    def test_patch_rejects_delete_link_entry_without_id(self, client):
        """Test that a delete entry missing an id returns a clean 400, not a server error."""
        token = self._editor_token()

        response = self._patch(client, {'links': [{'delete': True}]}, token=token)

        data = assert_json_response(response, 400)
        assert 'links' in data['errors']

    def test_patch_rolls_back_other_links_when_one_entry_fails(self, client):
        """Test that a failing entry rolls back other link changes applied in the same request."""
        token = self._editor_token()
        other_character = CharacterFactory(name='Other', game=self.game, npc=self.npc)
        other_link = CharacterLink.objects.create(
            text='Not yours', url='http://example.com/other', character=other_character,
        )

        response = self._patch(
            client,
            {
                'links': [
                    {'text': 'New link', 'url': 'http://example.com/new'},
                    {'id': other_link.id, 'text': 'Hijacked'},
                ]
            },
            token=token,
        )

        assert response.status_code == 400
        assert not self.character.links.filter(url='http://example.com/new').exists()


@pytest.mark.django_db
class TestGameNpcFullUpdateView(_BaseCharacterFullUpdateViewTest):
    """Tests for the NPC full-detail update (PATCH) endpoint."""

    npc = True
    segment = 'npcs'
    character_name = 'Gandalf'
    character_role = 'Wizard'
    public_description = 'A wandering wizard.'
    private_description = 'The secret guardian of Middle Earth.'
    new_name = 'Saruman'
    new_role = 'Wizard'
    new_public_description = 'The White Wizard.'
    new_private_description = 'Secret wizard lore.'
    new_money = 200

    def _editor_token(self):
        """Return the DM's token (a DM is the NPC's editor)."""
        return Token.objects.create(user=self.dm_user)

    def test_patch_with_connected_player_user_returns_403(self, client):
        """Test that owning a Player never grants edit access to an NPC."""
        owner = UserFactory(username='owner', password='secret-password')
        self.player.user = owner
        self.player.save()
        token = Token.objects.create(user=owner)

        response = self._patch(client, {'name': self.new_name}, token=token)

        assert response.status_code == 403
        self.character.refresh_from_db()
        assert self.character.name == self.character_name

    def test_patch_allegiance_with_unrelated_user_returns_403(self, client):
        """Test that a non-editor cannot set allegiance/public_allegiance via PATCH."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)

        response = self._patch(
            client, {'allegiance': 'enemy', 'public_allegiance': 'ally'}, token=token
        )

        assert response.status_code == 403
        self.character.refresh_from_db()
        assert self.character.allegiance == 'neutral'
        assert self.character.public_allegiance == 'neutral'

    def test_patch_allegiance_by_dm_is_persisted(self, client):
        """Test that a DM/superuser can set both allegiance fields via PATCH."""
        token = self._editor_token()

        response = self._patch(
            client, {'allegiance': 'enemy', 'public_allegiance': 'ally'}, token=token
        )

        assert response.status_code == 200
        self.character.refresh_from_db()
        assert self.character.allegiance == 'enemy'
        assert self.character.public_allegiance == 'ally'

    def test_patch_slain_only_is_persisted_and_leaves_other_fields_untouched(self, client):
        """Test that PATCH with only {"slain": true} persists slain, leaving other fields alone."""
        token = self._editor_token()

        response = self._patch(client, {'slain': True}, token=token)

        assert response.status_code == 200
        self.character.refresh_from_db()
        assert self.character.slain is True
        assert self.character.name == self.character_name

    def test_patch_public_slain_only_is_persisted_and_leaves_other_fields_untouched(self, client):
        """Test that PATCH with only {"public_slain": true} persists it, leaving others alone."""
        token = self._editor_token()

        response = self._patch(client, {'public_slain': True}, token=token)

        assert response.status_code == 200
        self.character.refresh_from_db()
        assert self.character.public_slain is True
        assert self.character.name == self.character_name


@pytest.mark.django_db
class TestGamePcFullUpdateView(_BaseCharacterFullUpdateViewTest):
    """Tests for the PC full-detail update (PATCH) endpoint."""

    npc = False
    segment = 'pcs'
    character_name = 'Aragorn'
    character_role = 'Ranger'
    public_description = 'The future king of Gondor.'
    private_description = 'Secret heir to the throne.'
    new_name = 'Strider'
    new_role = 'Ranger King'
    new_public_description = 'King of Gondor.'
    new_private_description = 'Secret backstory.'
    new_money = 150

    def setup_method(self):
        """Set up a game, an owning player/user, a DM, and the PC."""
        super().setup_method()
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()

    def _editor_token(self):
        """Return the PC's owning player's user token."""
        return Token.objects.create(user=self.owner)

    def test_patch_with_superuser_token_returns_200(self, client):
        """Test that PATCH from a superuser's token is allowed."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = self._patch(client, {'name': self.new_name}, token=token)

        assert response.status_code == 200
        self.character.refresh_from_db()
        assert self.character.name == self.new_name
