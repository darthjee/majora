"""Tests for the STL model detail view (GET /miniatures/stl_models/<id>.json)."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import UserFactory
from miniatures.tests.factories import (
    SourceFactory,
    StlModelFactory,
    StlModelLinkFactory,
    TagFactory,
)


@pytest.mark.django_db
class TestStlModelDetailView(TokenAuthRequestMixin):
    """Tests for GET /miniatures/stl_models/<id>.json."""

    def setup_method(self):
        """Set up an authenticated user."""
        self.user = UserFactory(username='alice', password='secret-password')
        self.token = Token.objects.create(user=self.user)

    def test_returns_401_when_unauthenticated(self, client):
        """Test that an unauthenticated request is rejected."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        response = self.get(client, f'/miniatures/stl_models/{stl_model.id}.json')
        assert response.status_code == 401

    def test_returns_404_for_unknown_id(self, client):
        """Test that an unknown id returns 404."""
        response = self.get(client, '/miniatures/stl_models/999999.json', token=self.token)
        assert response.status_code == 404
        assert json.loads(response.content) == {'errors': {'detail': ['not found']}}

    def test_returns_detail(self, client):
        """Test that detail fields are returned for a valid STL model."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        StlModelLinkFactory(stl_model=stl_model, text='Thingiverse', url='https://example.com/x')
        stl_model.sources.add(SourceFactory(name='MyMiniFactory'))
        stl_model.tags.add(TagFactory(name='dragon'))

        url = f'/miniatures/stl_models/{stl_model.id}.json'
        response = self.get(client, url, token=self.token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == stl_model.id
        assert data['name'] == 'Dragon Miniature'
        assert data['photo_url'] is None
        assert data['links'][0]['text'] == 'Thingiverse'
        assert data['sources'] == [{'name': 'MyMiniFactory'}]
        assert data['tags'] == ['dragon']

    def test_returns_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        url = f'/miniatures/stl_models/{stl_model.id}.json'
        response = self.get(client, url, token=self.token)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_skip_cache_header_on_404(self, client):
        """Test that the 404 response also includes the X-Skip-Cache: true header."""
        response = self.get(client, '/miniatures/stl_models/999999.json', token=self.token)
        assert response['X-Skip-Cache'] == 'true'
