"""Tests for the STL models list view (GET list / POST create)."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import SuperUserFactory, UserFactory
from miniatures.models import StlModel
from miniatures.tests.factories import CollectionFactory, SourceFactory, StlModelFactory

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


@pytest.mark.django_db
class TestStlModelsCreateView(TokenAuthRequestMixin):
    """Tests for POST /miniatures/stl_models.json."""

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
        response = self.post(client, LIST_URL, {'name': 'Dragon Miniature'})
        assert response.status_code == 401

    def test_returns_403_for_non_staff_user(self, client):
        """Test that an authenticated non-staff user is rejected with 403."""
        response = self.post(
            client, LIST_URL, {'name': 'Dragon Miniature'}, token=self.regular_token,
        )
        assert response.status_code == 403

    def test_superuser_can_create(self, client):
        """Test that a superuser can create an STL model and receives 201."""
        response = self.post(
            client, LIST_URL, {'name': 'Dragon Miniature'}, token=self.superuser_token,
        )
        assert response.status_code == 201

    def test_staff_can_create(self, client):
        """Test that a staff user can create an STL model and receives 201."""
        response = self.post(
            client, LIST_URL, {'name': 'Dragon Miniature'}, token=self.staff_token,
        )
        assert response.status_code == 201

    def test_missing_name_returns_400(self, client):
        """Test that a POST without a name returns 400."""
        response = self.post(client, LIST_URL, {}, token=self.superuser_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_overlong_tag_returns_400_with_tag_name_too_long_code(self, client):
        """Test that a tag longer than Tag.NAME_MAX_LENGTH returns 400, not a raw DB error."""
        response = self.post(
            client, LIST_URL, {'name': 'Dragon Miniature', 'tags': ['x' * 201]},
            token=self.superuser_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert data['errors']['tags'] == ['tag_name_too_long']

    def test_too_many_tags_returns_400_with_max_tags_exceeded_code(self, client):
        """Test that more than MAX_TAGS tags returns 400 with the max_tags_exceeded code."""
        response = self.post(
            client, LIST_URL, {'name': 'Dragon Miniature', 'tags': [f'tag{i}' for i in range(21)]},
            token=self.superuser_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert data['errors']['tags'] == ['max_tags_exceeded']

    def test_returns_stl_model_detail_shape(self, client):
        """Test that the response body matches the StlModelDetailSerializer shape."""
        response = self.post(
            client,
            LIST_URL,
            {'name': 'Dragon Miniature', 'tags': ['Dragon', 'Monster']},
            token=self.superuser_token,
        )
        data = json.loads(response.content)
        assert data['name'] == 'Dragon Miniature'
        assert 'id' in data
        assert data['photo_url'] is None
        assert data['links'] == []
        assert data['sources'] == []
        assert set(data['tags']) == {'dragon', 'monster'}

    def test_create_with_source_ids_links_given_sources(self, client):
        """Test that source_ids links the created STL model to the given sources."""
        source = SourceFactory(name='MyMiniFactory')
        response = self.post(
            client,
            LIST_URL,
            {'name': 'Dragon Miniature', 'source_ids': [source.id]},
            token=self.superuser_token,
        )
        data = json.loads(response.content)
        assert data['sources'] == [{'name': 'MyMiniFactory'}]

    def test_create_with_collection_ids_links_given_collections(self, client):
        """Test that collection_ids links the created STL model to the given collections."""
        collection = CollectionFactory(name='Monster Pack')
        response = self.post(
            client,
            LIST_URL,
            {'name': 'Dragon Miniature', 'collection_ids': [collection.id]},
            token=self.superuser_token,
        )
        data = json.loads(response.content)
        assert data['collections'] == [{'name': 'Monster Pack'}]

    def test_unknown_source_id_returns_400(self, client):
        """Test that an unknown source_ids entry returns 400."""
        response = self.post(
            client,
            LIST_URL,
            {'name': 'Dragon Miniature', 'source_ids': [999999]},
            token=self.superuser_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'source_ids' in data['errors']

    def test_unknown_collection_id_returns_400(self, client):
        """Test that an unknown collection_ids entry returns 400."""
        response = self.post(
            client,
            LIST_URL,
            {'name': 'Dragon Miniature', 'collection_ids': [999999]},
            token=self.superuser_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'collection_ids' in data['errors']

    def test_create_persists_stl_model(self, client):
        """Test that a successful POST persists a new StlModel row."""
        response = self.post(
            client, LIST_URL, {'name': 'Dragon Miniature'}, token=self.superuser_token,
        )
        data = json.loads(response.content)
        assert StlModel.objects.filter(pk=data['id'], name='Dragon Miniature').exists()

    def test_returns_skip_cache_header(self, client):
        """Test that the create response includes the X-Skip-Cache: true header."""
        response = self.post(
            client, LIST_URL, {'name': 'Dragon Miniature'}, token=self.superuser_token,
        )
        assert response['X-Skip-Cache'] == 'true'
