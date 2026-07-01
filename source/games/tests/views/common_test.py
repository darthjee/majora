"""Tests for shared view helpers in games.views.common."""

import pytest
from django.contrib.auth.models import AnonymousUser, User
from rest_framework.test import APIRequestFactory

from games.models import Game, GameMaster
from games.permissions import GameEditPermission
from games.serializers import GameAccessSerializer, GameDetailSerializer, GameUpdateSerializer
from games.views.common import (
    UNAUTHENTICATED_RESPONSE_DATA,
    access_response,
    detail_or_update,
    paginated_list_response,
    require_authenticated,
    validated_or_error,
)


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
        user = User.objects.create_user(username='bob', password='secret-password')
        request = _make_request(user=user)
        assert require_authenticated(request) is None


@pytest.mark.django_db
class TestValidatedOrError:
    """Tests for validated_or_error()."""

    def setup_method(self):
        """Set up a game to update via GameUpdateSerializer."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')

    def test_returns_none_for_valid_serializer(self):
        """Test that a valid serializer returns None."""
        serializer = GameUpdateSerializer(self.game, data={'name': 'New Name'}, partial=True)
        assert validated_or_error(serializer) is None

    def test_returns_400_response_for_invalid_serializer(self):
        """Test that an invalid serializer returns a 400 errors Response."""
        serializer = GameUpdateSerializer(self.game, data={'photo': 'not-a-url'}, partial=True)
        response = validated_or_error(serializer)
        assert response.status_code == 400
        assert 'errors' in response.data


@pytest.mark.django_db
class TestDetailOrUpdate:
    """Tests for detail_or_update()."""

    def setup_method(self):
        """Set up a game and a DM user."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)

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
        request = _make_request(method='PATCH', user=self.dm_user, data={'photo': 'not-a-url'})
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


@pytest.mark.django_db
class TestPaginatedListResponse:
    """Tests for paginated_list_response()."""

    def setup_method(self):
        """Set up a few games to paginate over."""
        self.games = [
            Game.objects.create(name=f'Game {i}', game_slug=f'game-{i}') for i in range(3)
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


@pytest.mark.django_db
class TestAccessResponse:
    """Tests for access_response()."""

    def setup_method(self):
        """Set up a game and a DM user."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)

    def test_returns_serialized_data_with_skip_cache_header(self):
        """Test that the response includes serialized data and the X-Skip-Cache header."""
        request = _make_request(user=self.dm_user)
        response = access_response(GameAccessSerializer, self.game, request)
        assert response.status_code == 200
        assert response.data['can_edit'] is True
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
