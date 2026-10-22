"""Shared end-to-end `@token_scopes` behaviours for the game entity families (issue #1635).

A concrete test module subclasses `EntityScopedTokenMixin`, sets `family`, `permissions_name`
and `factory`, and mixes in the behaviour classes below under `Test*` names.
"""

from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from games.tests.factories import GameFactory, UserFactory
from games.tests.views.game._scoped_token_fixtures import ScopedTokenMixin


class EntityScopedTokenMixin(ScopedTokenMixin):
    """Fixtures: a game with a DM, a player and an outsider, plus a visible and a hidden entity."""

    family = None
    permissions_name = None
    factory = None

    def setup_method(self):
        """Set up the game, its members, an outsider and the family's entities."""
        self.client = APIClient()
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.other_game = GameFactory(name='Other Game', game_slug='other-game')
        self.dm = self._member('dm', is_dm=True).user
        self.player = self._member('player').user
        self.outsider = UserFactory(username='outsider', password='secret-password')
        self.entity = self.factory(game=self.game, name='Visible')
        self.hidden_entity = self.factory(game=self.game, name='Secret', hidden=True)

    @property
    def read_scope(self):
        """Return the family's read scope."""
        return f'{self.family}:read'

    @property
    def write_scope(self):
        """Return the family's write scope."""
        return f'{self.family}:write'

    def _list_url(self, suffix='.json'):
        """Return the family's collection URL followed by `suffix`."""
        return f'/games/test-game/{self.family}{suffix}'

    def _entity_url(self, suffix='.json', entity=None):
        """Return the URL of `entity` (default: the visible one) followed by `suffix`."""
        entity = entity or self.entity
        return f'/games/test-game/{self.family}/{entity.id}{suffix}'

    def _hidden_full_url(self):
        """Return the full.json URL of the hidden entity."""
        return self._entity_url('/full.json', self.hidden_entity)


class PublicReadsBehavior:
    """Plain reads accept a token without any scope."""

    def test_list_needs_no_scope(self):
        """Test that the public list answers 200 for a token with no scopes."""
        assert self._get(self._list_url(), self.player, []).status_code == 200

    def test_detail_needs_no_scope(self):
        """Test that the public detail answers 200 for a token with no scopes."""
        assert self._get(self._entity_url(), self.player, []).status_code == 200

    def test_permissions_needs_no_scope(self):
        """Test that the family's permissions endpoint answers 200 for a token with no scopes."""
        url = f'/permissions/{self.permissions_name}.json'
        assert self._get(url, self.player, []).status_code == 200


class RestrictedReadsBehavior:
    """all.json and full.json need the family's read scope."""

    def test_all_without_read_is_refused(self):
        """Test that all.json without the read scope gives `scope_missing`."""
        response = self._get(self._list_url('/all.json'), self.dm, [self.write_scope])
        self._assert_refused(response, 'scope_missing')

    def test_all_with_read_is_allowed(self):
        """Test that all.json with the read scope answers 200 for the DM."""
        response = self._get(self._list_url('/all.json'), self.dm, [self.read_scope])
        assert response.status_code == 200

    def test_full_without_read_is_refused(self):
        """Test that full.json without the read scope gives `scope_missing`."""
        response = self._get(self._hidden_full_url(), self.dm, [self.write_scope])
        self._assert_refused(response, 'scope_missing')

    def test_full_with_read_is_allowed(self):
        """Test that full.json of a hidden entity with the read scope answers 200 for the DM."""
        response = self._get(self._hidden_full_url(), self.dm, [self.read_scope])
        assert response.status_code == 200


class WritesBehavior:
    """Creates, updates and photo upload inits need the family's write scope."""

    def _create(self, scopes):
        """POST a new entity to the collection as the DM with `scopes`."""
        return self._post(self._list_url(), {'name': 'New'}, self.dm, scopes)

    def _update(self, scopes):
        """PATCH the visible entity as the DM with `scopes`."""
        return self._patch(self._entity_url(), {'name': 'Renamed'}, self.dm, scopes)

    def _upload(self, scopes):
        """POST the photo upload init for the visible entity as the DM with `scopes`."""
        url = self._entity_url('/photo_upload.json')
        return self._post(url, {'filename': 'photo.png'}, self.dm, scopes)

    def test_create_without_write_is_refused(self):
        """Test that a POST with the read scope alone gives `scope_missing`."""
        self._assert_refused(self._create([self.read_scope]), 'scope_missing')

    def test_create_with_write_succeeds(self):
        """Test that a POST with the write scope answers 201."""
        assert self._create([self.write_scope]).status_code == 201

    def test_update_without_write_is_refused(self):
        """Test that a PATCH with the read scope alone gives `scope_missing`."""
        self._assert_refused(self._update([self.read_scope]), 'scope_missing')

    def test_update_with_write_succeeds(self):
        """Test that a PATCH with the write scope answers 200."""
        assert self._update([self.write_scope]).status_code == 200

    def test_upload_without_write_is_refused(self):
        """Test that photo_upload.json with the read scope alone gives `scope_missing`."""
        self._assert_refused(self._upload([self.read_scope]), 'scope_missing')

    def test_upload_with_write_succeeds(self):
        """Test that photo_upload.json with the write scope answers 201."""
        assert self._upload([self.write_scope]).status_code == 201


class GamesBehavior:
    """A token limited to some games is only accepted on those games."""

    def _all_with_games(self, games):
        """GET all.json as the DM with the read scope, limited to `games`."""
        return self._get(self._list_url('/all.json'), self.dm, [self.read_scope], games=games)

    def test_token_limited_to_another_game_is_refused(self):
        """Test that a token limited to another game gives `game_not_allowed`."""
        response = self._all_with_games([self.other_game])
        self._assert_refused(response, 'game_not_allowed')

    def test_token_limited_to_the_game_is_allowed(self):
        """Test that a token limited to the entity's game answers 200."""
        assert self._all_with_games([self.game]).status_code == 200


class OwnerIntersectionBehavior:
    """A token never grants more than its owner's role allows."""

    def _all_scopes(self):
        """Return the family's read and write scopes."""
        return [self.read_scope, self.write_scope]

    def test_player_all_is_forbidden(self):
        """Test that a player holding the read scope still gets a role 403 on all.json."""
        response = self._get(self._list_url('/all.json'), self.player, self._all_scopes())
        self._assert_role_refused(response)

    def test_player_full_is_forbidden(self):
        """Test that a player holding the read scope still gets a role 403 on full.json."""
        response = self._get(self._hidden_full_url(), self.player, self._all_scopes())
        self._assert_role_refused(response)

    def test_outsider_update_is_forbidden(self):
        """Test that a non-member holding every family scope still gets a role 403 on PATCH."""
        response = self._patch(
            self._entity_url(), {'name': 'Renamed'}, self.outsider, self._all_scopes(),
        )
        self._assert_role_refused(response)


class OtherCredentialsBehavior:
    """Session and legacy `Token` requests are unaffected by scope declarations."""

    def test_session_dm_reads_all(self):
        """Test that the DM's session still reads all.json."""
        self._log_in(self.dm)
        assert self.client.get(self._list_url('/all.json')).status_code == 200

    def test_legacy_token_dm_creates_entity(self):
        """Test that the DM's legacy Token still creates an entity."""
        token = Token.objects.create(user=self.dm)
        response = self.client.post(
            self._list_url(), {'name': 'New'}, format='json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 201
