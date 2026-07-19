"""Tests for the login endpoint."""

import json

import pytest
from django.utils.crypto import get_random_string
from rest_framework.authtoken.models import Token

from games.tests.factories import UserFactory
from statistics import cookies
from statistics.models import Session

TEST_PASSWORD = get_random_string(20)


@pytest.mark.django_db
class TestLoginView:
    """Tests for the login endpoint."""

    def test_returns_token_for_valid_credentials(self, client):
        """Test that a valid login returns a token."""
        UserFactory(username='alice', password=TEST_PASSWORD)
        response = client.post(
            '/users/login.json',
            data=json.dumps({'username': 'alice', 'password': TEST_PASSWORD}),
            content_type='application/json',
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert 'token' in data
        assert Token.objects.filter(key=data['token'], user__username='alice').exists()

    def test_returns_unauthorized_for_invalid_credentials(self, client):
        """Test that invalid credentials are rejected."""
        UserFactory(username='alice', password=TEST_PASSWORD)
        response = client.post(
            '/users/login.json',
            data=json.dumps({'username': 'alice', 'password': 'wrong'}),
            content_type='application/json',
        )
        assert response.status_code == 401

    def test_stores_token_in_session_on_success(self, client):
        """Test that a successful login stores the auth token in the session."""
        UserFactory(username='alice', password=TEST_PASSWORD)
        response = client.post(
            '/users/login.json',
            data=json.dumps({'username': 'alice', 'password': TEST_PASSWORD}),
            content_type='application/json',
        )
        data = json.loads(response.content)
        assert client.session['auth_token'] == data['token']

    def test_attaches_user_to_fresh_anonymous_session_keeping_same_cookie(self, client):
        """Test that logging in with a fresh anonymous session sets its user, same cookie."""
        UserFactory(username='alice', password=TEST_PASSWORD)
        pre_login_response = client.get('/ready.json')
        pre_login_cookie = pre_login_response.cookies[cookies.COOKIE_NAME].value
        session = Session.objects.get(token=cookies.unsign(pre_login_cookie))
        assert session.user_id is None

        response = client.post(
            '/users/login.json',
            data=json.dumps({'username': 'alice', 'password': TEST_PASSWORD}),
            content_type='application/json',
        )

        post_login_cookie = response.cookies[cookies.COOKIE_NAME].value
        assert post_login_cookie == pre_login_cookie
        session.refresh_from_db()
        assert session.user.username == 'alice'

    def test_creates_new_session_when_current_one_already_has_a_user(self, client):
        """Test that logging in with an already-user-tied session rotates to a new one."""
        user = UserFactory(username='alice', password=TEST_PASSWORD)
        existing_session = Session.objects.create(ip='1.2.3.4', user=user)
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(existing_session.token)

        response = client.post(
            '/users/login.json',
            data=json.dumps({'username': 'alice', 'password': TEST_PASSWORD}),
            content_type='application/json',
            REMOTE_ADDR='1.2.3.4',
        )

        post_login_cookie = response.cookies[cookies.COOKIE_NAME].value
        assert cookies.unsign(post_login_cookie) != existing_session.token
        new_session = Session.objects.get(token=cookies.unsign(post_login_cookie))
        assert new_session.user_id == user.id
        assert new_session.id != existing_session.id

    def test_creates_new_session_when_same_user_logs_in_again(self, client):
        """Test that a same-user re-login still rotates to a brand-new session."""
        user = UserFactory(username='alice', password=TEST_PASSWORD)
        existing_session = Session.objects.create(ip='1.2.3.4', user=user)
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(existing_session.token)

        response = client.post(
            '/users/login.json',
            data=json.dumps({'username': 'alice', 'password': TEST_PASSWORD}),
            content_type='application/json',
            REMOTE_ADDR='1.2.3.4',
        )

        post_login_cookie = response.cookies[cookies.COOKIE_NAME].value
        assert cookies.unsign(post_login_cookie) != existing_session.token
