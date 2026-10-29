"""Tests for `StatisticsSessionMiddleware`."""

from datetime import timedelta
from unittest.mock import patch

import pytest
from django.contrib.auth.models import AnonymousUser
from django.http import HttpResponse
from django.test import RequestFactory, override_settings
from django.utils import timezone
from rest_framework.authtoken.models import Token

from domains.tests.factories import DomainFactory
from games.tests.factories import UserFactory
from majora_project.cache import memory_cache
from statistics import cookies
from statistics.middleware import StatisticsSessionMiddleware
from statistics.models import Session, Visit
from statistics.session_attachment import attach_user
from statistics.visit_tracking import track_visit


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
        """Test that a valid cookie with a matching IP reuses the session, touching it if stale."""
        session = self._stale_session(seconds_ago=120)
        original_last_seen_at = session.last_seen_at
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(session.token)

        client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert Session.objects.count() == 1
        session.refresh_from_db()
        assert session.last_seen_at > original_last_seen_at

    def test_does_not_rewrite_last_seen_at_of_a_fresh_session(self, client):
        """Test that a session seen within the touch interval is not written again."""
        session = self._stale_session(seconds_ago=10)
        original_last_seen_at = session.last_seen_at
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(session.token)

        client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        session.refresh_from_db()
        assert session.last_seen_at == original_last_seen_at

    def test_session_touch_interval_is_configurable(self, client, monkeypatch):
        """Test that a shorter configured touch interval rewrites a recently seen session."""
        monkeypatch.setenv('MAJORA_STATISTICS_SESSION_TOUCH_INTERVAL_SECONDS', '5')
        session = self._stale_session(seconds_ago=10)
        original_last_seen_at = session.last_seen_at
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(session.token)

        client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        session.refresh_from_db()
        assert session.last_seen_at > original_last_seen_at

    def test_first_request_opens_a_visit(self, client):
        """Test that a request with no cookie creates one session with one single-hit visit."""
        client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        visit = Visit.objects.get()
        assert visit.session == Session.objects.get()
        assert visit.hits == 1

    def test_request_inside_the_window_extends_the_visit(self, client):
        """Test that a second request inside the window bumps the same visit."""
        client.get('/ready.json', REMOTE_ADDR='1.2.3.4')
        first_last_seen_at = Visit.objects.get().last_seen_at

        client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        visit = Visit.objects.get()
        assert visit.hits == 2
        assert visit.last_seen_at > first_last_seen_at

    def test_request_after_the_window_opens_a_new_visit(self, client):
        """Test that a request after the inactivity window opens a second visit."""
        client.get('/ready.json', REMOTE_ADDR='1.2.3.4')
        self._age_visits(minutes=31)

        client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        session = Session.objects.get()
        assert session.visits.count() == 2
        assert list(session.visits.values_list('hits', flat=True)) == [1, 1]

    def test_visit_window_is_configurable(self, client, monkeypatch):
        """Test that a shorter configured inactivity window expires visits sooner."""
        monkeypatch.setenv('MAJORA_STATISTICS_VISIT_INACTIVITY_SECONDS', '60')
        client.get('/ready.json', REMOTE_ADDR='1.2.3.4')
        self._age_visits(minutes=2)

        client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert Visit.objects.count() == 2

    def test_ip_change_opens_a_visit_on_the_new_session(self, client):
        """Test that a rotated (IP-changed) session gets its own new visit."""
        client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        response = client.get('/ready.json', REMOTE_ADDR='9.9.9.9')

        new_session = self._session_from_response(response)
        assert new_session.ip == '9.9.9.9'
        assert new_session.visits.get().hits == 1
        assert Visit.objects.count() == 2

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

    def test_trusted_forwarded_for_header_takes_precedence_over_remote_addr(
        self, client, monkeypatch
    ):
        """Test that `X-Forwarded-For` is used over `REMOTE_ADDR` when the proxy secret matches."""
        monkeypatch.setenv('PROXY_SECRET', 'tent-secret')
        client.get(
            '/ready.json',
            REMOTE_ADDR='1.1.1.1',
            HTTP_X_FORWARDED_FOR='2.2.2.2',
            HTTP_X_PROXY_SECRET='tent-secret',
        )

        session = Session.objects.get()
        assert session.ip == '2.2.2.2'

    def test_forged_forwarded_for_without_proxy_secret_stores_remote_addr(
        self, client, monkeypatch
    ):
        """Test that a forged `X-Forwarded-For` without the proxy secret stores `REMOTE_ADDR`."""
        monkeypatch.setenv('PROXY_SECRET', 'tent-secret')
        client.get(
            '/ready.json',
            REMOTE_ADDR='1.1.1.1',
            HTTP_X_FORWARDED_FOR='2.2.2.2',
        )

        session = Session.objects.get()
        assert session.ip == '1.1.1.1'

    def test_trusted_multi_value_forwarded_for_stores_leftmost_entry(self, client, monkeypatch):
        """Test that a trusted multi-value `X-Forwarded-For` stores its leftmost entry."""
        monkeypatch.setenv('PROXY_SECRET', 'tent-secret')
        client.get(
            '/ready.json',
            REMOTE_ADDR='1.1.1.1',
            HTTP_X_FORWARDED_FOR='2.2.2.2, 3.3.3.3',
            HTTP_X_PROXY_SECRET='tent-secret',
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

    def test_login_rotation_keeps_the_hit_on_the_anonymous_session(self, client):
        """Test that the login request counts on the old session's visit, not the rotated one."""
        session = Session.objects.create(ip='1.2.3.4', domain=self.domain)
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(session.token)

        response = self._authenticated_get(client, REMOTE_ADDR='1.2.3.4')

        assert session.visits.get().hits == 1
        assert self._session_from_response(response).visits.count() == 0

    def test_request_after_login_rotation_opens_a_visit_on_the_new_session(self, client):
        """Test that the next request carrying the rotated cookie opens a visit on it."""
        session = Session.objects.create(ip='1.2.3.4', domain=self.domain)
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(session.token)
        response = self._authenticated_get(client, REMOTE_ADDR='1.2.3.4')
        new_session = self._session_from_response(response)

        client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert new_session.visits.get().hits == 1
        assert session.visits.get().hits == 1

    def test_in_place_attach_keeps_the_visit_on_the_same_session(self, client):
        """Test that a user attached in place keeps the visit on that very session."""
        self._authenticated_get(client, REMOTE_ADDR='1.2.3.4')

        user_session = Session.objects.get(user=self.user)
        assert Session.objects.count() == 1
        assert user_session.visits.get().hits == 1

    def test_ties_new_session_to_user_when_ip_changes_on_authenticated_request(self, client):
        """Test that a logged-in request with a changed IP creates one user-tied session."""
        old_session = Session.objects.create(ip='1.2.3.4', domain=self.domain)
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(old_session.token)

        response = self._authenticated_get(client, REMOTE_ADDR='9.9.9.9')

        assert Session.objects.count() == 2
        assert Session.objects.filter(user__isnull=True).get() == old_session
        self._assert_single_user_session(response, ip='9.9.9.9')

    def test_ties_new_session_to_user_when_domain_changes_on_authenticated_request(self, client):
        """Test that a logged-in request with a changed domain creates one user-tied session."""
        other_domain = DomainFactory(domain='other.example.com')
        old_session = Session.objects.create(ip='1.2.3.4', domain=other_domain)
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(old_session.token)

        response = self._authenticated_get(client, REMOTE_ADDR='1.2.3.4')

        assert Session.objects.count() == 2
        assert Session.objects.filter(user__isnull=True).get() == old_session
        self._assert_single_user_session(response, ip='1.2.3.4')

    def test_ties_new_session_to_user_when_cookie_missing_on_authenticated_request(self, client):
        """Test that a logged-in request without a cookie creates exactly one user-tied session."""
        response = self._authenticated_get(client, REMOTE_ADDR='1.2.3.4')

        assert Session.objects.count() == 1
        self._assert_single_user_session(response, ip='1.2.3.4')

    def test_ties_new_session_to_user_when_cookie_invalid_on_authenticated_request(self, client):
        """Test that a logged-in request with a tampered cookie creates one user-tied session."""
        client.cookies[cookies.COOKIE_NAME] = 'garbage-not-a-signed-value'

        response = self._authenticated_get(client, REMOTE_ADDR='1.2.3.4')

        assert Session.objects.count() == 1
        self._assert_single_user_session(response, ip='1.2.3.4')

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
        assert Visit.objects.count() == 0
        assert cookies.COOKIE_NAME not in response.cookies

    def test_export_route_is_not_tracked(self, client):
        """Test that a request to the statistics export creates no session, visit or cookie."""
        response = client.get('/staff/statistics/export.json', REMOTE_ADDR='192.0.2.1')

        assert Session.objects.count() == 0
        assert Visit.objects.count() == 0
        assert cookies.COOKIE_NAME not in response.cookies

    def test_export_route_does_not_extend_an_existing_visit(self, client):
        """Test that an export request carrying a session cookie leaves its visit untouched."""
        client.get('/ready.json', REMOTE_ADDR='192.0.2.1')

        client.get('/staff/statistics/export.json', REMOTE_ADDR='192.0.2.1')

        assert Visit.objects.get().hits == 1

    @pytest.mark.parametrize('path', [
        '/staff/statistics/visits.json',
        '/staff/statistics/export.json/',
        '/staff/statistics/export.jsonx',
        '/staff/statistics/export',
        '/staff/statistics.json',
    ])
    def test_exemption_is_exact(self, client, path):
        """Test that only the exact export path escapes tracking, never a sibling or variant."""
        client.get(path, REMOTE_ADDR='192.0.2.1')

        assert Session.objects.count() == 1
        assert Visit.objects.count() == 1

    def test_skipped_request_does_not_extend_an_existing_visit(self, client, monkeypatch):
        """Test that a skipped request carrying a session cookie leaves its visit untouched."""
        monkeypatch.setenv('STATISTICS_SKIP_SECRET', 'shh')
        client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        client.get('/ready.json', REMOTE_ADDR='1.2.3.4', HTTP_X_STATISTICS_SKIP_SECRET='shh')

        assert Visit.objects.get().hits == 1

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

    def test_creates_session_when_skip_header_non_ascii(self, client, monkeypatch):
        """Test that a non-ASCII skip header falls through to normal recording, never a 500."""
        monkeypatch.setenv('STATISTICS_SKIP_SECRET', 'shh')

        response = client.get(
            '/ready.json',
            REMOTE_ADDR='1.2.3.4',
            HTTP_X_STATISTICS_SKIP_SECRET='\xe9',
        )

        assert response.status_code == 200
        assert Session.objects.count() == 1

    def test_non_ascii_proxy_secret_records_remote_addr(self, client, monkeypatch):
        """Test that a non-ASCII proxy secret header records REMOTE_ADDR, never a 500."""
        monkeypatch.setenv('PROXY_SECRET', 'tent-secret')

        response = client.get(
            '/ready.json',
            REMOTE_ADDR='1.2.3.4',
            HTTP_X_PROXY_SECRET='\xe9',
            HTTP_X_FORWARDED_FOR='5.6.7.8',
        )

        assert response.status_code == 200
        assert Session.objects.get().ip == '1.2.3.4'

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

    def test_session_deleted_before_the_touch_does_not_fail(self, client):
        """Test that a stale cookie session deleted before its touch yields 200 and no visit."""
        session = self._stale_session(seconds_ago=120)
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(session.token)
        original = StatisticsSessionMiddleware._session_from_cookie

        def load_then_delete(middleware, request):
            loaded, reason = original(middleware, request)
            self._delete_session_row(loaded)
            return loaded, reason

        with patch.object(StatisticsSessionMiddleware, '_session_from_cookie', load_then_delete):
            response = client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert response.status_code == 200
        assert not Visit.objects.filter(session_id=session.pk).exists()

    def test_session_deleted_before_the_track_does_not_fail(self, client):
        """Test that a cookie session deleted right before visit tracking yields 200, no visit."""
        session = Session.objects.create(ip='1.2.3.4', domain=self.domain)
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(session.token)

        with patch('statistics.middleware.track_visit', self._deleting_first(track_visit)):
            response = client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert response.status_code == 200
        assert not Visit.objects.filter(session_id=session.pk).exists()

    def test_session_deleted_before_user_attachment_rotates_to_a_new_one(self, client):
        """Test that a session deleted before attachment yields 200 and a new user session."""
        session = Session.objects.create(ip='1.2.3.4', domain=self.domain)
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(session.token)

        with patch('statistics.middleware.attach_user', self._deleting_first(attach_user)):
            response = self._authenticated_get(client, REMOTE_ADDR='1.2.3.4')

        assert response.status_code == 200
        assert not Session.objects.filter(pk=session.pk).exists()
        self._assert_single_user_session(response, ip='1.2.3.4')

    def test_stale_cookie_after_a_clear_starts_a_new_session(self, client):
        """Test that a cookie whose session was cleared gets a new session and one visit."""
        first_response = client.get('/ready.json', REMOTE_ADDR='1.2.3.4')
        old_token = cookies.unsign(first_response.cookies[cookies.COOKIE_NAME].value)
        Session.objects.all().delete()

        response = client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert response.status_code == 200
        new_session = self._session_from_response(response)
        assert new_session.token != old_token
        assert new_session.visits.get().hits == 1

    def _deleting_first(self, function):
        """Wrap `function` so it deletes its `session` argument's row before running."""
        def wrapper(session, *args, **kwargs):
            self._delete_session_row(session)
            return function(session, *args, **kwargs)

        return wrapper

    def _delete_session_row(self, session):
        """Delete `session`'s row while keeping the in-memory instance and its pk."""
        Session.objects.filter(pk=session.pk).delete()

    def _stale_session(self, seconds_ago):
        """Return a session for '1.2.3.4' on `self.domain` last seen `seconds_ago` seconds ago."""
        session = Session.objects.create(ip='1.2.3.4', domain=self.domain)
        seen_at = timezone.now() - timedelta(seconds=seconds_ago)
        Session.objects.filter(pk=session.pk).update(last_seen_at=seen_at)
        session.refresh_from_db()
        return session

    def _age_visits(self, minutes):
        """Push every visit's `last_seen_at` `minutes` minutes into the past."""
        Visit.objects.update(last_seen_at=timezone.now() - timedelta(minutes=minutes))

    def _session_from_response(self, response):
        """Return the `Session` whose token is carried by `response`'s statistics cookie."""
        token = cookies.unsign(response.cookies[cookies.COOKIE_NAME].value)
        return Session.objects.get(token=token)

    def _authenticated_get(self, client, **extra):
        """Issue an authenticated GET to `/games.json` as a fresh user stored on `self.user`."""
        self.user = UserFactory(username='alice')
        token = Token.objects.create(user=self.user)
        return client.get('/games.json', HTTP_AUTHORIZATION=f'Token {token.key}', **extra)

    def _assert_single_user_session(self, response, ip):
        """Assert exactly one session is tied to `self.user` and the cookie carries its token."""
        user_session = Session.objects.get(user=self.user)
        assert user_session.ip == ip
        assert user_session.domain_id == self.domain.id
        signed_value = response.cookies[cookies.COOKIE_NAME].value
        assert cookies.unsign(signed_value) == user_session.token


@pytest.mark.django_db
class TestStatisticsSessionMiddlewareCreationTracking:
    """Tests for the creation reason, first path and logged state recorded on new sessions."""

    def setup_method(self):
        """Clear the shared memory cache and register 'testserver' as a known domain."""
        memory_cache.clear()
        self.domain = DomainFactory(domain='testserver')
        self.factory = RequestFactory()

    def test_no_cookie_reason(self, client):
        """Test that a request without a cookie records `no_cookie`."""
        response = client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert self._new_session(response).creation_reason == 'no_cookie'

    def test_invalid_cookie_reason(self, client):
        """Test that a cookie failing to unsign records `invalid_cookie`."""
        client.cookies[cookies.COOKIE_NAME] = 'garbage-not-a-signed-value'

        response = client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert self._new_session(response).creation_reason == 'invalid_cookie'

    def test_cookie_session_not_found_reason(self, client):
        """Test that a valid token with no matching row records `cookie_session_not_found`."""
        client.cookies[cookies.COOKIE_NAME] = cookies.sign('fake-token-without-a-row')

        response = client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert self._new_session(response).creation_reason == 'cookie_session_not_found'

    def test_domain_changed_reason(self, client):
        """Test that a cookie session from another domain records `domain_changed`."""
        self._cookie_for(client, ip='1.2.3.4', domain=DomainFactory(domain='other.example.com'))

        response = client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert self._new_session(response).creation_reason == 'domain_changed'

    def test_ip_changed_reason(self, client):
        """Test that a same-domain cookie session with another IP records `ip_changed`."""
        self._cookie_for(client, ip='1.2.3.4', domain=self.domain)

        response = client.get('/ready.json', REMOTE_ADDR='9.9.9.9')

        assert self._new_session(response).creation_reason == 'ip_changed'

    def test_domain_and_ip_changed_records_domain_changed(self, client):
        """Test that both the domain and the IP differing records `domain_changed`."""
        self._cookie_for(client, ip='1.2.3.4', domain=DomainFactory(domain='other.example.com'))

        response = client.get('/ready.json', REMOTE_ADDR='9.9.9.9')

        assert self._new_session(response).creation_reason == 'domain_changed'

    def test_cookie_for_another_domain_is_not_reused(self, client):
        """Test that a cookie session from another domain is still never reused."""
        old_session = self._cookie_for(
            client, ip='1.2.3.4', domain=DomainFactory(domain='other.example.com'),
        )

        response = client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert self._new_session(response).pk != old_session.pk
        assert Session.objects.count() == 2

    def test_reused_session_keeps_its_tracking_columns(self, client):
        """Test that reusing a session does not rewrite its creation columns."""
        old_session = self._cookie_for(client, ip='1.2.3.4', domain=self.domain)

        client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        old_session.refresh_from_db()
        assert old_session.creation_reason is None
        assert old_session.first_path is None
        assert old_session.first_seen_logged is None

    def test_first_path_stores_the_route_pattern(self, client):
        """Test that `first_path` stores the matched route pattern."""
        response = client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert self._new_session(response).first_path == 'ready.json'

    def test_first_path_never_stores_the_query_string(self, client):
        """Test that `first_path` never carries the query string."""
        response = client.get('/ready.json?secret=fake-secret', REMOTE_ADDR='1.2.3.4')

        assert self._new_session(response).first_path == 'ready.json'

    def test_first_path_is_unresolved_for_a_404(self, client):
        """Test that a path matching no route stores the `unresolved` marker."""
        response = client.get('/no/such/path.php', REMOTE_ADDR='1.2.3.4')

        assert response.status_code == 404
        assert self._new_session(response).first_path == 'unresolved'

    def test_anonymous_creation_is_not_logged(self, client):
        """Test that a session created for an anonymous request records `false`."""
        response = client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert self._new_session(response).first_seen_logged is False

    def test_authenticated_creation_is_logged(self, client):
        """Test that a session created for an already-authenticated request records `true`."""
        client.force_login(UserFactory(username='alice'))

        response = client.get('/ready.json', REMOTE_ADDR='1.2.3.4')

        assert self._new_session(response).first_seen_logged is True

    def test_cookie_lookup_is_a_single_query(self, django_assert_num_queries):
        """Test that resolving the cookie session issues exactly one query."""
        session = Session.objects.create(ip='1.2.3.4', domain=self.domain)
        request = self.factory.get('/ready.json')
        request.COOKIES[cookies.COOKIE_NAME] = cookies.sign(session.token)
        middleware = StatisticsSessionMiddleware(lambda request: None)

        with django_assert_num_queries(1):
            assert middleware._session_from_cookie(request) == (session, None)

    def test_create_path_query_count(self, django_assert_num_queries):
        """Test that creating a session (domain, insert, visit open) adds no query."""
        request = self._anonymous_request(self.factory.get('/ready.json', REMOTE_ADDR='1.2.3.4'))
        middleware = StatisticsSessionMiddleware(lambda request: HttpResponse())

        with django_assert_num_queries(5):
            middleware(request)

    def test_reuse_and_extend_path_query_count(self, django_assert_num_queries):
        """Test that reusing a fresh session and extending its visit adds no query."""
        session = Session.objects.create(ip='1.2.3.4', domain=self.domain)
        track_visit(session)
        request = self._anonymous_request(self.factory.get('/ready.json', REMOTE_ADDR='1.2.3.4'))
        request.COOKIES[cookies.COOKIE_NAME] = cookies.sign(session.token)
        middleware = StatisticsSessionMiddleware(lambda request: HttpResponse())

        with django_assert_num_queries(4):
            middleware(request)

    def test_skipped_request_computes_no_route(self, monkeypatch):
        """Test that a skip-header request neither computes nor stores a route."""
        monkeypatch.setenv('STATISTICS_SKIP_SECRET', 'shh')
        request = self.factory.get('/ready.json', HTTP_X_STATISTICS_SKIP_SECRET='shh')
        middleware = StatisticsSessionMiddleware(lambda request: HttpResponse())

        with patch('statistics.middleware.route_pattern') as route_pattern:
            middleware(request)

        route_pattern.assert_not_called()
        assert request.statistics_route is None
        assert Session.objects.count() == 0

    def test_untracked_path_computes_no_route(self):
        """Test that an untracked path neither computes nor stores a route."""
        request = self.factory.get('/staff/statistics/export.json')
        middleware = StatisticsSessionMiddleware(lambda request: HttpResponse())

        with patch('statistics.middleware.route_pattern') as route_pattern:
            middleware(request)

        route_pattern.assert_not_called()
        assert request.statistics_route is None
        assert Session.objects.count() == 0

    def test_backfill_in_the_creating_request_marks_logged(self, client):
        """Test that an in-place back-fill on a session created this request records `true`."""
        response = self._token_get(client, REMOTE_ADDR='1.2.3.4')

        session = self._new_session(response)
        assert session.user_id is not None
        assert session.creation_reason == 'no_cookie'
        assert session.first_seen_logged is True

    def test_backfill_rotation_records_login_rotation(self, client):
        """Test that a back-fill rotation records `login_rotation`, `true` and its route."""
        old_session = self._cookie_for(client, ip='1.2.3.4', domain=self.domain)

        response = self._token_get(client, REMOTE_ADDR='1.2.3.4')

        rotated = self._new_session(response)
        assert rotated.pk != old_session.pk
        assert rotated.creation_reason == 'login_rotation'
        assert rotated.first_seen_logged is True
        assert rotated.first_path == 'games.json'

    def test_backfill_rotation_leaves_the_earlier_session_untouched(self, client):
        """Test that the rotated-away anonymous session keeps its own tracking columns."""
        old_session = Session.objects.create(
            ip='1.2.3.4', domain=self.domain, first_seen_logged=False,
        )
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(old_session.token)

        self._token_get(client, REMOTE_ADDR='1.2.3.4')

        old_session.refresh_from_db()
        assert old_session.user_id is None
        assert old_session.first_seen_logged is False

    def _token_get(self, client, **extra):
        """Issue a token-authenticated GET to `/games.json` as a fresh user."""
        token = Token.objects.create(user=UserFactory(username='alice'))
        return client.get('/games.json', HTTP_AUTHORIZATION=f'Token {token.key}', **extra)

    def _cookie_for(self, client, ip, domain):
        """Create a session for `ip`/`domain` and put its signed token in the client cookie."""
        session = Session.objects.create(ip=ip, domain=domain)
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(session.token)
        return session

    def _anonymous_request(self, request):
        """Return `request` carrying an anonymous `user`, as `AuthenticationMiddleware` would."""
        request.user = AnonymousUser()
        return request

    def _new_session(self, response):
        """Return the `Session` whose token is carried by `response`'s statistics cookie."""
        token = cookies.unsign(response.cookies[cookies.COOKIE_NAME].value)
        return Session.objects.get(token=token)
