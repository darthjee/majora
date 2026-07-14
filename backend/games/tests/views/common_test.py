"""Tests for shared view helpers in games.views.common."""

import pytest
from django.contrib.auth.models import AnonymousUser
from django.test import TestCase
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from games.models import Game
from games.permissions import GameEditPermission
from games.serializers import (
    GameAccessSerializer,
    GameDetailSerializer,
    GamePermissionsSerializer,
    GameUpdateSerializer,
)
from games.tests.factories import GameFactory, GameMasterFactory, UserFactory
from games.views.common import (
    UNAUTHENTICATED_RESPONSE_DATA,
    access_response,
    detail_or_update,
    paginated_list_response,
    parse_role_booleans,
    permissions_response,
    require_authenticated,
    validated_or_error,
)


def _make_query_request(query_string=''):
    """Build a DRF Request (with working `query_params`) carrying the given query string."""
    factory = APIRequestFactory()
    django_request = factory.get(f'/fake/?{query_string}')
    return Request(django_request)


def _make_request(method='GET', user=None, data=None):
    """Build a fake DRF request carrying the given `method`/`user`/`data`."""
    factory = APIRequestFactory()
    if method == 'PATCH':
        request = factory.patch('/fake/', data or {}, format='json')
    else:
        request = factory.get('/fake/')
    request.user = user if user is not None else AnonymousUser()
    request.data = data or {}
    return request


class GameListSerializer:
    """Minimal stand-in list serializer used to test paginated_list_response."""

    def __init__(self, instances, many=True):
        """Store the instances to be serialized."""
        self.instances = instances

    @property
    def data(self):
        """Return a list of ids for the stored instances."""
        return [instance.id for instance in self.instances]


@pytest.mark.django_db
class TestRequireAuthenticated:
    """Tests for require_authenticated()."""

    def test_returns_401_response_for_anonymous_user(self):
        """Test that an anonymous user gets a 401 error response."""
        request = _make_request(user=AnonymousUser())
        response = require_authenticated(request)
        assert response.status_code == 401
        assert response.data == UNAUTHENTICATED_RESPONSE_DATA

    def test_returns_401_response_for_none_user(self):
        """Test that a None user gets a 401 error response."""
        request = _make_request(user=None)
        response = require_authenticated(request)
        assert response.status_code == 401

    def test_returns_none_for_authenticated_user(self):
        """Test that an authenticated user passes the check."""
        user = UserFactory(username='bob', password='secret-password')
        request = _make_request(user=user)
        assert require_authenticated(request) is None


class TestValidatedOrError(TestCase):
    """Tests for validated_or_error()."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game to update via GameUpdateSerializer."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_returns_none_for_valid_serializer(self):
        """Test that a valid serializer returns None."""
        serializer = GameUpdateSerializer(self.game, data={'name': 'New Name'}, partial=True)
        assert validated_or_error(serializer) is None

    def test_returns_400_response_for_invalid_serializer(self):
        """Test that an invalid serializer returns a 400 errors Response."""
        serializer = GameUpdateSerializer(self.game, data={'name': 'x' * 201}, partial=True)
        response = validated_or_error(serializer)
        assert response.status_code == 400
        assert 'errors' in response.data


class TestDetailOrUpdate(TestCase):
    """Tests for detail_or_update()."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game and a DM user."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=cls.game, user=cls.dm_user)

    def _call(self, request):
        """Invoke detail_or_update for self.game with GameEditPermission."""
        return detail_or_update(
            request, self.game, GameEditPermission, GameUpdateSerializer, GameDetailSerializer
        )

    def test_get_returns_detail_serializer_data(self):
        """Test that a GET request returns the detail-serialized object."""
        request = _make_request(method='GET')
        response = self._call(request)
        assert response.status_code == 200
        assert response.data['game_slug'] == 'test-game'

    def test_patch_without_permission_returns_error_response(self):
        """Test that a PATCH from an unauthenticated user returns the permission error."""
        request = _make_request(method='PATCH', data={'name': 'New Name'})
        response = self._call(request)
        assert response.status_code == 401

    def test_patch_with_invalid_payload_returns_400(self):
        """Test that a PATCH with an invalid payload returns a 400 errors Response."""
        request = _make_request(method='PATCH', user=self.dm_user, data={'name': 'x' * 201})
        response = self._call(request)
        assert response.status_code == 400
        assert 'errors' in response.data

    def test_patch_with_valid_payload_updates_and_returns_detail(self):
        """Test that a valid PATCH persists the update and returns the detail data."""
        request = _make_request(method='PATCH', user=self.dm_user, data={'name': 'New Name'})
        response = self._call(request)
        assert response.status_code == 200
        assert response.data['name'] == 'New Name'
        self.game.refresh_from_db()
        assert self.game.name == 'New Name'


class TestPaginatedListResponse(TestCase):
    """Tests for paginated_list_response()."""

    @classmethod
    def setUpTestData(cls):
        """Set up a few games to paginate over."""
        cls.games = [
            GameFactory(name=f'Game {i}', game_slug=f'game-{i}') for i in range(3)
        ]

    def test_returns_serialized_page_with_headers(self):
        """Test that the response body and headers reflect the paginated queryset."""
        request = _make_request(method='GET')
        request.GET = {'per_page': '2'}
        response = paginated_list_response(request, Game.objects.all(), GameListSerializer)
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response['per_page'] == '2'
        assert response['total'] == '3'


class TestAccessResponse(TestCase):
    """Tests for access_response()."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game and a DM user."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=cls.game, user=cls.dm_user)

    def test_returns_serialized_data_with_skip_cache_header(self):
        """Test that the response includes serialized data and the X-Skip-Cache header."""
        request = _make_request(user=self.dm_user)
        response = access_response(GameAccessSerializer, self.game, request)
        assert response.status_code == 200
        assert response.data['is_dm'] is True
        assert response['X-Skip-Cache'] == 'true'

    def test_merges_context_extra_into_serializer_context(self):
        """Test that context_extra is merged into the serializer context."""
        request = _make_request(user=self.dm_user)
        captured_context = {}

        class ContextCapturingSerializer:
            """Test serializer that captures the context it was built with."""

            def __init__(self, instance, context=None):
                """Store the given context for later assertions."""
                captured_context.update(context or {})
                self.instance = instance

            @property
            def data(self):
                """Return a trivial payload."""
                return {'ok': True}

        access_response(
            ContextCapturingSerializer, self.game, request, context_extra={'extra': 'value'}
        )
        assert captured_context == {'request': request, 'extra': 'value'}


class TestParseRoleBooleans:
    """Tests for parse_role_booleans()."""

    def test_returns_none_when_no_role_param(self):
        """Test that no `role` param at all returns None."""
        request = _make_query_request()
        assert parse_role_booleans(request) is None

    def test_single_recognized_role(self):
        """Test that a single recognized role sets only its own boolean."""
        request = _make_query_request('role=dm')
        assert parse_role_booleans(request) == {
            'is_superuser': False, 'is_dm': True, 'is_owner': False,
        }

    def test_repeated_roles_combine(self):
        """Test that repeated `role` params combine into simultaneous booleans."""
        request = _make_query_request('role=dm&role=owner')
        assert parse_role_booleans(request) == {
            'is_superuser': False, 'is_dm': True, 'is_owner': True,
        }

    def test_superuser_role(self):
        """Test that the superuser role sets is_superuser."""
        request = _make_query_request('role=superuser')
        assert parse_role_booleans(request) == {
            'is_superuser': True, 'is_dm': False, 'is_owner': False,
        }

    def test_player_and_staff_roles_are_accepted_but_have_no_effect(self):
        """Test that player/staff roles are recognized as present but set no booleans."""
        request = _make_query_request('role=player&role=staff')
        assert parse_role_booleans(request) == {
            'is_superuser': False, 'is_dm': False, 'is_owner': False,
        }

    def test_unrecognized_role_does_not_fall_back_to_real_identity(self):
        """Test that an unrecognized role value still switches to the role-simulated path."""
        request = _make_query_request('role=bogus')
        assert parse_role_booleans(request) == {
            'is_superuser': False, 'is_dm': False, 'is_owner': False,
        }


class TestPermissionsResponse(TestCase):
    """Tests for permissions_response()."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game and a DM user."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=cls.game, user=cls.dm_user)

    def test_real_identity_path_sets_skip_cache_header(self):
        """Test that a None role_booleans (real-identity path) sets X-Skip-Cache: true."""
        request = _make_request(user=self.dm_user)
        response = permissions_response(GamePermissionsSerializer, self.game, request, None)
        assert response.status_code == 200
        assert response.data['can_edit'] is True
        assert response['X-Skip-Cache'] == 'true'
        assert 'X-Force-Public-Cache' not in response

    def test_role_simulated_path_sets_force_public_cache_header(self):
        """Test that role_booleans (role-simulated path) sets X-Force-Public-Cache: true."""
        request = _make_request(user=self.dm_user)
        role_booleans = {'is_superuser': False, 'is_dm': True, 'is_owner': False}
        response = permissions_response(
            GamePermissionsSerializer, self.game, request, role_booleans
        )
        assert response.status_code == 200
        assert response.data['can_edit'] is True
        assert 'X-Skip-Cache' not in response
        assert response['X-Force-Public-Cache'] == 'true'

    def test_merges_context_extra_into_serializer_context(self):
        """Test that context_extra is merged into the serializer context."""
        request = _make_request(user=self.dm_user)
        captured_context = {}

        class ContextCapturingSerializer:
            """Test serializer that captures the context it was built with."""

            def __init__(self, instance, context=None):
                """Store the given context for later assertions."""
                captured_context.update(context or {})
                self.instance = instance

            @property
            def data(self):
                """Return a trivial payload."""
                return {'ok': True}

        permissions_response(
            ContextCapturingSerializer, self.game, request, None, context_extra={'extra': 'value'}
        )
        assert captured_context == {'request': request, 'roles': None, 'extra': 'value'}
