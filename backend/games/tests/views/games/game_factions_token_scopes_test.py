"""End-to-end tests for the `@token_scopes` declarations of the faction views (issue #1634)."""

import pytest
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from games.models import CharacterFaction
from games.tests.factories import (
    CharacterFactory,
    GameFactionFactory,
    GameFactory,
    UserFactory,
)
from games.tests.views.game._scoped_token_fixtures import ScopedTokenMixin

ALL_READ_SCOPES = ['factions:read', 'pcs:read', 'npcs:read']
ALL_FACTION_SCOPES = ['factions:read', 'factions:write', 'pcs:read', 'npcs:read']


class FactionScopedTokenMixin(ScopedTokenMixin):
    """Shared fixtures: a game with a DM, a player and an outsider, and a faction with members."""

    def setup_method(self):
        """Set up the game, its members, an outsider, the faction and its characters."""
        self.client = APIClient()
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.other_game = GameFactory(name='Other Game', game_slug='other-game')
        self.dm = self._member('dm', is_dm=True).user
        self.player = self._member('player').user
        self.outsider = UserFactory(username='outsider', password='secret-password')
        self.faction = GameFactionFactory(game=self.game, name='The Silver Hand')
        self.hidden_npc = self._faction_member('Secret NPC', npc=True, hidden=True)
        self._faction_member('Aragorn', npc=False)
        self._faction_member('Barkeep', npc=True)
        self._faction_member('Secret PC', npc=False, hidden=True)

    def _faction_member(self, name, npc, hidden=False):
        """Create a character of the fixture game and attach it to the faction."""
        character = CharacterFactory(name=name, game=self.game, npc=npc, hidden=hidden)
        CharacterFaction.objects.create(character=character, game_faction=self.faction)
        return character

    def _faction_url(self, suffix='.json'):
        """Return the URL of the fixture faction followed by `suffix`."""
        return f'/games/test-game/factions/{self.faction.id}{suffix}'

    def _all_url(self):
        """Return the faction's characters/all.json URL."""
        return self._faction_url('/characters/all.json')


@pytest.mark.django_db
class TestFactionTokenScopesPublicReads(FactionScopedTokenMixin):
    """Plain faction reads accept a token without any scope."""

    def test_factions_list_needs_no_scope(self):
        """Test that factions.json answers 200 for a token with no scopes."""
        response = self._get('/games/test-game/factions.json', self.player, [])
        assert response.status_code == 200

    def test_faction_detail_needs_no_scope(self):
        """Test that factions/<id>.json answers 200 for a token with no scopes."""
        assert self._get(self._faction_url(), self.player, []).status_code == 200

    def test_faction_characters_needs_no_scope(self):
        """Test that factions/<id>/characters.json answers 200 for a token with no scopes."""
        response = self._get(self._faction_url('/characters.json'), self.player, [])
        assert response.status_code == 200

    def test_faction_permissions_needs_no_scope(self):
        """Test that permissions/game_faction.json answers 200 for a token with no scopes."""
        response = self._get('/permissions/game_faction.json', self.player, [])
        assert response.status_code == 200


@pytest.mark.django_db
class TestFactionTokenScopesRestrictedReads(FactionScopedTokenMixin):
    """characters/all.json needs `factions:read`, `pcs:read` and `npcs:read`."""

    def _all_without(self, scope):
        """GET characters/all.json as the DM with every read scope except `scope`."""
        scopes = [name for name in ALL_READ_SCOPES if name != scope]
        return self._get(self._all_url(), self.dm, scopes)

    def test_all_with_every_read_scope_is_allowed(self):
        """Test that characters/all.json with the three read scopes answers 200."""
        response = self._get(self._all_url(), self.dm, ALL_READ_SCOPES)
        assert response.status_code == 200

    def test_all_includes_hidden_characters(self):
        """Test that characters/all.json with the three read scopes lists hidden characters."""
        response = self._get(self._all_url(), self.dm, ALL_READ_SCOPES)
        names = {character['name'] for character in response.json()}
        assert self.hidden_npc.name in names

    def test_all_without_factions_read_is_refused(self):
        """Test that characters/all.json without `factions:read` gives `scope_missing`."""
        self._assert_refused(self._all_without('factions:read'), 'scope_missing')

    def test_all_without_pcs_read_is_refused(self):
        """Test that characters/all.json without `pcs:read` gives `scope_missing`."""
        self._assert_refused(self._all_without('pcs:read'), 'scope_missing')

    def test_all_without_npcs_read_is_refused(self):
        """Test that characters/all.json without `npcs:read` gives `scope_missing`."""
        self._assert_refused(self._all_without('npcs:read'), 'scope_missing')


@pytest.mark.django_db
class TestFactionTokenScopesWrites(FactionScopedTokenMixin):
    """Faction writes need `factions:write`."""

    def _create(self, scopes):
        """POST a new faction to factions.json as the DM with `scopes`."""
        return self._post('/games/test-game/factions.json', {'name': 'New'}, self.dm, scopes)

    def _update(self, scopes, user=None):
        """PATCH the fixture faction as `user` (default: the DM) with `scopes`."""
        return self._patch(self._faction_url(), {'name': 'Renamed'}, user or self.dm, scopes)

    def _upload(self, scopes):
        """POST the photo upload init for the fixture faction as the DM with `scopes`."""
        return self._post(
            self._faction_url('/photo_upload.json'), {'filename': 'hand.png'}, self.dm, scopes,
        )

    def test_create_without_write_is_refused(self):
        """Test that factions.json POST with `factions:read` alone gives `scope_missing`."""
        self._assert_refused(self._create(['factions:read']), 'scope_missing')

    def test_create_with_write_succeeds(self):
        """Test that factions.json POST with `factions:write` answers 201."""
        assert self._create(['factions:write']).status_code == 201

    def test_update_without_write_is_refused(self):
        """Test that factions/<id>.json PATCH with `factions:read` alone gives `scope_missing`."""
        self._assert_refused(self._update(['factions:read']), 'scope_missing')

    def test_update_with_write_succeeds(self):
        """Test that factions/<id>.json PATCH with `factions:write` answers 200."""
        assert self._update(['factions:write']).status_code == 200

    def test_upload_without_write_is_refused(self):
        """Test that photo_upload.json with `factions:read` alone gives `scope_missing`."""
        self._assert_refused(self._upload(['factions:read']), 'scope_missing')

    def test_upload_with_write_succeeds(self):
        """Test that photo_upload.json with `factions:write` answers 201."""
        assert self._upload(['factions:write']).status_code == 201


@pytest.mark.django_db
class TestFactionTokenScopesGames(FactionScopedTokenMixin):
    """A token limited to some games is only accepted on those games."""

    def test_token_limited_to_another_game_is_refused(self):
        """Test that a token limited to another game gives `game_not_allowed`."""
        response = self._get(self._all_url(), self.dm, ALL_READ_SCOPES, games=[self.other_game])
        self._assert_refused(response, 'game_not_allowed')

    def test_token_limited_to_the_game_is_allowed(self):
        """Test that a token limited to the faction's game answers 200."""
        response = self._get(self._all_url(), self.dm, ALL_READ_SCOPES, games=[self.game])
        assert response.status_code == 200


@pytest.mark.django_db
class TestFactionTokenScopesOwnerIntersection(FactionScopedTokenMixin):
    """A token never grants more than its owner's role allows."""

    def _update_as(self, user):
        """PATCH the fixture faction as `user` with every faction scope."""
        return self._patch(self._faction_url(), {'name': 'Renamed'}, user, ALL_FACTION_SCOPES)

    def test_outsider_update_is_forbidden(self):
        """Test that a non-member with every faction scope still gets a role 403 on PATCH."""
        self._assert_role_refused(self._update_as(self.outsider))

    def test_player_update_is_allowed(self):
        """Test that a player, whose role may edit factions, can PATCH with `factions:write`."""
        assert self._update_as(self.player).status_code == 200

    def test_player_characters_all_is_forbidden(self):
        """Test that a player with every faction scope still gets a role 403 on characters/all."""
        self._assert_role_refused(self._get(self._all_url(), self.player, ALL_FACTION_SCOPES))


@pytest.mark.django_db
class TestFactionTokenScopesOtherCredentials(FactionScopedTokenMixin):
    """Session and legacy `Token` requests are unaffected by scope declarations."""

    def test_session_dm_reads_characters_all(self):
        """Test that the DM's session still reads characters/all.json."""
        self._log_in(self.dm)
        assert self.client.get(self._all_url()).status_code == 200

    def test_legacy_token_dm_creates_faction(self):
        """Test that the DM's legacy Token still creates a faction."""
        token = Token.objects.create(user=self.dm)
        response = self.client.post(
            '/games/test-game/factions.json', {'name': 'New'}, format='json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 201
