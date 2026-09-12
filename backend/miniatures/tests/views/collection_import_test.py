"""Tests for the crawler-import view (POST /miniatures/collections/import.json)."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import SuperUserFactory, UserFactory
from miniatures.tests.factories import CollectionFactory

IMPORT_URL = '/miniatures/collections/import.json'
BASE_DATA = {'name': 'Monster Pack', 'source_name': 'Lootstudios'}


@pytest.mark.django_db
class TestCollectionImportView(TokenAuthRequestMixin):
    """Tests for POST /miniatures/collections/import.json."""

    def setup_method(self):
        """Set up a superuser, a staff user, and a regular authenticated user."""
        self.superuser = SuperUserFactory(username='admin', password='secret-password')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.staff_user = UserFactory(
            username='staffer', password='secret-password', is_staff=True,
        )
        self.staff_token = Token.objects.create(user=self.staff_user)
        self.regular_user = UserFactory(username='player', password='secret-password')
        self.regular_token = Token.objects.create(user=self.regular_user)

    def test_returns_401_when_unauthenticated(self, client):
        """Test that an unauthenticated POST is rejected with 401."""
        response = self.post(client, IMPORT_URL, BASE_DATA)
        assert response.status_code == 401

    def test_returns_403_for_non_staff_user(self, client):
        """Test that an authenticated non-staff user is rejected with 403."""
        response = self.post(client, IMPORT_URL, BASE_DATA, token=self.regular_token)
        assert response.status_code == 403

    def test_returns_200_on_create(self, client):
        """Test that importing a new item returns 200."""
        response = self.post(client, IMPORT_URL, BASE_DATA, token=self.superuser_token)
        assert response.status_code == 200

    def test_staff_can_import(self, client):
        """Test that a staff user (not just a superuser) can import."""
        response = self.post(client, IMPORT_URL, BASE_DATA, token=self.staff_token)
        assert response.status_code == 200

    def test_returns_200_on_update(self, client):
        """Test that re-importing an existing item (matched by external_id) returns 200."""
        CollectionFactory(name='Old Name', external_id='ext-1')
        response = self.post(
            client, IMPORT_URL, {**BASE_DATA, 'external_id': 'ext-1'},
            token=self.superuser_token,
        )
        assert response.status_code == 200

    def test_missing_name_returns_400(self, client):
        """Test that a POST without a name returns 400."""
        response = self.post(
            client, IMPORT_URL, {'source_name': 'Lootstudios'}, token=self.superuser_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_missing_source_name_returns_400(self, client):
        """Test that a POST without a source_name returns 400."""
        response = self.post(
            client, IMPORT_URL, {'name': 'Monster Pack'}, token=self.superuser_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'source_name' in data['errors']

    def test_returns_collection_detail_shape(self, client):
        """Test that the response body matches the CollectionDetailSerializer shape."""
        response = self.post(
            client, IMPORT_URL, {**BASE_DATA, 'url': 'https://example.com/collection'},
            token=self.superuser_token,
        )
        data = json.loads(response.content)
        assert 'id' in data
        assert {
            'name': data['name'],
            'url': data['url'],
            'photo_url': data['photo_url'],
            'stl_models': data['stl_models'],
        } == {
            'name': 'Monster Pack',
            'url': 'https://example.com/collection',
            'photo_url': None,
            'stl_models': [],
        }
        assert data['source'] == {'id': data['source']['id'], 'name': 'Lootstudios'}

    def test_returns_skip_cache_header(self, client):
        """Test that the response carries the X-Skip-Cache header."""
        response = self.post(client, IMPORT_URL, BASE_DATA, token=self.superuser_token)
        assert response['X-Skip-Cache'] == 'true'
