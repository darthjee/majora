"""Tests for the collection detail view (GET /miniatures/collections/<id>.json)."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import UserFactory
from miniatures.tests.factories import CollectionFactory, SourceFactory, StlModelFactory


@pytest.mark.django_db
class TestCollectionDetailView(TokenAuthRequestMixin):
    """Tests for GET /miniatures/collections/<id>.json."""

    def setup_method(self):
        """Set up an authenticated user."""
        self.user = UserFactory(username='alice', password='secret-password')
        self.token = Token.objects.create(user=self.user)

    def test_returns_401_when_unauthenticated(self, client):
        """Test that an unauthenticated request is rejected."""
        collection = CollectionFactory(name='Monster Pack')
        response = self.get(client, f'/miniatures/collections/{collection.id}.json')
        assert response.status_code == 401

    def test_returns_404_for_unknown_id(self, client):
        """Test that an unknown id returns 404."""
        response = self.get(client, '/miniatures/collections/999999.json', token=self.token)
        assert response.status_code == 404
        assert json.loads(response.content) == {'errors': {'detail': ['not_found']}}

    def test_returns_detail(self, client):
        """Test that detail fields are returned for a valid collection."""
        source = SourceFactory(name='MyMiniFactory')
        collection = CollectionFactory(
            name='Monster Pack', url='https://example.com/pack', source=source,
        )
        stl_model = StlModelFactory(name='Dragon Miniature')
        stl_model.collections.add(collection)

        url = f'/miniatures/collections/{collection.id}.json'
        response = self.get(client, url, token=self.token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == collection.id
        assert data['name'] == 'Monster Pack'
        assert data['url'] == 'https://example.com/pack'
        assert data['photo_url'] is None
        assert data['source'] == {'id': source.id, 'name': 'MyMiniFactory'}
        assert data['stl_models'] == [{'id': stl_model.id, 'name': 'Dragon Miniature'}]

    def test_returns_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        collection = CollectionFactory(name='Monster Pack')
        url = f'/miniatures/collections/{collection.id}.json'
        response = self.get(client, url, token=self.token)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_skip_cache_header_on_404(self, client):
        """Test that the 404 response also includes the X-Skip-Cache: true header."""
        response = self.get(client, '/miniatures/collections/999999.json', token=self.token)
        assert response['X-Skip-Cache'] == 'true'
