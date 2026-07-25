"""Tests for the AuthorizationRequestListSerializer."""

from django.test import TestCase

from accounts.models import AuthorizationRequest
from accounts.serializers import AuthorizationRequestListSerializer
from games.tests.factories import UserFactory


class TestAuthorizationRequestListSerializer(TestCase):
    """Tests for AuthorizationRequestListSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up an authorization request to serialize."""
        cls.user = UserFactory(username='alice', password='secret-password')
        cls.instance, cls.raw_token = AuthorizationRequest.create_with_token(
            user=cls.user, ip='1.2.3.4', browser='test-agent',
        )

    def test_serializes_uuid(self):
        """Test that uuid is serialized."""
        data = AuthorizationRequestListSerializer(self.instance).data
        assert data['uuid'] == str(self.instance.uuid)

    def test_serializes_created_at_status_ip_and_browser(self):
        """Test that created_at/status/ip/browser are serialized as-is."""
        data = AuthorizationRequestListSerializer(self.instance).data
        assert data['status'] == AuthorizationRequest.STATUS_OPEN
        assert data['ip'] == '1.2.3.4'
        assert data['browser'] == 'test-agent'

    def test_only_exposes_the_documented_fields(self):
        """Test that exactly uuid/created_at/status/ip/browser are exposed."""
        data = AuthorizationRequestListSerializer(self.instance).data
        assert set(data.keys()) == {'uuid', 'created_at', 'status', 'ip', 'browser'}

    def test_never_exposes_id(self):
        """Test that the internal numeric id is never exposed."""
        data = AuthorizationRequestListSerializer(self.instance).data
        assert 'id' not in data

    def test_never_exposes_token_hash(self):
        """Test that the hashed bearer token is never exposed, even hashed."""
        data = AuthorizationRequestListSerializer(self.instance).data
        assert 'token_hash' not in data
        assert 'token' not in data
        for value in data.values():
            assert value != self.instance.token_hash
            assert value != self.raw_token

    def test_never_exposes_user_or_user_id(self):
        """Test that neither user nor user_id is ever exposed."""
        data = AuthorizationRequestListSerializer(self.instance).data
        assert 'user' not in data
        assert 'user_id' not in data
