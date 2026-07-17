"""Tests for the MyAccountDetailSerializer."""

import hashlib

from django.test import TestCase

from games.serializers import MyAccountDetailSerializer
from games.settings import Settings
from games.tests.factories import UserFactory


class TestMyAccountDetailSerializer(TestCase):
    """Tests for MyAccountDetailSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up a user instance for testing."""
        cls.user = UserFactory(
            username='alice', password='secret-password', email='alice@example.com'
        )

    def test_serializes_name_from_username(self):
        """Test that the name field is sourced from username."""
        data = MyAccountDetailSerializer(self.user).data
        assert data['name'] == 'alice'

    def test_serializes_email(self):
        """Test that the email field is serialized."""
        data = MyAccountDetailSerializer(self.user).data
        assert data['email'] == 'alice@example.com'

    def test_serializes_first_and_last_name(self):
        """Test that first_name and last_name are serialized as-is."""
        user = UserFactory(
            username='carol', password='secret-password', first_name='Alice', last_name='Smith',
        )
        data = MyAccountDetailSerializer(user).data
        assert data['first_name'] == 'Alice'
        assert data['last_name'] == 'Smith'

    def test_first_and_last_name_default_to_empty_string(self):
        """Test that first_name/last_name serialize as '' when not set."""
        data = MyAccountDetailSerializer(self.user).data
        assert data['first_name'] == ''
        assert data['last_name'] == ''

    def test_only_exposes_expected_fields(self):
        """Test that only name, first_name, last_name, email, and avatar_url are exposed."""
        data = MyAccountDetailSerializer(self.user).data
        assert set(data.keys()) == {'name', 'first_name', 'last_name', 'email', 'avatar_url'}

    def test_serializes_avatar_url_from_email_hash(self):
        """Test that avatar_url is built from the Gravatar base URL and email_hash."""
        expected_hash = hashlib.sha256(b'alice@example.com').hexdigest()
        data = MyAccountDetailSerializer(self.user).data
        assert data['avatar_url'] == f'{Settings.gravatar_base_url()}{expected_hash}'

    def test_avatar_url_is_none_when_user_has_no_email(self):
        """Test that avatar_url is null when the user has no email."""
        user = UserFactory(username='bob', password='secret-password', email='')
        data = MyAccountDetailSerializer(user).data
        assert data['avatar_url'] is None
