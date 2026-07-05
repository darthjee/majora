"""Tests for the staff user detail view (GET detail / PATCH update)."""

import json

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.authtoken.models import Token


@pytest.mark.django_db
class TestStaffUserDetailView:
    """Tests for the GET /staff/users/<id>.json endpoint."""

    def setup_method(self):
        """Set up staff, superuser, and regular user accounts."""
        self.target_user = User.objects.create_user(
            username='target', password='secret-password', email='target@example.com'
        )
        self.staff_user = User.objects.create_user(
            username='staffer', password='secret-password', is_staff=True
        )
        self.staff_token = Token.objects.create(user=self.staff_user)
        self.superuser = User.objects.create_superuser(username='admin', password='secret-password')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = User.objects.create_user(username='player', password='secret-password')
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _get(self, client, user_id, token=None):
        """Issue a GET request to the staff user detail endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get(f'/staff/users/{user_id}.json', **extra)

    def test_unauthenticated_returns_401(self, client):
        """Test that an unauthenticated GET returns 401."""
        response = self._get(client, self.target_user.id)
        assert response.status_code == 401

    def test_non_staff_non_superuser_returns_403(self, client):
        """Test that a regular authenticated user returns 403."""
        response = self._get(client, self.target_user.id, token=self.regular_token)
        assert response.status_code == 403

    def test_staff_user_returns_detail(self, client):
        """Test that a staff user can view a user's detail."""
        response = self._get(client, self.target_user.id, token=self.staff_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data == {
            'id': self.target_user.id, 'name': 'target', 'email': 'target@example.com'
        }

    def test_superuser_returns_detail(self, client):
        """Test that a superuser can view a user's detail."""
        response = self._get(client, self.target_user.id, token=self.superuser_token)
        assert response.status_code == 200

    def test_returns_404_for_unknown_id(self, client):
        """Test that 404 is returned for a non-existent user id."""
        response = self._get(client, 999999, token=self.superuser_token)
        assert response.status_code == 404

    def test_unauthenticated_unknown_id_returns_401_not_404(self, client):
        """Test that an unauthenticated request for an unknown id still returns 401."""
        response = self._get(client, 999999)
        assert response.status_code == 401

    def test_non_staff_unknown_id_returns_403_not_404(self, client):
        """Test that a non-staff request for an unknown id still returns 403."""
        response = self._get(client, 999999, token=self.regular_token)
        assert response.status_code == 403

    def test_staff_user_response_includes_skip_cache_header(self, client):
        """Test that the GET response includes the X-Skip-Cache: true header."""
        response = self._get(client, self.target_user.id, token=self.staff_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('staff-user-detail', kwargs={'user_id': self.target_user.id})
        response = client.get(url, HTTP_AUTHORIZATION=f'Token {self.superuser_token.key}')
        assert response.status_code == 200


@pytest.mark.django_db
class TestStaffUserDetailPatchView:
    """Tests for the PATCH /staff/users/<id>.json endpoint."""

    def setup_method(self):
        """Set up a target user, another user, staff, superuser, and a regular user."""
        self.target_user = User.objects.create_user(
            username='target', password='secret-password', email='target@example.com'
        )
        self.other_user = User.objects.create_user(
            username='other', password='secret-password', email='other@example.com'
        )
        self.staff_user = User.objects.create_user(
            username='staffer', password='secret-password', is_staff=True
        )
        self.staff_token = Token.objects.create(user=self.staff_user)
        self.superuser = User.objects.create_superuser(username='admin', password='secret-password')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = User.objects.create_user(username='player', password='secret-password')
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _patch(self, client, user_id, payload, token=None):
        """Issue a PATCH request to the staff user detail endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.patch(
            f'/staff/users/{user_id}.json',
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_staff_user_can_patch(self, client):
        """Test that a staff user can update a user's name and email."""
        response = self._patch(
            client, self.target_user.id,
            {'name': 'renamed', 'email': 'renamed@example.com'}, token=self.staff_token,
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'renamed'
        assert data['email'] == 'renamed@example.com'

    def test_superuser_can_patch(self, client):
        """Test that a superuser can update a user's name and email."""
        response = self._patch(
            client, self.target_user.id, {'name': 'renamed'}, token=self.superuser_token
        )
        assert response.status_code == 200

    def test_patch_persists_changes(self, client):
        """Test that the PATCH changes are persisted in the database."""
        self._patch(
            client, self.target_user.id,
            {'name': 'renamed', 'email': 'renamed@example.com'}, token=self.superuser_token,
        )
        self.target_user.refresh_from_db()
        assert self.target_user.username == 'renamed'
        assert self.target_user.email == 'renamed@example.com'

    def test_patch_without_token_returns_401(self, client):
        """Test that PATCH without a token returns 401."""
        response = self._patch(client, self.target_user.id, {'name': 'hacked'})
        assert response.status_code == 401

    def test_patch_with_regular_user_returns_403(self, client):
        """Test that PATCH from a non-staff, non-superuser returns 403."""
        response = self._patch(
            client, self.target_user.id, {'name': 'hacked'}, token=self.regular_token
        )
        assert response.status_code == 403

    def test_patch_non_existent_user_returns_404(self, client):
        """Test that PATCH on a non-existent user returns 404."""
        response = self._patch(
            client, 999999, {'name': 'ghost'}, token=self.superuser_token
        )
        assert response.status_code == 404

    def test_patch_unauthenticated_unknown_id_returns_401_not_404(self, client):
        """Test that an unauthenticated PATCH for an unknown id still returns 401."""
        response = self._patch(client, 999999, {'name': 'hacked'})
        assert response.status_code == 401

    def test_patch_non_staff_unknown_id_returns_403_not_404(self, client):
        """Test that a non-staff PATCH for an unknown id still returns 403."""
        response = self._patch(
            client, 999999, {'name': 'hacked'}, token=self.regular_token
        )
        assert response.status_code == 403

    def test_patch_response_includes_skip_cache_header(self, client):
        """Test that the PATCH response includes the X-Skip-Cache: true header."""
        response = self._patch(
            client, self.target_user.id, {'name': 'renamed'}, token=self.superuser_token
        )
        assert response['X-Skip-Cache'] == 'true'

    def test_patch_name_too_long_returns_400(self, client):
        """Test that a name longer than 150 characters returns 400, not 500."""
        response = self._patch(
            client, self.target_user.id, {'name': 'a' * 151}, token=self.superuser_token
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_patch_name_with_invalid_characters_returns_400(self, client):
        """Test that a name with characters outside the username charset returns 400."""
        response = self._patch(
            client, self.target_user.id, {'name': 'invalid name!'}, token=self.superuser_token
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_patch_duplicate_name_returns_400(self, client):
        """Test that PATCH with a name already used by another user returns 400."""
        response = self._patch(
            client, self.target_user.id, {'name': 'other'}, token=self.superuser_token
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_patch_duplicate_email_returns_400(self, client):
        """Test that PATCH with an email already used by another user returns 400."""
        response = self._patch(
            client, self.target_user.id, {'email': 'other@example.com'}, token=self.superuser_token
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'email' in data['errors']

    def test_patch_partial_body_only_changes_given_fields(self, client):
        """Test that a partial PATCH only updates the provided field."""
        self._patch(
            client, self.target_user.id, {'name': 'renamed'}, token=self.superuser_token
        )
        self.target_user.refresh_from_db()
        assert self.target_user.username == 'renamed'
        assert self.target_user.email == 'target@example.com'
