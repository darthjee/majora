"""Tests for the common.auth_checks module."""

import pytest
from django.contrib.auth.models import AnonymousUser
from rest_framework.test import APIRequestFactory

from common.auth_checks import UNAUTHENTICATED_RESPONSE_DATA, unauthenticated_response
from games.tests.factories import UserFactory


def _request(user):
    """Build a fake GET request carrying the given `user`."""
    factory = APIRequestFactory()
    request = factory.get('/fake/')
    request.user = user
    return request


@pytest.mark.django_db
class TestUnauthenticatedResponse:
    """Tests for unauthenticated_response()."""

    def test_returns_401_response_for_anonymous_user(self):
        """Test that an anonymous user gets a 401 error response."""
        response = unauthenticated_response(_request(AnonymousUser()))
        assert response.status_code == 401
        assert response.data == UNAUTHENTICATED_RESPONSE_DATA

    def test_returns_401_response_for_none_user(self):
        """Test that a None user gets a 401 error response."""
        response = unauthenticated_response(_request(None))
        assert response.status_code == 401

    def test_returns_none_for_authenticated_user(self):
        """Test that an authenticated user passes the check."""
        user = UserFactory(username='bob', password='secret-password')
        assert unauthenticated_response(_request(user)) is None
