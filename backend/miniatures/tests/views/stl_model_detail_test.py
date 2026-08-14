"""Tests for the STL model detail view (GET/PATCH /miniatures/stl_models/<id>.json)."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import SuperUserFactory, UserFactory
from miniatures.models import StlModel
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
        assert json.loads(response.content) == {'errors': {'detail': ['not_found']}}

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
        assert data['links'][0]['text'] == 'Thingiverse'
        assert {
            'id': data['id'],
            'name': data['name'],
            'owned': data['owned'],
            'type': data['type'],
            'url': data['url'],
            'size': data['size'],
            'races': data['races'],
            'roles': data['roles'],
            'photo_url': data['photo_url'],
            'sources': data['sources'],
            'tags': data['tags'],
        } == {
            'id': stl_model.id,
            'name': 'Dragon Miniature',
            'owned': True,
            'type': StlModel.TYPE_OTHER,
            'url': None,
            'size': None,
            'races': [],
            'roles': [],
            'photo_url': None,
            'sources': [{'name': 'MyMiniFactory'}],
            'tags': ['dragon'],
        }

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


@pytest.mark.django_db
class TestStlModelUpdateView(TokenAuthRequestMixin):
    """Tests for PATCH /miniatures/stl_models/<id>.json."""

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
        """Test that an unauthenticated PATCH is rejected with 401."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        response = self.patch(
            client, f'/miniatures/stl_models/{stl_model.id}.json', {'name': 'New Name'},
        )
        assert response.status_code == 401

    def test_returns_403_for_non_staff_user(self, client):
        """Test that an authenticated non-staff user is rejected with 403."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        response = self.patch(
            client, f'/miniatures/stl_models/{stl_model.id}.json', {'name': 'New Name'},
            token=self.regular_token,
        )
        assert response.status_code == 403

    def test_returns_404_for_unknown_id(self, client):
        """Test that an unknown id returns 404."""
        response = self.patch(
            client, '/miniatures/stl_models/999999.json', {'name': 'New Name'},
            token=self.superuser_token,
        )
        assert response.status_code == 404

    def test_superuser_can_update(self, client):
        """Test that a superuser can update an STL model and receives 200."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        response = self.patch(
            client, f'/miniatures/stl_models/{stl_model.id}.json',
            {'name': 'Goblin Miniature', 'owned': False, 'type': StlModel.TYPE_TERRAIN},
            token=self.superuser_token,
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Goblin Miniature'
        assert data['owned'] is False
        assert data['type'] == StlModel.TYPE_TERRAIN

    def test_staff_can_update(self, client):
        """Test that a staff user can update an STL model and receives 200."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        response = self.patch(
            client, f'/miniatures/stl_models/{stl_model.id}.json', {'name': 'Goblin Miniature'},
            token=self.staff_token,
        )
        assert response.status_code == 200

    def test_invalid_choice_returns_400(self, client):
        """Test that an invalid type choice returns 400."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        response = self.patch(
            client, f'/miniatures/stl_models/{stl_model.id}.json', {'type': 'not-a-type'},
            token=self.superuser_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'type' in data['errors']

    def test_update_persists(self, client):
        """Test that a successful PATCH persists the change."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        self.patch(
            client, f'/miniatures/stl_models/{stl_model.id}.json', {'name': 'Goblin Miniature'},
            token=self.superuser_token,
        )
        stl_model.refresh_from_db()
        assert stl_model.name == 'Goblin Miniature'

    def test_returns_skip_cache_header(self, client):
        """Test that the update response includes the X-Skip-Cache: true header."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        response = self.patch(
            client, f'/miniatures/stl_models/{stl_model.id}.json', {'name': 'Goblin Miniature'},
            token=self.superuser_token,
        )
        assert response['X-Skip-Cache'] == 'true'
