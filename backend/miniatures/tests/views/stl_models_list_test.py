"""Tests for the STL models list view (GET /miniatures/stl_models.json)."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import UserFactory
from miniatures.tests.factories import StlModelFactory

LIST_URL = '/miniatures/stl_models.json'


@pytest.mark.django_db
class TestStlModelsListView(TokenAuthRequestMixin):
    """Tests for GET /miniatures/stl_models.json."""

    def setup_method(self):
        """Set up an authenticated user."""
        self.user = UserFactory(username='alice', password='secret-password')
        self.token = Token.objects.create(user=self.user)

    def test_returns_401_when_unauthenticated(self, client):
        """Test that an unauthenticated request is rejected."""
        response = self.get(client, LIST_URL)
        assert response.status_code == 401

    def test_returns_empty_list(self, client):
        """Test that an empty list is returned when no STL models exist."""
        response = self.get(client, LIST_URL, token=self.token)
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_id_name_photo_url(self, client):
        """Test that list items include id, name, and photo_url fields."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        response = self.get(client, LIST_URL, token=self.token)
        data = json.loads(response.content)
        assert data[0] == {'id': stl_model.id, 'name': 'Dragon Miniature', 'photo_url': None}

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = self.get(client, LIST_URL, token=self.token)
        assert response['page'] == '1'

    def test_returns_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, LIST_URL, token=self.token)
        assert response['X-Skip-Cache'] == 'true'
