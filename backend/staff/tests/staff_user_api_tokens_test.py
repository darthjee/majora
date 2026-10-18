"""Tests for the staff API-tokens list view (GET /staff/users/<id>/api-tokens.json)."""

from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import ApiToken
from accounts.tests.api_tokens.support import (
    REFUSED_BODY,
    bearer_client,
    create_token,
    legacy_token_client,
    session_client,
)
from games.tests.factories import GameFactory, SuperUserFactory, UserFactory


def list_url(user_id):
    """Return the staff API-tokens list URL for `user_id`."""
    return f'/staff/users/{user_id}/api-tokens.json'


@pytest.mark.django_db
class TestStaffUserApiTokensView:
    """Tests for GET /staff/users/<id>/api-tokens.json."""

    def setup_method(self):
        """Set up a target user with tokens, a staff user and a superuser."""
        self.target = UserFactory()
        self.staff = UserFactory(is_staff=True)
        self.superuser = SuperUserFactory()
        self.game = GameFactory(name='Alpha', game_slug='alpha')

    def test_staff_lists_tokens_newest_first(self):
        """Test that staff list the user's tokens only, newest first."""
        older = create_token(self.target, name='Older', games=[self.game])
        newer = create_token(self.target, name='Newer')
        create_token(self.staff, name='Other user')
        ApiToken.objects.filter(pk=older.pk).update(
            created_at=timezone.now() - timedelta(days=1),
        )
        response = session_client(self.staff).get(list_url(self.target.pk))
        assert response.status_code == 200
        data = response.json()
        assert [item['id'] for item in data] == [newer.pk, older.pk]
        assert data[1]['games'] == [{'slug': 'alpha', 'name': 'Alpha'}]

    def test_never_emits_secret_or_hash(self):
        """Test that the list never carries the hash or a token field."""
        api_token = create_token(self.target)
        response = session_client(self.staff).get(list_url(self.target.pk))
        assert api_token.hashed_secret not in response.content.decode()
        assert 'token' not in response.json()[0]

    def test_superuser_lists_tokens(self):
        """Test that a superuser can list a user's tokens."""
        create_token(self.target)
        response = legacy_token_client(self.superuser).get(list_url(self.target.pk))
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_staff_lists_superuser_and_own_tokens(self):
        """Test that staff can list a superuser's tokens and their own."""
        create_token(self.superuser)
        create_token(self.staff)
        client = session_client(self.staff)
        assert len(client.get(list_url(self.superuser.pk)).json()) == 1
        assert len(client.get(list_url(self.staff.pk)).json()) == 1

    def test_non_staff_gets_403(self):
        """Test that a non-staff user gets 403 not_allowed."""
        response = session_client(UserFactory()).get(list_url(self.target.pk))
        assert response.status_code == 403
        assert response.json() == {'errors': {'detail': ['not_allowed']}}

    def test_anonymous_gets_401(self):
        """Test that an anonymous caller gets 401."""
        assert APIClient().get(list_url(self.target.pk)).status_code == 401

    def test_scoped_token_refused_for_staff_owner(self):
        """Test that a staff owner's scoped token gets 403 token_not_allowed."""
        response = bearer_client(self.superuser).get(list_url(self.target.pk))
        assert response.status_code == 403
        assert response.json() == REFUSED_BODY

    def test_unknown_user_gives_404(self):
        """Test that an unknown user id gives 404."""
        assert session_client(self.staff).get(list_url(999999)).status_code == 404

    def test_skip_cache_header(self):
        """Test that the response carries X-Skip-Cache: true."""
        response = session_client(self.staff).get(list_url(self.target.pk))
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self):
        """Test that the route resolves by name."""
        url = reverse('staff-user-api-tokens', kwargs={'user_id': self.target.pk})
        assert url == list_url(self.target.pk)
