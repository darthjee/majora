"""Tests for the crawler-import view (POST /miniatures/stl_models/import.json)."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import SuperUserFactory, UserFactory
from miniatures.models import StlModel
from miniatures.tests.factories import StlModelFactory

IMPORT_URL = '/miniatures/stl_models/import.json'
BASE_DATA = {'name': 'Dragon Miniature', 'source_name': 'Lootstudios'}


@pytest.mark.django_db
class TestStlModelImportView(TokenAuthRequestMixin):
    """Tests for POST /miniatures/stl_models/import.json."""

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
        StlModelFactory(name='Old Name', external_id='ext-1')
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
            client, IMPORT_URL, {'name': 'Dragon Miniature'}, token=self.superuser_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'source_name' in data['errors']

    def test_returns_stl_model_detail_shape(self, client):
        """Test that the response body matches the StlModelDetailSerializer shape."""
        response = self.post(
            client, IMPORT_URL, {**BASE_DATA, 'tags': ['Dragon', 'Monster']},
            token=self.superuser_token,
        )
        data = json.loads(response.content)
        assert 'id' in data
        assert set(data['tags']) == {'dragon', 'monster'}
        assert {
            'name': data['name'],
            'owned': data['owned'],
            'type': data['type'],
            'url': data['url'],
            'size': data['size'],
            'races': data['races'],
            'roles': data['roles'],
            'photo_url': data['photo_url'],
        } == {
            'name': 'Dragon Miniature',
            'owned': True,
            'type': StlModel.TYPE_OTHER,
            'url': None,
            'size': None,
            'races': [],
            'roles': [],
            'photo_url': None,
        }
        assert data['sources'] == [{'name': 'Lootstudios'}]

    def test_returns_skip_cache_header(self, client):
        """Test that the response carries the X-Skip-Cache header."""
        response = self.post(client, IMPORT_URL, BASE_DATA, token=self.superuser_token)
        assert response['X-Skip-Cache'] == 'true'
