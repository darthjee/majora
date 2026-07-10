"""Tests for BaseAccessSerializer's shared is_staff resolution."""

import pytest
from django.contrib.auth.models import AnonymousUser
from rest_framework.test import APIRequestFactory

from games.serializers import GameAccessSerializer
from games.tests.factories import UserFactory


def _make_request(user):
    """Build a request with the given user attached."""
    factory = APIRequestFactory()
    request = factory.get('/')
    request.user = user
    return request


@pytest.mark.django_db
class TestBaseAccessSerializerIsStaff:
    """Tests for BaseAccessSerializer's _get_is_staff(), exercised via a concrete subclass."""

    def test_staff_user_returns_true(self):
        """Test that a staff user gets is_staff True."""
        staff_user = UserFactory(username='staffer', password='secret-password', is_staff=True)
        request = _make_request(staff_user)
        data = GameAccessSerializer(None, context={'request': request}).data
        assert data['is_staff'] is True

    def test_non_staff_user_returns_false(self):
        """Test that a non-staff authenticated user gets is_staff False."""
        user = UserFactory(username='player', password='secret-password')
        request = _make_request(user)
        data = GameAccessSerializer(None, context={'request': request}).data
        assert data['is_staff'] is False

    def test_unauthenticated_returns_none(self):
        """Test that an unauthenticated request gets is_staff None."""
        request = _make_request(AnonymousUser())
        data = GameAccessSerializer(None, context={'request': request}).data
        assert data['is_staff'] is None
