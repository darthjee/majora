"""Tests for `StatisticsSessionMiddleware`."""

import pytest
from django.test import override_settings
from rest_framework.authtoken.models import Token

from domains.tests.factories import DomainFactory
from games.tests.factories import UserFactory
from majora_project.cache import memory_cache
from statistics import cookies
from statistics.models import Session


@pytest.mark.django_db
class TestStatisticsSessionMiddleware:
    """Tests for `StatisticsSessionMiddleware`."""

    def setup_method(self):
        """Clear the shared memory cache and register 'testserver' as a known domain.

        Some tests below use `/games.json` only as a stand-in authenticated endpoint to
        exercise the session-backfill middleware, so it needs a registered domain matching
        the test client's default `Host: testserver` to resolve at all.
        """
        memory_cache.clear()
        self.domain = DomainFactory(domain='testserver')

    def test_creates_session_when_no_cookie_present(self, client):
        """Test that a request with no cookie creates a new session and sets a cookie."""
        response = client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert Session.objects.count() == 1
        session = Session.objects.get()
        assert session.ip == '1.2.3.4'
        assert cookies.COOKIE_NAME in response.cookies
        signed_value = response.cookies[cookies.COOKIE_NAME].value
        assert cookies.unsign(signed_value) == session.token

    def test_attaches_the_resolved_domain_on_creation(self, client):
        """Test that a session created for a registered host's request carries its domain."""
        client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        session = Session.objects.get()
        assert session.domain_id == self.domain.id

    @override_settings(ALLOWED_HOSTS=['*'])
    def test_creates_session_with_no_domain_for_an_unrecognized_host(self, client):
        """Test that a session created for an unregistered host's request has no domain."""
        client.get('/ready.json', REMOTE_ADDR='1.2.3.4', HTTP_HOST='unregistered.example.com')

        session = Session.objects.get()
        assert session.domain_id is None

    def test_reuses_session_when_cookie_ip_matches(self, client):
        """Test that a valid cookie with a matching IP reuses the same session row."""
        session = Session.objects.create(ip='1.2.3.4', domain=self.domain)
        original_last_seen_at = session.last_seen_at
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(session.token)

        client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert Session.objects.count() == 1
        session.refresh_from_db()
        assert session.last_seen_at > original_last_seen_at

    def test_creates_new_session_when_cookie_ip_differs(self, client):
        """Test that a valid cookie with a mismatched IP rotates to a brand-new session."""
        old_session = Session.objects.create(ip='1.2.3.4', domain=self.domain)
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

    def test_creates_new_session_when_cookie_domain_differs(self, client):
        """Test that a valid cookie with a mismatched domain rotates to a brand-new session."""
        other_domain = DomainFactory(domain='other.example.com')
        old_session = Session.objects.create(ip='1.2.3.4', domain=other_domain)
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(old_session.token)

        response = client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert Session.objects.count() == 2
        old_session.refresh_from_db()
        assert old_session.domain_id == other_domain.id
        new_signed_value = response.cookies[cookies.COOKIE_NAME].value
        new_token = cookies.unsign(new_signed_value)
        assert new_token != old_session.token
        new_session = Session.objects.get(token=new_token)
        assert new_session.domain_id == self.domain.id

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
        """Test that an authenticated request rotates an anonymous session to a new one."""
        user = UserFactory(username='alice')
        token = Token.objects.create(user=user)
        session = Session.objects.create(ip='1.2.3.4', domain=self.domain)
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(session.token)

        response = client.get(
            '/games.json',
            REMOTE_ADDR='1.2.3.4',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert Session.objects.count() == 2
        post_cookie = response.cookies[cookies.COOKIE_NAME].value
        new_token = cookies.unsign(post_cookie)
        assert new_token != session.token
        new_session = Session.objects.get(token=new_token)
        assert new_session.user_id == user.id
        assert new_session.ip == '1.2.3.4'
        session.refresh_from_db()
        assert session.user_id is None

    def test_leaves_session_untouched_when_already_tied_to_a_different_user(self, client):
        """Test that a session already tied to a user is not reattached/rotated on later hits."""
        other_user = UserFactory(username='bob')
        existing_session = Session.objects.create(ip='1.2.3.4', user=other_user, domain=self.domain)
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
        session = Session.objects.create(ip='1.2.3.4', domain=self.domain)
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(session.token)

        client.get('/games.json', REMOTE_ADDR='1.2.3.4')

        session.refresh_from_db()
        assert session.user_id is None

    def test_skips_session_when_valid_skip_header_present(self, client, monkeypatch):
        """Test that a request with a matching skip header creates no session or cookie."""
        monkeypatch.setenv('STATISTICS_SKIP_SECRET', 'shh')

        response = client.get(
            '/ready.json',
            REMOTE_ADDR='1.2.3.4',
            HTTP_X_STATISTICS_SKIP_SECRET='shh',
        )

        assert Session.objects.count() == 0
        assert cookies.COOKIE_NAME not in response.cookies

    def test_creates_session_when_skip_header_missing(self, client, monkeypatch):
        """Test that a request with no skip header is recorded as today, secret configured."""
        monkeypatch.setenv('STATISTICS_SKIP_SECRET', 'shh')

        client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert Session.objects.count() == 1

    def test_creates_session_when_skip_header_wrong_value(self, client, monkeypatch):
        """Test that a wrong skip header value falls through to normal recording."""
        monkeypatch.setenv('STATISTICS_SKIP_SECRET', 'shh')

        response = client.get(
            '/ready.json',
            REMOTE_ADDR='1.2.3.4',
            HTTP_X_STATISTICS_SKIP_SECRET='wrong',
        )

        assert response.status_code == 200
        assert Session.objects.count() == 1

    def test_creates_session_when_skip_secret_not_configured(self, client, monkeypatch):
        """Test that an unset skip secret always falls through to normal recording."""
        monkeypatch.delenv('STATISTICS_SKIP_SECRET', raising=False)

        response = client.get(
            '/ready.json',
            REMOTE_ADDR='1.2.3.4',
            HTTP_X_STATISTICS_SKIP_SECRET='whatever',
        )

        assert response.status_code == 200
        assert Session.objects.count() == 1

    def test_no_crash_when_skip_header_used_on_authenticated_request(self, client, monkeypatch):
        """Test that the skip header on an authenticated request does not crash `_backfill_user`."""
        monkeypatch.setenv('STATISTICS_SKIP_SECRET', 'shh')
        user = UserFactory(username='alice')
        token = Token.objects.create(user=user)

        response = client.get(
            '/games.json',
            REMOTE_ADDR='1.2.3.4',
            HTTP_AUTHORIZATION=f'Token {token.key}',
            HTTP_X_STATISTICS_SKIP_SECRET='shh',
        )

        assert response.status_code == 200
        assert Session.objects.count() == 0
