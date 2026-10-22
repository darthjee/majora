"""Shared `@token_scopes` tests for the identity-independent `permissions/*.json` routes."""

from rest_framework.authtoken.models import Token


class PermissionsTokenScopesBehavior:
    """A permissions route needs no scope, and a token never adds rights to its answer.

    Hosts set `permissions_url` and provide `self.client`, `self.dm` and the
    `ScopedTokenMixin` helpers.
    """

    permissions_url = None

    def _permissions_query_url(self, query=''):
        """Return the permissions URL, optionally followed by a query string."""
        return f'{self.permissions_url}?{query}' if query else self.permissions_url

    def _scoped_permissions_get(self, query=''):
        """GET the permissions URL with a no-scope token of the DM."""
        return self._get(self._permissions_query_url(query), self.dm, [])

    def _anonymous_permissions_get(self, query=''):
        """GET the permissions URL without credentials."""
        return self.client.get(self._permissions_query_url(query))

    def _legacy_permissions_get(self, query=''):
        """GET the permissions URL with a legacy `Token` of the DM."""
        token = Token.objects.create(user=self.dm)
        return self.client.get(
            self._permissions_query_url(query), HTTP_AUTHORIZATION=f'Token {token.key}',
        )

    def test_permissions_needs_no_scope(self):
        """Test that the permissions route answers 200 for a token with no scopes."""
        assert self._scoped_permissions_get().status_code == 200

    def test_dm_token_without_role_matches_anonymous(self):
        """Test that a DM's no-scope token without `?role=` gets the all-False answer."""
        data = self._scoped_permissions_get().json()
        assert not any(data.values())
        assert data == self._anonymous_permissions_get().json()

    def test_dm_role_with_token_matches_anonymous(self):
        """Test that `?role=dm` answers the same with a scoped token as anonymously."""
        expected = self._anonymous_permissions_get('role=dm').json()
        assert self._scoped_permissions_get('role=dm').json() == expected

    def test_dm_role_with_token_matches_legacy_token(self):
        """Test that `?role=dm` answers the same with a scoped token as with a legacy Token."""
        expected = self._legacy_permissions_get('role=dm').json()
        assert self._scoped_permissions_get('role=dm').json() == expected

    def test_session_request_succeeds(self):
        """Test that a session request still answers 200."""
        self._log_in(self.dm)
        assert self.client.get(self._permissions_query_url()).status_code == 200

    def test_legacy_token_request_succeeds(self):
        """Test that a legacy Token request still answers 200."""
        assert self._legacy_permissions_get().status_code == 200
