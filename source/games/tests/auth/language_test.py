"""Tests for the language preference endpoint."""

import json

import pytest
from django.contrib.auth.models import User
from django.utils.crypto import get_random_string
from rest_framework.authtoken.models import Token

TEST_PASSWORD = get_random_string(20)


@pytest.mark.django_db
class TestLanguageView:
    """Tests for the language preference endpoint."""

    def test_updates_favorite_language(self, client):
        """Test that an authenticated request updates the favorite language."""
        user = User.objects.create_user(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)

        response = client.post(
            '/users/language.json',
            data=json.dumps({'language': 'pt-BR'}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 200
        assert json.loads(response.content) == {'favorite_language': 'pt-BR'}

    def test_status_reflects_updated_language(self, client):
        """Test that status.json reflects the language set previously."""
        user = User.objects.create_user(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)

        client.post(
            '/users/language.json',
            data=json.dumps({'language': 'fr'}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        response = client.get(
            '/users/status.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['settings']['favorite_language'] == 'fr'

    def test_requires_authentication(self, client):
        """Test that the endpoint rejects unauthenticated requests."""
        response = client.post(
            '/users/language.json',
            data=json.dumps({'language': 'fr'}),
            content_type='application/json',
        )
        assert response.status_code == 401
