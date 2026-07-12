"""Tests for the resource-kind config endpoint (GET /access-route-config.json)."""

import json

import pytest

from games.access_route_config import ACCESS_ROUTE_CONFIG


@pytest.mark.django_db
class TestAccessRouteConfigView:
    """Tests for the access-route-config endpoint."""

    def test_returns_200(self, client):
        """Test that GET /access-route-config.json returns HTTP 200."""
        response = client.get('/access-route-config.json')
        assert response.status_code == 200

    def test_returns_the_static_config_dict(self, client):
        """Test that the response body matches the backing ACCESS_ROUTE_CONFIG dict."""
        response = client.get('/access-route-config.json')
        assert json.loads(response.content) == ACCESS_ROUTE_CONFIG

    def test_does_not_require_authentication(self, client):
        """Test that an unauthenticated request still returns 200."""
        response = client.get('/access-route-config.json')
        assert response.status_code == 200

    def test_response_is_publicly_cacheable(self, client):
        """Test that the response gets the public/anonymous Cache-Control tier."""
        response = client.get('/access-route-config.json')
        assert response['Cache-Control'].startswith('public')

    def test_game_page_requires_game_kind(self, client):
        """Test that the 'game' page maps to a single 'game' kind descriptor."""
        response = client.get('/access-route-config.json')
        data = json.loads(response.content)
        assert data['game'] == [{'kind': 'game'}]

    def test_pc_character_page_requires_character_kind_with_pcs(self, client):
        """Test that the 'pcCharacter' page maps to a character/pcs descriptor."""
        response = client.get('/access-route-config.json')
        data = json.loads(response.content)
        assert data['pcCharacter'] == [{'kind': 'character', 'characterKind': 'pcs'}]

    def test_treasure_edit_page_requires_both_superuser_and_treasure_kinds(self, client):
        """Test that the 'treasureEdit' page maps to both superuser and treasure descriptors."""
        response = client.get('/access-route-config.json')
        data = json.loads(response.content)
        assert data['treasureEdit'] == [{'kind': 'superuser'}, {'kind': 'treasure'}]
