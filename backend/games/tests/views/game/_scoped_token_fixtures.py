"""Shared request helpers for the end-to-end `@token_scopes` tests of the character views."""

from rest_framework.authtoken.models import Token

from accounts.models import ApiToken
from games.tests.factories import PlayerFactory, UserFactory


class ScopedTokenMixin:
    """Helpers to issue requests with scoped, session or legacy credentials."""

    def _member(self, username, is_dm=False):
        """Return a new player (or the DM) of the fixture game, with its own user."""
        user = UserFactory(username=username, password='secret-password')
        return PlayerFactory(name=username, game=self.game, user=user, is_dm=is_dm)

    def _bearer(self, user, scopes, games=None):
        """Return request kwargs carrying a fresh scoped token of `user`."""
        _, plain = ApiToken.objects.create_token(user, 'automation', scopes, games=games)
        return {'HTTP_AUTHORIZATION': f'Bearer {plain}'}

    def _get(self, url, user, scopes, games=None):
        """Issue a GET to `url` with a scoped token of `user`."""
        return self.client.get(url, **self._bearer(user, scopes, games))

    def _post(self, url, payload, user, scopes, games=None):
        """Issue a JSON POST to `url` with a scoped token of `user`."""
        return self.client.post(url, payload, format='json', **self._bearer(user, scopes, games))

    def _patch(self, url, payload, user, scopes, games=None):
        """Issue a JSON PATCH to `url` with a scoped token of `user`."""
        return self.client.patch(url, payload, format='json', **self._bearer(user, scopes, games))

    def _put(self, url, payload, user, scopes):
        """Issue a JSON PUT to `url` with a scoped token of `user`."""
        return self.client.put(url, payload, format='json', **self._bearer(user, scopes))

    def _log_in(self, user):
        """Store `user`'s auth token in the client session, as the login view does."""
        session = self.client.session
        session['auth_token'] = Token.objects.create(user=user).key
        session.save()

    def _assert_refused(self, response, code):
        """Assert a 403 carrying the token error `code`."""
        assert response.status_code == 403
        assert response.json() == {'errors': {'detail': [code]}}

    def _assert_role_refused(self, response):
        """Assert a 403 that comes from the owner's role, not from the token's scopes."""
        assert response.status_code == 403
        assert response.json() != {'errors': {'detail': ['scope_missing']}}
