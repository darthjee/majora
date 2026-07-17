"""Tests for the my-account endpoint (GET detail / PATCH update)."""

import hashlib
import json

from django.test import TestCase
from django.urls import reverse
from django.utils.crypto import get_random_string
from rest_framework.authtoken.models import Token

from games.settings import Settings
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import UserFactory


def _avatar_url_for(email):
    """Return the expected avatar_url for the given email."""
    email_hash = hashlib.sha256(email.encode()).hexdigest()
    return f'{Settings.gravatar_base_url()}{email_hash}'

TEST_PASSWORD = get_random_string(20)

ACCOUNT_URL = '/users/account.json'


class TestAccountView(TokenAuthRequestMixin, TestCase):
    """Tests for the GET /users/account.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a requesting user and another user."""
        cls.user = UserFactory(
            username='alice', password=TEST_PASSWORD, email='alice@example.com'
        )
        cls.token = Token.objects.create(user=cls.user)
        cls.other_user = UserFactory(
            username='bob', password=TEST_PASSWORD, email='bob@example.com'
        )

    def test_unauthenticated_returns_401(self):
        """Test that an unauthenticated GET returns 401."""
        response = self.get(self.client, ACCOUNT_URL)
        assert response.status_code == 401

    def test_authenticated_returns_own_detail(self):
        """Test that an authenticated GET returns the requester's own name/email."""
        response = self.get(self.client, ACCOUNT_URL, token=self.token)
        assert response.status_code == 200
        assert json.loads(response.content) == {
            'name': 'alice',
            'first_name': '',
            'last_name': '',
            'email': 'alice@example.com',
            'avatar_url': _avatar_url_for('alice@example.com'),
        }

    def test_authenticated_never_returns_another_users_detail(self):
        """Test that the endpoint never returns another user's data."""
        response = self.get(self.client, ACCOUNT_URL, token=self.token)
        data = json.loads(response.content)
        assert data['name'] != self.other_user.username
        assert data['email'] != self.other_user.email

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('users-account')
        response = self.client.get(url, HTTP_AUTHORIZATION=f'Token {self.token.key}')
        assert response.status_code == 200

    def test_authenticated_returns_skip_cache_header(self):
        """Test that the GET response includes the X-Skip-Cache: true header."""
        response = self.get(self.client, ACCOUNT_URL, token=self.token)
        assert response['X-Skip-Cache'] == 'true'


class TestAccountPatchView(TokenAuthRequestMixin, TestCase):
    """Tests for the PATCH /users/account.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a requesting user and another user."""
        cls.user = UserFactory(
            username='alice', password=TEST_PASSWORD, email='alice@example.com'
        )
        cls.token = Token.objects.create(user=cls.user)
        cls.other_user = UserFactory(
            username='bob', password=TEST_PASSWORD, email='bob@example.com'
        )

    def _patch(self, client, payload, token=None):
        """Issue a PATCH request to the account endpoint, optionally with a token."""
        return self.patch(client, ACCOUNT_URL, payload, token=token)

    def test_unauthenticated_returns_401(self):
        """Test that PATCH without a token returns 401."""
        response = self._patch(self.client, {'name': 'renamed', 'email': 'renamed@example.com'})
        assert response.status_code == 401

    def test_valid_name_and_email_update(self):
        """Test that valid name/email (no password) updates the account."""
        response = self._patch(
            self.client, {'name': 'renamed', 'email': 'renamed@example.com'}, token=self.token
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data == {
            'name': 'renamed',
            'first_name': '',
            'last_name': '',
            'email': 'renamed@example.com',
            'avatar_url': _avatar_url_for('renamed@example.com'),
        }

    def test_valid_update_persists_and_keeps_password(self):
        """Test that name/email updates persist and the password stays untouched."""
        self._patch(
            self.client, {'name': 'renamed', 'email': 'renamed@example.com'}, token=self.token
        )
        self.user.refresh_from_db()
        assert self.user.username == 'renamed'
        assert self.user.email == 'renamed@example.com'
        assert self.user.check_password(TEST_PASSWORD)

    def test_matching_password_confirmation_changes_password(self):
        """Test that a matching password/password_confirmation changes the password."""
        new_password = get_random_string(20)
        response = self._patch(
            self.client,
            {
                'name': 'alice', 'email': 'alice@example.com',
                'password': new_password, 'password_confirmation': new_password,
            },
            token=self.token,
        )
        assert response.status_code == 200
        self.user.refresh_from_db()
        assert self.user.check_password(new_password)

    def test_password_without_confirmation_returns_400(self):
        """Test that setting password without a matching confirmation returns 400."""
        response = self._patch(
            self.client,
            {
                'name': 'alice', 'email': 'alice@example.com',
                'password': get_random_string(20),
            },
            token=self.token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'password_confirmation' in data['errors']

    def test_confirmation_without_password_returns_400(self):
        """Test that setting a confirmation without a password returns 400."""
        response = self._patch(
            self.client,
            {
                'name': 'alice', 'email': 'alice@example.com',
                'password_confirmation': get_random_string(20),
            },
            token=self.token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'password_confirmation' in data['errors']

    def test_blank_password_and_confirmation_keeps_password_unchanged(self):
        """Test that leaving both password fields blank succeeds and keeps the password."""
        response = self._patch(
            self.client,
            {
                'name': 'alice', 'email': 'alice@example.com',
                'password': '', 'password_confirmation': '',
            },
            token=self.token,
        )
        assert response.status_code == 200
        self.user.refresh_from_db()
        assert self.user.check_password(TEST_PASSWORD)

    def test_missing_name_returns_400(self):
        """Test that a PATCH missing name returns 400."""
        response = self._patch(self.client, {'email': 'renamed@example.com'}, token=self.token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_missing_email_returns_400(self):
        """Test that a PATCH missing email returns 400."""
        response = self._patch(self.client, {'name': 'renamed'}, token=self.token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'email' in data['errors']

    def test_duplicate_name_returns_400(self):
        """Test that reusing another user's name returns 400."""
        response = self._patch(
            self.client, {'name': 'bob', 'email': 'alice@example.com'}, token=self.token
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_duplicate_email_returns_400(self):
        """Test that reusing another user's email returns 400."""
        response = self._patch(
            self.client, {'name': 'alice', 'email': 'bob@example.com'}, token=self.token
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'email' in data['errors']

    def test_keeping_own_current_name_and_email_succeeds(self):
        """Test that resubmitting the requester's own current name/email succeeds."""
        response = self._patch(
            self.client, {'name': 'alice', 'email': 'alice@example.com'}, token=self.token
        )
        assert response.status_code == 200

    def test_valid_update_returns_skip_cache_header(self):
        """Test that the PATCH success response includes the X-Skip-Cache: true header."""
        response = self._patch(
            self.client, {'name': 'renamed', 'email': 'renamed@example.com'}, token=self.token
        )
        assert response['X-Skip-Cache'] == 'true'

    def test_never_updates_another_user(self):
        """Test that no user id is accepted, and the other user's account stays untouched."""
        self._patch(
            self.client,
            {'name': 'renamed', 'email': 'renamed@example.com', 'id': self.other_user.id},
            token=self.token,
        )
        self.other_user.refresh_from_db()
        assert self.other_user.username == 'bob'
        assert self.other_user.email == 'bob@example.com'
