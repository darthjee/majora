"""Shared actors, fake copy type and registry patching for the staff copies endpoint tests."""

import json

import pytest
from rest_framework import serializers
from rest_framework.authtoken.models import Token
from rest_framework.response import Response

from games.models import GameItem
from games.tests.factories import SuperUserFactory, UserFactory
from staff import copy_types
from staff.copy_types import CopyType, ModelCopyType


class StaffCopyActorsMixin:
    """Mixin creating staff, superuser and regular users with their tokens."""

    def setup_actors(self):
        """Create the users and their tokens."""
        self.staff_user = UserFactory(username='staffer', is_staff=True)
        self.staff_token = Token.objects.create(user=self.staff_user)
        self.superuser = SuperUserFactory(username='admin')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = UserFactory(username='player')
        self.regular_token = Token.objects.create(user=self.regular_user)

    @staticmethod
    def auth(token=None):
        """Return the request kwargs carrying the Token auth header, if any."""
        if token is None:
            return {}
        return {'HTTP_AUTHORIZATION': f'Token {token.key}'}

    def get_json(self, client, url, token=None):
        """Issue a GET request to `url` with an optional token."""
        return client.get(url, **self.auth(token))

    def post_json(self, client, url, payload, token=None):
        """Issue a POST request to `url` with a JSON payload and an optional token."""
        return self.post_raw(client, url, json.dumps(payload), token)

    def post_raw(self, client, url, body, token=None):
        """Issue a POST request to `url` with a raw JSON body and an optional token."""
        return client.post(url, data=body, content_type='application/json', **self.auth(token))


class FakeCopyType(CopyType):
    """Copy type recording its `list`/`copy` calls and answering with simple responses."""

    def __init__(self, slug, model):
        """Store the configuration and start with no recorded calls."""
        super().__init__(slug, model)
        self.list_calls = []
        self.copy_calls = []

    def list(self, request, from_game, to_game):
        """Record the call and return the two games' slugs."""
        self.list_calls.append((from_game, to_game))
        return Response({'from': from_game.game_slug, 'to': to_game.game_slug})

    def copy(self, request, source, target_game):
        """Record the call and return `201` with the source id and the target slug."""
        self.copy_calls.append((source, target_game))
        return Response({'source': source.pk, 'target': target_game.game_slug}, status=201)


def register_copy_types(monkeypatch, *entries):
    """Replace the copy-type registry with `entries` for the duration of a test."""
    monkeypatch.setattr(copy_types, 'COPY_TYPES', tuple(entries))
    monkeypatch.setattr(copy_types, '_BY_SLUG', {entry.slug: entry for entry in entries})


class StaffCopyGateBehavior(StaffCopyActorsMixin):
    """Shared staff-gate and `X-Skip-Cache` tests; subclasses define `send(client, token)`."""

    def send(self, client, token=None):
        """Issue the endpoint's request with an optional token."""
        raise NotImplementedError

    def send_wrong_method(self, client, token=None):
        """Issue a request with a method the endpoint does not accept."""
        raise NotImplementedError

    def test_unauthenticated_returns_401_with_skip_cache(self, client):
        """Test that an anonymous request returns 401 with X-Skip-Cache."""
        response = self.send(client)
        assert response.status_code == 401
        assert response['X-Skip-Cache'] == 'true'

    def test_regular_user_returns_403_with_skip_cache(self, client):
        """Test that a regular user gets 403 not_allowed with X-Skip-Cache."""
        response = self.send(client, self.regular_token)
        assert response.status_code == 403
        assert response.json() == {'errors': {'detail': ['not_allowed']}}
        assert response['X-Skip-Cache'] == 'true'

    def test_wrong_method_returns_405_with_skip_cache(self, client):
        """Test that a wrong HTTP method returns 405 with X-Skip-Cache."""
        response = self.send_wrong_method(client, self.staff_token)
        assert response.status_code == 405
        assert response['X-Skip-Cache'] == 'true'


class FakeCopyTypeRegistryMixin:
    """Mixin registering a `FakeCopyType` from `setup_method`, undone after each test."""

    def register_fake_copy_type(self, slug, model):
        """Register a fake copy type over `model` under `slug` and keep it as `self.fake`."""
        self._registry_patch = pytest.MonkeyPatch()
        self.fake = FakeCopyType(slug, model)
        register_copy_types(self._registry_patch, self.fake)

    def teardown_method(self):
        """Restore the real copy-type registry."""
        patch = getattr(self, '_registry_patch', None)
        if patch is not None:
            patch.undo()


class ScaffoldRowSerializer(serializers.ModelSerializer):
    """Minimal list row serializer for `GameItem`, used to exercise `ModelCopyType`."""

    copied_to_target = serializers.BooleanField(read_only=True)

    class Meta:
        """Metadata for the ScaffoldRowSerializer."""

        model = GameItem
        fields = ['id', 'name', 'copied_to_target']


class ScaffoldCopyType(ModelCopyType):
    """`ModelCopyType` over `GameItem` with configurable association uploads and cache paths."""

    serializer_class = ScaffoldRowSerializer
    copied_fields = ('name', 'description', 'hidden')

    def __init__(self, uploads=(), paths=()):
        """Store the uploads `copy_associations` returns and the paths `cache_paths` builds."""
        super().__init__('items', GameItem)
        self._uploads = list(uploads)
        self._paths = list(paths)
        self.association_calls = []

    def copy_associations(self, request, source, copy):
        """Record the call and return the configured uploads."""
        self.association_calls.append((source, copy))
        return self._uploads

    def cache_paths(self, copy):
        """Return the configured paths, formatted with the copy id."""
        return [path.format(id=copy.pk) for path in self._paths]
