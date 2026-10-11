"""Shared actors, fake copy type and registry patching for the staff copies endpoint tests."""

import json

from rest_framework.authtoken.models import Token
from rest_framework.response import Response

from games.tests.factories import SuperUserFactory, UserFactory
from staff import copy_types
from staff.copy_types import CopyType


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
