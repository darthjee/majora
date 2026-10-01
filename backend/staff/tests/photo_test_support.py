"""Shared actors and request helpers for the staff photo endpoint tests."""

import json

from rest_framework.authtoken.models import Token

from games.tests.factories import SuperUserFactory, UserFactory
from staff.tests.photo_builders import PhotoBuilder


class StaffPhotoActorsMixin:
    """Mixin creating staff, superuser and regular users, plus a photo builder."""

    def setup_actors(self):
        """Create the users, their tokens, and the photo builder."""
        self.staff_user = UserFactory(username='staffer', is_staff=True)
        self.staff_token = Token.objects.create(user=self.staff_user)
        self.superuser = SuperUserFactory(username='admin')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = UserFactory(username='player')
        self.regular_token = Token.objects.create(user=self.regular_user)
        self.builder = PhotoBuilder()

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
        return client.post(
            url, data=json.dumps(payload), content_type='application/json', **self.auth(token)
        )

    def delete_json(self, client, url, token=None):
        """Issue a DELETE request to `url` with an optional token."""
        return client.delete(url, **self.auth(token))
