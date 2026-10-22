"""End-to-end tests for the `@token_scopes` declarations of the top-level treasure views (#1636)."""

import pytest
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from games.tests.factories import GameFactory, SuperUserFactory, TreasureFactory, UserFactory
from games.tests.views.game._scoped_token_fixtures import ScopedTokenMixin

READ = 'treasures:read'
WRITE = 'treasures:write'
UPLOAD_PAYLOAD = {'filename': 'photo.png'}


class TreasureScopedTokenMixin(ScopedTokenMixin):
    """Fixtures: a catalogue treasure, a game-exclusive treasure, a superuser, staff and a DM."""

    def setup_method(self):
        """Set up the games, the users and the treasures."""
        self.client = APIClient()
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.other_game = GameFactory(name='Other Game', game_slug='other-game')
        self.dm = self._member('dm', is_dm=True).user
        self.superuser = SuperUserFactory(username='admin', password='secret-password')
        self.staff = UserFactory(username='staffer', password='secret-password', is_staff=True)
        self.regular = UserFactory(username='regular', password='secret-password')
        self.treasure = TreasureFactory(name='Golden Crown')
        self.exclusive_treasure = TreasureFactory(name='Secret Idol', game=self.game)

    def _treasure_url(self, suffix='.json', treasure=None):
        """Return the URL of `treasure` (default: the catalogue one) followed by `suffix`."""
        treasure = treasure or self.treasure
        return f'/treasures/{treasure.id}{suffix}'

    def _create(self, user, scopes, games=None):
        """POST a new catalogue treasure as `user` with `scopes`."""
        payload = {'name': 'Dragon Gem', 'value': 1000}
        return self._post('/treasures.json', payload, user, scopes, games=games)

    def _update(self, user, scopes, games=None, treasure=None):
        """PATCH `treasure` (default: the catalogue one) as `user` with `scopes`."""
        url = self._treasure_url(treasure=treasure)
        return self._patch(url, {'name': 'Renamed'}, user, scopes, games=games)

    def _upload(self, user, scopes, games=None, treasure=None):
        """POST the photo upload init for `treasure` (default: the catalogue one)."""
        url = self._treasure_url('/photo_upload.json', treasure)
        return self._post(url, UPLOAD_PAYLOAD, user, scopes, games=games)


@pytest.mark.django_db
class TestTreasureTokenScopesPublicReads(TreasureScopedTokenMixin):
    """Plain treasure reads and permission reports accept a token without any scope."""

    def test_list_needs_no_scope(self):
        """Test that treasures.json answers 200 for a token with no scopes."""
        assert self._get('/treasures.json', self.regular, []).status_code == 200

    def test_detail_needs_no_scope(self):
        """Test that treasures/<id>.json answers 200 for a token with no scopes."""
        assert self._get(self._treasure_url(), self.regular, []).status_code == 200

    def test_access_needs_no_scope(self):
        """Test that treasures/<id>/access.json answers 200 for a token with no scopes."""
        url = self._treasure_url('/access.json')
        assert self._get(url, self.regular, []).status_code == 200

    def test_treasure_permissions_needs_no_scope(self):
        """Test that permissions/treasure.json answers 200 for a token with no scopes."""
        assert self._get('/permissions/treasure.json', self.regular, []).status_code == 200

    def test_game_treasure_permissions_needs_no_scope(self):
        """Test that permissions/game_treasure.json answers 200 for a token with no scopes."""
        url = '/permissions/game_treasure.json'
        assert self._get(url, self.regular, []).status_code == 200


@pytest.mark.django_db
class TestTreasureTokenScopesWrites(TreasureScopedTokenMixin):
    """Catalogue creates, updates and photo upload inits need `treasures:write`."""

    def test_create_without_write_is_refused(self):
        """Test that a POST with `treasures:read` alone gives `scope_missing`."""
        self._assert_refused(self._create(self.superuser, [READ]), 'scope_missing')

    def test_create_with_write_succeeds(self):
        """Test that a superuser's POST with `treasures:write` answers 201."""
        assert self._create(self.superuser, [WRITE]).status_code == 201

    def test_staff_create_with_write_succeeds(self):
        """Test that a staff POST with `treasures:write` answers 201."""
        assert self._create(self.staff, [WRITE]).status_code == 201

    def test_update_without_write_is_refused(self):
        """Test that a PATCH with `treasures:read` alone gives `scope_missing`."""
        self._assert_refused(self._update(self.superuser, [READ]), 'scope_missing')

    def test_update_with_write_succeeds(self):
        """Test that a superuser's PATCH with `treasures:write` answers 200."""
        assert self._update(self.superuser, [WRITE]).status_code == 200

    def test_upload_without_write_is_refused(self):
        """Test that photo_upload.json with `treasures:read` alone gives `scope_missing`."""
        self._assert_refused(self._upload(self.superuser, [READ]), 'scope_missing')

    def test_upload_with_write_succeeds(self):
        """Test that a superuser's photo_upload.json with `treasures:write` answers 201."""
        assert self._upload(self.superuser, [WRITE]).status_code == 201


@pytest.mark.django_db
class TestTreasureTokenScopesCatalogueGames(TreasureScopedTokenMixin):
    """A token limited to some game still reaches catalogue treasures (no owning game)."""

    def test_create_ignores_game_list(self):
        """Test that a game-limited token still creates a catalogue treasure."""
        response = self._create(self.superuser, [WRITE], games=[self.other_game])
        assert response.status_code == 201

    def test_update_ignores_game_list(self):
        """Test that a game-limited token still updates a catalogue treasure."""
        response = self._update(self.superuser, [WRITE], games=[self.other_game])
        assert response.status_code == 200

    def test_upload_ignores_game_list(self):
        """Test that a game-limited token still inits a catalogue treasure photo upload."""
        response = self._upload(self.superuser, [WRITE], games=[self.other_game])
        assert response.status_code == 201


@pytest.mark.django_db
class TestTreasureTokenScopesExclusiveGames(TreasureScopedTokenMixin):
    """Game-exclusive treasures enforce the token's game list inside the view."""

    def _update_exclusive(self, games):
        """PATCH the game-exclusive treasure as the superuser, limited to `games`."""
        return self._update(self.superuser, [WRITE], games=games, treasure=self.exclusive_treasure)

    def _upload_exclusive(self, games):
        """POST the game-exclusive treasure's photo upload init as the DM, limited to `games`."""
        return self._upload(self.dm, [WRITE], games=games, treasure=self.exclusive_treasure)

    def test_update_on_another_game_is_refused(self):
        """Test that a PATCH with a token limited to another game gives `game_not_allowed`."""
        self._assert_refused(self._update_exclusive([self.other_game]), 'game_not_allowed')

    def test_update_on_the_game_succeeds(self):
        """Test that a PATCH with a token limited to the owning game answers 200."""
        assert self._update_exclusive([self.game]).status_code == 200

    def test_upload_on_another_game_is_refused(self):
        """Test that a photo upload with a token on another game gives `game_not_allowed`."""
        self._assert_refused(self._upload_exclusive([self.other_game]), 'game_not_allowed')

    def test_upload_on_the_game_succeeds(self):
        """Test that a photo upload with a token limited to the owning game answers 201."""
        assert self._upload_exclusive([self.game]).status_code == 201

    def test_unlimited_token_update_succeeds(self):
        """Test that a token with no game list still updates the game-exclusive treasure."""
        assert self._update_exclusive(None).status_code == 200


@pytest.mark.django_db
class TestTreasureTokenScopesOwnerIntersection(TreasureScopedTokenMixin):
    """A token never grants more than its owner's role allows."""

    def test_regular_create_is_forbidden(self):
        """Test that a regular user holding `treasures:write` still gets a role 403 on POST."""
        self._assert_role_refused(self._create(self.regular, [READ, WRITE]))

    def test_dm_create_is_forbidden(self):
        """Test that a DM holding `treasures:write` still gets a role 403 on POST."""
        self._assert_role_refused(self._create(self.dm, [READ, WRITE]))

    def test_regular_update_is_forbidden(self):
        """Test that a regular user holding `treasures:write` still gets a role 403 on PATCH."""
        self._assert_role_refused(self._update(self.regular, [READ, WRITE]))

    def test_dm_update_of_exclusive_treasure_is_forbidden(self):
        """Test that a DM holding `treasures:write` still gets a role 403 on the top-level PATCH."""
        response = self._update(self.dm, [READ, WRITE], treasure=self.exclusive_treasure)
        self._assert_role_refused(response)

    def test_regular_upload_is_forbidden(self):
        """Test that a regular user holding `treasures:write` still gets a role 403 on upload."""
        self._assert_role_refused(self._upload(self.regular, [READ, WRITE]))


@pytest.mark.django_db
class TestTreasureTokenScopesOtherCredentials(TreasureScopedTokenMixin):
    """Session and legacy `Token` requests are unaffected by scope declarations."""

    def test_session_superuser_updates_treasure(self):
        """Test that the superuser's session still updates a catalogue treasure."""
        self._log_in(self.superuser)
        response = self.client.patch(self._treasure_url(), {'name': 'Renamed'}, format='json')
        assert response.status_code == 200

    def test_legacy_token_superuser_creates_treasure(self):
        """Test that the superuser's legacy Token still creates a catalogue treasure."""
        token = Token.objects.create(user=self.superuser)
        response = self.client.post(
            '/treasures.json', {'name': 'Dragon Gem', 'value': 1000}, format='json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 201
