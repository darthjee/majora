"""Tests for treasures views."""

import json

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import Treasure


@pytest.mark.django_db
class TestTreasuresListView:
    """Tests for the GET /treasures.json endpoint."""

    def test_returns_empty_list(self, client):
        """Test that an empty list is returned when no treasures exist."""
        response = client.get('/treasures.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_treasures(self, client):
        """Test that created treasures are returned in the list."""
        Treasure.objects.create(name='Gold Ring', value=100)
        Treasure.objects.create(name='Silver Dagger', value=50)
        response = client.get('/treasures.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_returns_id_name_value(self, client):
        """Test that list items include id, name, and value fields."""
        treasure = Treasure.objects.create(name='Gold Ring', value=100)
        response = client.get('/treasures.json')
        data = json.loads(response.content)
        assert data[0]['id'] == treasure.id
        assert data[0]['name'] == 'Gold Ring'
        assert data[0]['value'] == 100

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('treasures-list')
        response = client.get(url)
        assert response.status_code == 200

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get('/treasures.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get('/treasures.json')
        assert response['pages'] == '1'

    def test_respects_per_page_param(self, client):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            Treasure.objects.create(name=f'Treasure {i}', value=i * 10)
        response = client.get('/treasures.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            Treasure.objects.create(name=f'Treasure {i}', value=i * 10)
        response = client.get('/treasures.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2


@pytest.mark.django_db
class TestTreasuresCreateView:
    """Tests for the POST /treasures.json endpoint."""

    def setup_method(self):
        """Set up a superuser and a regular user."""
        self.superuser = User.objects.create_superuser(username='admin', password='secret-password')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = User.objects.create_user(username='player', password='secret-password')
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _post(self, client, payload, token=None):
        """Issue a POST request to the treasures list endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.post(
            '/treasures.json',
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_superuser_can_create_treasure(self, client):
        """Test that a superuser can create a treasure and receives 201."""
        response = self._post(client, {'name': 'Dragon Gem', 'value': 1000},
                              token=self.superuser_token)
        assert response.status_code == 201

    def test_create_returns_treasure_detail(self, client):
        """Test that the response body contains id, name, and value."""
        response = self._post(client, {'name': 'Dragon Gem', 'value': 1000},
                              token=self.superuser_token)
        data = json.loads(response.content)
        assert data['name'] == 'Dragon Gem'
        assert data['value'] == 1000
        assert 'id' in data

    def test_unauthenticated_post_returns_401(self, client):
        """Test that a POST without a token returns 401."""
        response = self._post(client, {'name': 'Dragon Gem', 'value': 1000})
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_non_superuser_post_returns_403(self, client):
        """Test that a non-superuser POST returns 403."""
        response = self._post(client, {'name': 'Dragon Gem', 'value': 1000},
                              token=self.regular_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_missing_name_returns_400(self, client):
        """Test that a POST without name returns 400."""
        response = self._post(client, {'value': 100}, token=self.superuser_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_missing_value_returns_400(self, client):
        """Test that a POST without value returns 400."""
        response = self._post(client, {'name': 'Gem'}, token=self.superuser_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'value' in data['errors']


@pytest.mark.django_db
class TestTreasureDetailView:
    """Tests for the GET /treasures/<id>.json endpoint."""

    def setup_method(self):
        """Set up a treasure for testing."""
        self.treasure = Treasure.objects.create(name='Enchanted Bow', value=750)

    def test_returns_treasure_detail(self, client):
        """Test that treasure detail is returned for a valid id."""
        response = client.get(f'/treasures/{self.treasure.id}.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == self.treasure.id
        assert data['name'] == 'Enchanted Bow'
        assert data['value'] == 750

    def test_returns_404_for_unknown_id(self, client):
        """Test that 404 is returned for a non-existent treasure id."""
        response = client.get('/treasures/999999.json')
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('treasure-detail', kwargs={'treasure_id': self.treasure.id})
        response = client.get(url)
        assert response.status_code == 200


@pytest.mark.django_db
class TestTreasureDetailPatchView:
    """Tests for the PATCH /treasures/<id>.json endpoint."""

    def setup_method(self):
        """Set up a treasure, a superuser, and a regular user."""
        self.treasure = Treasure.objects.create(name='Old Helmet', value=80)
        self.superuser = User.objects.create_superuser(username='admin', password='secret-password')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = User.objects.create_user(username='player', password='secret-password')
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _patch(self, client, payload, token=None):
        """Issue a PATCH request to the treasure detail endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.patch(
            f'/treasures/{self.treasure.id}.json',
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_superuser_can_patch(self, client):
        """Test that a superuser can update a treasure and receives 200."""
        response = self._patch(client, {'name': 'New Helmet'}, token=self.superuser_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'New Helmet'

    def test_patch_persists_changes(self, client):
        """Test that the PATCH changes are persisted in the database."""
        self._patch(client, {'name': 'Updated Helmet', 'value': 90}, token=self.superuser_token)
        self.treasure.refresh_from_db()
        assert self.treasure.name == 'Updated Helmet'
        assert self.treasure.value == 90

    def test_patch_without_token_returns_401(self, client):
        """Test that PATCH without a token returns 401."""
        response = self._patch(client, {'name': 'Hacked Helmet'})
        assert response.status_code == 401

    def test_patch_with_non_superuser_returns_403(self, client):
        """Test that PATCH from a non-superuser returns 403."""
        response = self._patch(client, {'name': 'Hacked Helmet'}, token=self.regular_token)
        assert response.status_code == 403

    def test_patch_non_existent_treasure_returns_404(self, client):
        """Test that PATCH on a non-existent treasure returns 404."""
        extra = {'HTTP_AUTHORIZATION': f'Token {self.superuser_token.key}'}
        response = client.patch(
            '/treasures/999999.json',
            data=json.dumps({'name': 'Ghost'}),
            content_type='application/json',
            **extra,
        )
        assert response.status_code == 404

    def test_patch_partial_body_only_changes_given_fields(self, client):
        """Test that a partial PATCH only updates the provided field."""
        self._patch(client, {'name': 'Partial Update'}, token=self.superuser_token)
        self.treasure.refresh_from_db()
        assert self.treasure.name == 'Partial Update'
        assert self.treasure.value == 80


@pytest.mark.django_db
class TestTreasureAccessView:
    """Tests for the GET /treasures/<id>/access.json endpoint."""

    def setup_method(self):
        """Set up a treasure, a superuser, and a regular user."""
        self.treasure = Treasure.objects.create(name='Magic Staff', value=400)
        self.superuser = User.objects.create_superuser(username='admin', password='secret-password')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = User.objects.create_user(username='player', password='secret-password')
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _get(self, client, token=None):
        """Issue a GET request to the treasure access endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get(f'/treasures/{self.treasure.id}/access.json', **extra)

    def test_unauthenticated_returns_200_with_can_edit_false(self, client):
        """Test that an unauthenticated request returns 200 with can_edit false."""
        response = self._get(client)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_superuser_returns_200_with_can_edit_true(self, client):
        """Test that a superuser returns 200 with can_edit true."""
        response = self._get(client, token=self.superuser_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_regular_user_returns_200_with_can_edit_false(self, client):
        """Test that a regular user returns 200 with can_edit false."""
        response = self._get(client, token=self.regular_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_non_existent_treasure_returns_200_with_can_edit_false(self, client):
        """Test that a non-existent treasure id returns 200 with can_edit false."""
        extra = {'HTTP_AUTHORIZATION': f'Token {self.superuser_token.key}'}
        response = client.get('/treasures/999999/access.json', **extra)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._get(client)
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('treasure-access', kwargs={'treasure_id': self.treasure.id})
        response = client.get(url)
        assert response.status_code == 200

    def test_superuser_via_session_returns_can_edit_true(self, client):
        """Test that a superuser authenticated via session cookie returns can_edit true."""
        session = client.session
        session['auth_token'] = self.superuser_token.key
        session.save()
        response = client.get(f'/treasures/{self.treasure.id}/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True
