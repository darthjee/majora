"""Tests for the staff crawler debug-harness view (GET/POST /staff/crawler.json)."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.factories import SuperUserFactory, UserFactory
from staff.crawler_debug_emission_paginator import PAGE_SIZE, RETENTION_CAP
from staff.models import CrawlerDebugEmission


@pytest.mark.django_db
class TestStaffCrawlerView:
    """Tests for the GET/POST /staff/crawler.json endpoint."""

    def setup_method(self):
        """Set up staff, superuser, and regular user accounts."""
        self.staff_user = UserFactory(is_staff=True)
        self.staff_token = Token.objects.create(user=self.staff_user)
        self.superuser = SuperUserFactory()
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = UserFactory()
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _post(self, client, data=None, token=None):
        """Issue a POST request to the staff crawler endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.post(
            '/staff/crawler.json',
            data=json.dumps(data or {}),
            content_type='application/json',
            **extra,
        )

    def _get(self, client, query_string='', token=None):
        """Issue a GET request to the staff crawler endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get(f'/staff/crawler.json{query_string}', **extra)

    # -- staff-only access (POST) --

    def test_post_unauthenticated_returns_401(self, client):
        """Test that an unauthenticated POST returns 401."""
        response = self._post(client, data={'source': 'lootstudios', 'type': 'stl_model'})
        assert response.status_code == 401

    def test_post_non_staff_returns_403(self, client):
        """Test that a regular authenticated user's POST gets a 403 response."""
        response = self._post(
            client, data={'source': 'lootstudios', 'type': 'stl_model'}, token=self.regular_token,
        )
        assert response.status_code == 403

    def test_post_response_includes_skip_cache_header(self, client):
        """Test that the POST response includes the X-Skip-Cache: true header."""
        response = self._post(
            client, data={'source': 'lootstudios', 'type': 'stl_model'}, token=self.staff_token,
        )
        assert response['X-Skip-Cache'] == 'true'

    # -- staff-only access (GET) --

    def test_get_unauthenticated_returns_401(self, client):
        """Test that an unauthenticated GET returns 401."""
        response = self._get(client)
        assert response.status_code == 401

    def test_get_non_staff_returns_403(self, client):
        """Test that a regular authenticated user's GET gets a 403 response."""
        response = self._get(client, token=self.regular_token)
        assert response.status_code == 403

    def test_get_response_includes_skip_cache_header(self, client):
        """Test that the GET response includes the X-Skip-Cache: true header."""
        response = self._get(client, token=self.staff_token)
        assert response['X-Skip-Cache'] == 'true'

    # -- create (POST) --

    def test_create_valid_emission(self, client):
        """Test that a valid source/type/payload creates a row and returns it."""
        response = self._post(
            client,
            data={'source': 'lootstudios', 'type': 'stl_model', 'payload': {'name': 'Goblin'}},
            token=self.staff_token,
        )
        assert response.status_code == 201
        assert response.data['source'] == 'lootstudios'
        assert response.data['type'] == 'stl_model'
        assert response.data['payload'] == {'name': 'Goblin'}
        assert CrawlerDebugEmission.objects.count() == 1

    def test_create_without_payload_defaults_to_empty_dict(self, client):
        """Test that omitting payload still creates a row, with payload defaulting to {}."""
        response = self._post(
            client, data={'source': 'lootstudios', 'type': 'stl_model'}, token=self.staff_token,
        )
        assert response.status_code == 201
        assert response.data['payload'] == {}

    def test_create_missing_source_returns_400(self, client):
        """Test that a missing source returns 400."""
        response = self._post(client, data={'type': 'stl_model'}, token=self.staff_token)
        assert response.status_code == 400
        assert 'source' in response.data['errors']

    def test_create_empty_source_returns_400(self, client):
        """Test that an empty source returns 400."""
        response = self._post(
            client, data={'source': '', 'type': 'stl_model'}, token=self.staff_token,
        )
        assert response.status_code == 400
        assert 'source' in response.data['errors']

    def test_create_missing_type_returns_400(self, client):
        """Test that a missing type returns 400."""
        response = self._post(client, data={'source': 'lootstudios'}, token=self.staff_token)
        assert response.status_code == 400
        assert 'type' in response.data['errors']

    def test_create_empty_type_returns_400(self, client):
        """Test that an empty type returns 400."""
        response = self._post(
            client, data={'source': 'lootstudios', 'type': ''}, token=self.staff_token,
        )
        assert response.status_code == 400
        assert 'type' in response.data['errors']

    def test_create_invalid_does_not_create_a_row(self, client):
        """Test that an invalid create request does not create any row."""
        self._post(client, data={'type': 'stl_model'}, token=self.staff_token)
        assert CrawlerDebugEmission.objects.count() == 0

    def test_create_enforces_retention_cap(self, client):
        """Test that creating beyond RETENTION_CAP evicts the oldest rows."""
        for _ in range(RETENTION_CAP):
            CrawlerDebugEmission.objects.create(source='a', type='b', payload={})
        self._post(
            client, data={'source': 'lootstudios', 'type': 'stl_model'}, token=self.staff_token,
        )
        assert CrawlerDebugEmission.objects.count() == RETENTION_CAP

    # -- list / cursor pagination (GET) --

    def test_list_without_last_id_returns_from_the_start(self, client):
        """Test that GET with no last_id returns rows from the start, oldest-first."""
        first = CrawlerDebugEmission.objects.create(source='a', type='b', payload={})
        second = CrawlerDebugEmission.objects.create(source='a', type='b', payload={})
        response = self._get(client, token=self.staff_token)
        assert response.status_code == 200
        assert [row['id'] for row in response.data] == [first.id, second.id]

    def test_list_caps_to_page_size(self, client):
        """Test that GET caps the number of returned rows to PAGE_SIZE."""
        for _ in range(PAGE_SIZE + 5):
            CrawlerDebugEmission.objects.create(source='a', type='b', payload={})
        response = self._get(client, token=self.staff_token)
        assert len(response.data) == PAGE_SIZE

    def test_list_with_last_id_returns_only_newer_rows(self, client):
        """Test that a valid mid-window last_id returns only rows newer than it."""
        first = CrawlerDebugEmission.objects.create(source='a', type='b', payload={})
        second = CrawlerDebugEmission.objects.create(source='a', type='b', payload={})
        response = self._get(client, query_string=f'?last_id={first.id}', token=self.staff_token)
        assert response.status_code == 200
        assert [row['id'] for row in response.data] == [second.id]

    def test_list_with_malformed_last_id_returns_400(self, client):
        """Test that a non-integer last_id returns 400."""
        response = self._get(client, query_string='?last_id=abc', token=self.staff_token)
        assert response.status_code == 400
        assert 'last_id' in response.data['errors']

    def test_list_with_evicted_or_nonexistent_last_id_returns_empty(self, client):
        """Test that a valid but nonexistent/evicted last_id returns an empty list."""
        last = CrawlerDebugEmission.objects.create(source='a', type='b', payload={})
        response = self._get(
            client, query_string=f'?last_id={last.id + 1000}', token=self.staff_token,
        )
        assert response.status_code == 200
        assert response.data == []

    # -- URL by name --

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('staff-crawler')
        response = client.get(url, HTTP_AUTHORIZATION=f'Token {self.superuser_token.key}')
        assert response.status_code == 200
