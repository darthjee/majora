"""Tests for the health check view."""

import json

import pytest


@pytest.mark.django_db
class TestHealthView:

    """Tests for the health check endpoint."""

    def test_returns_200(self, client):
        """Test that GET /health.json returns HTTP 200."""
        response = client.get('/health.json')
        assert response.status_code == 200

    def test_returns_status_ok(self, client):
        """Test that the response body is {"status": "ok"}."""
        response = client.get('/health.json')
        assert json.loads(response.content) == {'status': 'ok'}

    def test_does_not_require_authentication(self, client):
        """Test that an unauthenticated request still returns 200."""
        response = client.get('/health.json')
        assert response.status_code == 200
