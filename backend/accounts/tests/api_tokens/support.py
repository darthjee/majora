"""Shared helpers for the scoped API token view tests."""

from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from accounts.models import ApiToken
from accounts.scopes import SCOPES

REFUSED_BODY = {'errors': {'detail': ['token_not_allowed']}}


def session_client(user):
    """Return an APIClient authenticated by a session cookie holding `user`'s auth token."""
    client = APIClient()
    session = client.session
    session['auth_token'] = Token.objects.get_or_create(user=user)[0].key
    session.save()
    return client


def legacy_token_client(user):
    """Return an APIClient sending `user`'s legacy DRF `Authorization: Token` header."""
    client = APIClient()
    token, _ = Token.objects.get_or_create(user=user)
    client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
    return client


def bearer_client(user, client=None):
    """Return an APIClient sending a Bearer token for `user` that holds every scope."""
    client = client or APIClient()
    _, plain = ApiToken.objects.create_token(user, 'automation', list(SCOPES))
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {plain}')
    return client


def create_token(user, name='Bot', scopes=None, games=None, expires_at=None):
    """Create a token for `user` and return the `ApiToken` row."""
    api_token, _ = ApiToken.objects.create_token(
        user, name, scopes or ['npcs:read'], games=games, expires_at=expires_at,
    )
    return api_token
