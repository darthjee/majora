"""Tests for PATCH/DELETE /account/api_tokens/<id>.json."""

from datetime import timedelta

import pytest
from django.utils import timezone

from accounts.models import ApiToken
from accounts.tests.api_tokens.support import create_token, session_client
from games.tests.factories import UserFactory


def detail_url(api_token):
    """Return the detail URL of `api_token`."""
    return f'/account/api_tokens/{api_token.pk}.json'


@pytest.mark.django_db
class TestApiTokenRename:
    """Tests for PATCH /account/api_tokens/<id>.json."""

    def setup_method(self):
        """Set up an owner, their token and a session client."""
        self.user = UserFactory()
        self.api_token = create_token(self.user, name='Old')
        self.client = session_client(self.user)

    def _patch(self, body, api_token=None):
        """PATCH `body` to the token's detail URL."""
        return self.client.patch(detail_url(api_token or self.api_token), body, format='json')

    def test_renames(self):
        """Test that PATCH changes the name and returns 200 with the item."""
        response = self._patch({'name': '  New  '})
        assert response.status_code == 200
        assert response.json()['name'] == 'New'
        assert response.json()['id'] == self.api_token.pk
        self.api_token.refresh_from_db()
        assert self.api_token.name == 'New'

    @pytest.mark.parametrize('field', ['scopes', 'games', 'expires_at', 'owner', 'prefix'])
    def test_other_field_not_editable(self, field):
        """Test that any other field gives 400 not_editable and leaves the row unchanged."""
        response = self._patch({'name': 'New', field: ['x']})
        assert response.status_code == 400
        assert response.json() == {'errors': {field: ['not_editable']}}
        self.api_token.refresh_from_db()
        assert self.api_token.name == 'Old'
        assert self.api_token.scopes == ['npcs:read']

    def test_blank_name(self):
        """Test that a blank name gives 400 blank."""
        assert self._patch({'name': ''}).json() == {'errors': {'name': ['blank']}}

    def test_other_users_token_gives_404(self):
        """Test that another user's token id gives 404 and the row is unchanged."""
        theirs = create_token(UserFactory(), name='Theirs')
        assert self._patch({'name': 'Mine'}, api_token=theirs).status_code == 404
        theirs.refresh_from_db()
        assert theirs.name == 'Theirs'

    def test_expired_token_can_be_renamed(self):
        """Test that an expired token can still be renamed."""
        expired = create_token(self.user, expires_at=timezone.now() - timedelta(days=1))
        assert self._patch({'name': 'New'}, api_token=expired).status_code == 200

    def test_form_encoded_body_gives_415(self):
        """Test that a form-encoded body gives 415."""
        response = self.client.patch(
            detail_url(self.api_token), 'name=New',
            content_type='application/x-www-form-urlencoded',
        )
        assert response.status_code == 415


@pytest.mark.django_db
class TestApiTokenRevoke:
    """Tests for DELETE /account/api_tokens/<id>.json."""

    def setup_method(self):
        """Set up an owner, their token and a session client."""
        self.user = UserFactory()
        self.api_token = create_token(self.user)
        self.client = session_client(self.user)

    def test_revokes(self):
        """Test that DELETE returns 204, removes the row, and a second DELETE gives 404."""
        response = self.client.delete(detail_url(self.api_token))
        assert response.status_code == 204
        assert not ApiToken.objects.filter(pk=self.api_token.pk).exists()
        assert self.client.delete(detail_url(self.api_token)).status_code == 404

    def test_other_users_token_gives_404(self):
        """Test that another user's token id gives 404 and the row stays."""
        theirs = create_token(UserFactory())
        assert self.client.delete(detail_url(theirs)).status_code == 404
        assert ApiToken.objects.filter(pk=theirs.pk).exists()

    def test_expired_token_can_be_revoked(self):
        """Test that an expired token can still be revoked."""
        expired = create_token(self.user, expires_at=timezone.now() - timedelta(days=1))
        assert self.client.delete(detail_url(expired)).status_code == 204
