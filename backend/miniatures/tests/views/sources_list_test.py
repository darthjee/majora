"""Tests for the sources list view (GET list / POST create)."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import SuperUserFactory, UserFactory
from miniatures.models import Source
from miniatures.tests.factories import SourceFactory

LIST_URL = '/miniatures/sources.json'


@pytest.mark.django_db
class TestSourcesListView(TokenAuthRequestMixin):
    """Tests for GET /miniatures/sources.json."""

    def setup_method(self):
        """Set up an authenticated user."""
        self.user = UserFactory(username='alice', password='secret-password')
        self.token = Token.objects.create(user=self.user)

    def test_returns_401_when_unauthenticated(self, client):
        """Test that an unauthenticated request is rejected."""
        response = self.get(client, LIST_URL)
        assert response.status_code == 401

    def test_returns_empty_list(self, client):
        """Test that an empty list is returned when no sources exist."""
        response = self.get(client, LIST_URL, token=self.token)
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_id_name_photo_url(self, client):
        """Test that list items include id, name, and photo_url fields."""
        source = SourceFactory(name='MyMiniFactory')
        response = self.get(client, LIST_URL, token=self.token)
        data = json.loads(response.content)
        assert data[0] == {'id': source.id, 'name': 'MyMiniFactory', 'photo_url': None}

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = self.get(client, LIST_URL, token=self.token)
        assert response['page'] == '1'

    def test_returns_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, LIST_URL, token=self.token)
        assert response['X-Skip-Cache'] == 'true'


@pytest.mark.django_db
class TestSourcesCreateView(TokenAuthRequestMixin):
    """Tests for POST /miniatures/sources.json."""

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
        response = self.post(client, LIST_URL, {'name': 'MyMiniFactory'})
        assert response.status_code == 401

    def test_returns_403_for_non_staff_user(self, client):
        """Test that an authenticated non-staff user is rejected with 403."""
        response = self.post(
            client, LIST_URL, {'name': 'MyMiniFactory'}, token=self.regular_token,
        )
        assert response.status_code == 403

    def test_superuser_can_create(self, client):
        """Test that a superuser can create a source and receives 201."""
        response = self.post(
            client, LIST_URL, {'name': 'MyMiniFactory'}, token=self.superuser_token,
        )
        assert response.status_code == 201

    def test_staff_can_create(self, client):
        """Test that a staff user can create a source and receives 201."""
        response = self.post(
            client, LIST_URL, {'name': 'MyMiniFactory'}, token=self.staff_token,
        )
        assert response.status_code == 201

    def test_missing_name_returns_400(self, client):
        """Test that a POST without a name returns 400."""
        response = self.post(client, LIST_URL, {}, token=self.superuser_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_duplicate_name_returns_400(self, client):
        """Test that a POST with a duplicate name returns 400."""
        SourceFactory(name='MyMiniFactory')
        response = self.post(
            client, LIST_URL, {'name': 'MyMiniFactory'}, token=self.superuser_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_returns_source_detail_shape(self, client):
        """Test that the response body matches the SourceDetailSerializer shape."""
        response = self.post(
            client,
            LIST_URL,
            {'name': 'MyMiniFactory', 'url': 'https://mymminifactory.com'},
            token=self.superuser_token,
        )
        data = json.loads(response.content)
        assert data['name'] == 'MyMiniFactory'
        assert data['url'] == 'https://mymminifactory.com'
        assert 'id' in data
        assert data['photo_url'] is None

    def test_create_persists_source(self, client):
        """Test that a successful POST persists a new Source row."""
        response = self.post(
            client, LIST_URL, {'name': 'MyMiniFactory'}, token=self.superuser_token,
        )
        data = json.loads(response.content)
        assert Source.objects.filter(pk=data['id'], name='MyMiniFactory').exists()

    def test_returns_skip_cache_header(self, client):
        """Test that the create response includes the X-Skip-Cache: true header."""
        response = self.post(
            client, LIST_URL, {'name': 'MyMiniFactory'}, token=self.superuser_token,
        )
        assert response['X-Skip-Cache'] == 'true'
