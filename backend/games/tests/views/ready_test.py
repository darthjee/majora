"""Tests for the readiness check view."""

import json

import pytest


@pytest.mark.django_db
class TestReadyView:
    """Tests for the readiness check endpoint."""

    def test_returns_200(self, client):
        """Test that GET /ready.json returns HTTP 200."""
        response = client.get('/ready.json')
        assert response.status_code == 200

    def test_returns_status_ok(self, client):
        """Test that the response body is {"status": "ok"}."""
        response = client.get('/ready.json')
        assert json.loads(response.content) == {'status': 'ok'}

    def test_does_not_require_authentication(self, client):
        """Test that an unauthenticated request still returns 200."""
        response = client.get('/ready.json')
        assert response.status_code == 200

    def test_sets_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = client.get('/ready.json')
        assert response['X-Skip-Cache'] == 'true'
