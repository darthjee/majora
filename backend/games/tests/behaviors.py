"""Shared pytest test mixins ("behaviors") for recurring test patterns.

These mixins exist to remove copy-pasted boilerplate found across many view
test modules: building the `HTTP_AUTHORIZATION` header for an optional token,
and asserting the common "GET returns detail" / "GET returns 404" shape of
detail endpoints. `games/tests/views/support.py`'s `assert_json_response` is
reused here rather than duplicated.
"""

import json

from games.tests.views.support import assert_json_response


class TokenAuthRequestMixin:
    """Mixin adding token-authenticated GET/PATCH/POST/PUT helpers to a test class."""

    def auth_kwargs(self, token=None):
        """Return the extra request kwargs carrying the Token auth header, if any."""
        if token is None:
            return {}
        return {'HTTP_AUTHORIZATION': f'Token {token.key}'}

    def get(self, client, url, token=None):
        """Issue a GET request to `url`, optionally authenticated with `token`."""
        return client.get(url, **self.auth_kwargs(token))

    def patch(self, client, url, payload, token=None):
        """Issue a PATCH request to `url` with a JSON `payload`, optionally with `token`."""
        return client.patch(
            url,
            data=json.dumps(payload),
            content_type='application/json',
            **self.auth_kwargs(token),
        )

    def post(self, client, url, payload, token=None):
        """Issue a POST request to `url` with a JSON `payload`, optionally with `token`."""
        return client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json',
            **self.auth_kwargs(token),
        )

    def put(self, client, url, payload, token=None):
        """Issue a PUT request to `url` with a JSON `payload`, optionally with `token`."""
        return client.put(
            url,
            data=json.dumps(payload),
            content_type='application/json',
            **self.auth_kwargs(token),
        )


class DetailNotFoundBehaviorMixin:
    """Mixin for the recurring "GET detail returns 200 / unknown id returns 404" shape."""

    def assert_returns_detail(self, client, url, **expected_fields):
        """GET `url` and assert 200 plus the given expected top-level fields."""
        response = client.get(url)
        return assert_json_response(response, 200, **expected_fields)

    def assert_returns_not_found(self, client, url):
        """GET `url` and assert a 404 response."""
        response = client.get(url)
        assert response.status_code == 404
        return response
