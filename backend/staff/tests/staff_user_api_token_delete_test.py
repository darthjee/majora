"""Tests for the staff API-token revoke view (DELETE /staff/users/<id>/api-tokens/<id>.json)."""

import logging
from contextlib import contextmanager

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import ApiToken
from accounts.tests.api_tokens.support import (
    REFUSED_BODY,
    bearer_client,
    create_token,
    legacy_token_client,
    session_client,
)
from games.tests.factories import SuperUserFactory, UserFactory

LOGGER = 'staff.views._api_token_shared'


class _RecordingHandler(logging.Handler):
    """Logging handler keeping every formatted message it receives."""

    def __init__(self):
        """Start with no messages."""
        super().__init__(level=logging.INFO)
        self.messages = []

    def emit(self, record):
        """Keep the record's formatted message."""
        self.messages.append(record.getMessage())


@contextmanager
def recorded_logs(name):
    """Attach a recording handler to the (non-propagating) `name` logger while active."""
    logger = logging.getLogger(name)
    handler = _RecordingHandler()
    logger.addHandler(handler)
    try:
        yield handler.messages
    finally:
        logger.removeHandler(handler)


def delete_url(user_id, token_id):
    """Return the staff API-token revoke URL."""
    return f'/staff/users/{user_id}/api-tokens/{token_id}.json'


@pytest.mark.django_db
class TestStaffUserApiTokenDeleteView:
    """Tests for DELETE /staff/users/<id>/api-tokens/<id>.json."""

    def setup_method(self):
        """Set up a target user's token, a staff user and a superuser."""
        self.target = UserFactory()
        self.staff = UserFactory(is_staff=True)
        self.superuser = SuperUserFactory()
        self.api_token = create_token(self.target)

    def _delete(self, client, user_id=None, token_id=None):
        """DELETE the target's token (or the given ids) with `client`."""
        return client.delete(delete_url(
            user_id or self.target.pk, token_id or self.api_token.pk,
        ))

    def _exists(self):
        """Return whether the target's token still exists."""
        return ApiToken.objects.filter(pk=self.api_token.pk).exists()

    def test_staff_revokes(self):
        """Test that staff revoke the token: 204 and the row is gone."""
        response = self._delete(session_client(self.staff))
        assert response.status_code == 204
        assert not self._exists()

    def test_second_revoke_gives_404(self):
        """Test that revoking the same token twice gives 404 the second time."""
        client = session_client(self.staff)
        self._delete(client)
        assert self._delete(client).status_code == 404

    def test_superuser_revokes(self):
        """Test that a superuser can revoke a user's token."""
        assert self._delete(legacy_token_client(self.superuser)).status_code == 204

    def test_staff_revokes_superuser_token(self):
        """Test that staff can revoke a superuser's token."""
        theirs = create_token(self.superuser)
        response = self._delete(session_client(self.staff), self.superuser.pk, theirs.pk)
        assert response.status_code == 204

    def test_staff_revokes_own_token(self):
        """Test that staff can revoke their own token through the staff endpoint."""
        own = create_token(self.staff)
        response = self._delete(session_client(self.staff), self.staff.pk, own.pk)
        assert response.status_code == 204

    def test_wrong_user_id_gives_404(self):
        """Test that a token id under the wrong user id gives 404 and the row stays."""
        response = self._delete(session_client(self.staff), user_id=self.staff.pk)
        assert response.status_code == 404
        assert self._exists()

    def test_unknown_user_id_gives_404(self):
        """Test that an unknown user id gives 404."""
        assert self._delete(session_client(self.staff), user_id=999999).status_code == 404

    def test_non_staff_gets_403(self):
        """Test that a non-staff user gets 403 not_allowed and the row stays."""
        response = self._delete(session_client(self.target))
        assert response.status_code == 403
        assert response.json() == {'errors': {'detail': ['not_allowed']}}
        assert self._exists()

    def test_anonymous_gets_401(self):
        """Test that an anonymous caller gets 401."""
        assert self._delete(APIClient()).status_code == 401
        assert self._exists()

    def test_scoped_token_refused_for_staff_owner(self):
        """Test that a staff owner's scoped token gets 403 token_not_allowed."""
        response = self._delete(bearer_client(self.superuser))
        assert response.status_code == 403
        assert response.json() == REFUSED_BODY
        assert self._exists()

    def test_revocation_logged_without_secret(self):
        """Test that the revocation is logged with ids only, never the secret or hash."""
        api_token, plain = ApiToken.objects.create_token(self.target, 'Logged', ['npcs:read'])
        with recorded_logs(LOGGER) as messages:
            self._delete(session_client(self.staff), token_id=api_token.pk)
        assert messages == [
            f'staff_api_token_action action=delete api_token_id={api_token.pk} '
            f'user_id={self.target.pk} staff_id={self.staff.pk}'
        ]
        logged = ' '.join(messages)
        assert plain not in logged
        assert api_token.hashed_secret not in logged
        assert api_token.prefix not in logged

    def test_skip_cache_header(self):
        """Test that the response carries X-Skip-Cache: true."""
        assert self._delete(session_client(self.staff))['X-Skip-Cache'] == 'true'

    def test_url_by_name(self):
        """Test that the route resolves by name."""
        url = reverse(
            'staff-user-api-token-delete',
            kwargs={'user_id': self.target.pk, 'token_id': self.api_token.pk},
        )
        assert url == delete_url(self.target.pk, self.api_token.pk)
