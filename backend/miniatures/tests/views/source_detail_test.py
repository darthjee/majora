"""Tests for the source detail view (GET /miniatures/sources/<id>.json)."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import UserFactory
from miniatures.tests.factories import SourceFactory


@pytest.mark.django_db
class TestSourceDetailView(TokenAuthRequestMixin):
    """Tests for GET /miniatures/sources/<id>.json."""

    def setup_method(self):
        """Set up an authenticated user."""
        self.user = UserFactory(username='alice', password='secret-password')
        self.token = Token.objects.create(user=self.user)

    def test_returns_401_when_unauthenticated(self, client):
        """Test that an unauthenticated request is rejected."""
        source = SourceFactory(name='MyMiniFactory')
        response = self.get(client, f'/miniatures/sources/{source.id}.json')
        assert response.status_code == 401

    def test_returns_404_for_unknown_id(self, client):
        """Test that an unknown id returns 404."""
        response = self.get(client, '/miniatures/sources/999999.json', token=self.token)
        assert response.status_code == 404
        assert json.loads(response.content) == {'errors': {'detail': ['not_found']}}

    def test_returns_detail(self, client):
        """Test that detail fields are returned for a valid source."""
        source = SourceFactory(name='MyMiniFactory', url='https://mymminifactory.com')

        url = f'/miniatures/sources/{source.id}.json'
        response = self.get(client, url, token=self.token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == source.id
        assert data['name'] == 'MyMiniFactory'
        assert data['url'] == 'https://mymminifactory.com'
        assert data['photo_url'] is None

    def test_returns_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        source = SourceFactory(name='MyMiniFactory')
        url = f'/miniatures/sources/{source.id}.json'
        response = self.get(client, url, token=self.token)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_skip_cache_header_on_404(self, client):
        """Test that the 404 response also includes the X-Skip-Cache: true header."""
        response = self.get(client, '/miniatures/sources/999999.json', token=self.token)
        assert response['X-Skip-Cache'] == 'true'
