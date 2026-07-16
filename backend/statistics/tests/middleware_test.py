"""Tests for `StatisticsSessionMiddleware`."""

import pytest
from rest_framework.authtoken.models import Token

from games.tests.factories import UserFactory
from statistics import cookies
from statistics.models import Session


@pytest.mark.django_db
class TestStatisticsSessionMiddleware:
    """Tests for `StatisticsSessionMiddleware`."""

    def test_creates_session_when_no_cookie_present(self, client):
        """Test that a request with no cookie creates a new session and sets a cookie."""
        response = client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert Session.objects.count() == 1
        session = Session.objects.get()
        assert session.ip == '1.2.3.4'
        assert cookies.COOKIE_NAME in response.cookies
        signed_value = response.cookies[cookies.COOKIE_NAME].value
        assert cookies.unsign(signed_value) == session.token

    def test_reuses_session_when_cookie_ip_matches(self, client):
        """Test that a valid cookie with a matching IP reuses the same session row."""
        session = Session.objects.create(ip='1.2.3.4')
        original_last_seen_at = session.last_seen_at
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(session.token)

        client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert Session.objects.count() == 1
        session.refresh_from_db()
        assert session.last_seen_at > original_last_seen_at

    def test_creates_new_session_when_cookie_ip_differs(self, client):
        """Test that a valid cookie with a mismatched IP rotates to a brand-new session."""
        old_session = Session.objects.create(ip='1.2.3.4')
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(old_session.token)

        response = client.get('/ready.json', REMOTE_ADDR='9.9.9.9')

        assert Session.objects.count() == 2
        old_session.refresh_from_db()
        assert old_session.ip == '1.2.3.4'
        new_signed_value = response.cookies[cookies.COOKIE_NAME].value
        new_token = cookies.unsign(new_signed_value)
        assert new_token != old_session.token
        new_session = Session.objects.get(token=new_token)
        assert new_session.ip == '9.9.9.9'

    def test_tampered_cookie_creates_new_session_without_error(self, client):
        """Test that a tampered/garbage cookie is treated as no session, not a 500."""
        client.cookies[cookies.COOKIE_NAME] = 'garbage-not-a-signed-value'

        response = client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert response.status_code == 200
        assert Session.objects.count() == 1

    def test_forwarded_for_header_takes_precedence_over_remote_addr(self, client):
        """Test that `X-Forwarded-For` is used over `REMOTE_ADDR` when present."""
        client.get(
            '/ready.json',
            REMOTE_ADDR='1.1.1.1',
            HTTP_X_FORWARDED_FOR='2.2.2.2',
        )

        session = Session.objects.get()
        assert session.ip == '2.2.2.2'

    def test_backfills_user_on_anonymous_session_when_request_is_authenticated(self, client):
        """Test that an authenticated request attaches its user to an anonymous session."""
        user = UserFactory(username='alice')
        token = Token.objects.create(user=user)
        session = Session.objects.create(ip='1.2.3.4')
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(session.token)

        response = client.get(
            '/games.json',
            REMOTE_ADDR='1.2.3.4',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        post_cookie = response.cookies[cookies.COOKIE_NAME].value
        assert cookies.unsign(post_cookie) == session.token
        session.refresh_from_db()
        assert session.user_id == user.id

    def test_leaves_session_untouched_when_already_tied_to_a_different_user(self, client):
        """Test that a session already tied to a user is not reattached/rotated on later hits."""
        other_user = UserFactory(username='bob')
        existing_session = Session.objects.create(ip='1.2.3.4', user=other_user)
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(existing_session.token)

        user = UserFactory(username='alice')
        token = Token.objects.create(user=user)

        response = client.get(
            '/games.json',
            REMOTE_ADDR='1.2.3.4',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        post_cookie = response.cookies[cookies.COOKIE_NAME].value
        assert cookies.unsign(post_cookie) == existing_session.token
        existing_session.refresh_from_db()
        assert existing_session.user_id == other_user.id

    def test_does_not_backfill_user_for_unauthenticated_request(self, client):
        """Test that an unauthenticated request leaves the session's user untouched."""
        session = Session.objects.create(ip='1.2.3.4')
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(session.token)

        client.get('/games.json', REMOTE_ADDR='1.2.3.4')

        session.refresh_from_db()
        assert session.user_id is None
