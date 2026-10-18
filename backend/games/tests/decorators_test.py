"""Tests for games.decorators."""

import pytest
from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response

from games.decorators import (
    get_token_scopes,
    regular,
    restricted,
    skip_cache,
    token_scopes,
)


def _drf_view(methods=('GET',)):
    """Return a fresh `@api_view`-wrapped view serving `methods`."""

    @api_view(list(methods))
    def view(request):
        """Return an empty response."""
        return Response({})

    return view


class TestRestricted:
    """Tests for the `@restricted` decorator."""

    def test_sets_skip_cache_header_on_success_response(self):
        """A successful response gets `X-Skip-Cache: true`."""

        def view(request):
            """Return a plain 200 response."""
            return HttpResponse(status=200)

        wrapped = restricted(view)
        response = wrapped(request=None)

        assert response['X-Skip-Cache'] == 'true'

    def test_sets_skip_cache_header_regardless_of_status_code(self):
        """An error response also gets `X-Skip-Cache: true`."""

        def view(request):
            """Return a 403 error response."""
            return HttpResponse(status=403)

        wrapped = restricted(view)
        response = wrapped(request=None)

        assert response.status_code == 403
        assert response['X-Skip-Cache'] == 'true'

    def test_preserves_args_and_kwargs_passthrough(self):
        """Positional and keyword arguments are passed through to the wrapped view."""
        captured = {}

        def view(request, *args, **kwargs):
            """Capture the args/kwargs it received, then return a response."""
            captured['args'] = args
            captured['kwargs'] = kwargs
            return HttpResponse(status=200)

        wrapped = restricted(view)
        wrapped(None, 'positional', user_id=42)

        assert captured['args'] == ('positional',)
        assert captured['kwargs'] == {'user_id': 42}

    def test_preserves_wrapped_function_identity(self):
        """`functools.wraps` preserves the wrapped view's `__name__` and `__doc__`."""

        def view(request):
            """Original docstring."""
            return HttpResponse(status=200)

        wrapped = restricted(view)

        assert wrapped.__name__ == 'view'
        assert wrapped.__doc__ == 'Original docstring.'


class TestSkipCache:
    """Tests for the `@skip_cache` decorator."""

    def test_sets_skip_cache_header_on_success_response(self):
        """A successful response gets `X-Skip-Cache: true`."""

        def view(request):
            """Return a plain 200 response."""
            return HttpResponse(status=200)

        wrapped = skip_cache(view)
        response = wrapped(request=None)

        assert response['X-Skip-Cache'] == 'true'

    def test_sets_skip_cache_header_regardless_of_status_code(self):
        """An error response also gets `X-Skip-Cache: true`."""

        def view(request):
            """Return a 404 error response."""
            return HttpResponse(status=404)

        wrapped = skip_cache(view)
        response = wrapped(request=None)

        assert response.status_code == 404
        assert response['X-Skip-Cache'] == 'true'

    def test_preserves_args_and_kwargs_passthrough(self):
        """Positional and keyword arguments are passed through to the wrapped view."""
        captured = {}

        def view(request, *args, **kwargs):
            """Capture the args/kwargs it received, then return a response."""
            captured['args'] = args
            captured['kwargs'] = kwargs
            return HttpResponse(status=200)

        wrapped = skip_cache(view)
        wrapped(None, 'positional', user_id=42)

        assert captured['args'] == ('positional',)
        assert captured['kwargs'] == {'user_id': 42}

    def test_preserves_wrapped_function_identity(self):
        """`functools.wraps` preserves the wrapped view's `__name__` and `__doc__`."""

        def view(request):
            """Original docstring."""
            return HttpResponse(status=200)

        wrapped = skip_cache(view)

        assert wrapped.__name__ == 'view'
        assert wrapped.__doc__ == 'Original docstring.'


class TestRegular:
    """Tests for the `@regular` decorator."""

    def test_returns_the_same_callable(self):
        """`@regular` is a no-op: it returns the exact same callable it received."""

        def view(request):
            """A view function."""
            return HttpResponse(status=200)

        assert regular(view) is view


class TestTokenScopes:
    """Tests for the `@token_scopes` decorator and `get_token_scopes`."""

    def test_stores_declaration_as_tuples(self):
        """The declaration is stored per method, with scopes as tuples."""
        view = token_scopes(GET=[], POST=['documents:write'])(_drf_view(('GET', 'POST')))

        assert dict(get_token_scopes(view)) == {'GET': (), 'POST': ('documents:write',)}

    def test_declaration_is_read_only(self):
        """The stored declaration cannot be mutated."""
        view = token_scopes(GET=['npcs:read'])(_drf_view())

        with pytest.raises(TypeError):
            get_token_scopes(view)['POST'] = ()

    def test_returns_the_same_view(self):
        """The decorator returns the view it decorates."""
        view = _drf_view()

        assert token_scopes(GET=[])(view) is view

    def test_undeclared_view_returns_none(self):
        """A view without a declaration has no token scopes."""
        assert get_token_scopes(_drf_view()) is None

    def test_none_returns_none(self):
        """Looking up `None` returns None."""
        assert get_token_scopes(None) is None

    def test_readable_above_restricted(self):
        """Stacked above `@restricted`, the declaration is on the outermost function."""
        view = token_scopes(GET=['npcs:read'])(restricted(_drf_view()))

        assert dict(get_token_scopes(view)) == {'GET': ('npcs:read',)}

    def test_readable_below_restricted(self):
        """Stacked below `@restricted`, the declaration is found through the wrapper."""
        view = restricted(token_scopes(GET=['npcs:read'])(_drf_view()))

        assert dict(get_token_scopes(view)) == {'GET': ('npcs:read',)}

    def test_found_through_wrapped_chain(self):
        """The lookup follows `__wrapped__` when the attribute is not copied."""
        inner = token_scopes(GET=['npcs:read'])(_drf_view())

        def outer(request):
            """Delegate to the inner view."""
            return inner(request)

        outer.__wrapped__ = inner

        assert dict(get_token_scopes(outer)) == {'GET': ('npcs:read',)}

    def test_readable_with_regular(self):
        """Stacked with `@regular`, the declaration stays readable."""
        view = regular(token_scopes(GET=[])(_drf_view()))

        assert dict(get_token_scopes(view)) == {'GET': ()}

    def test_rejects_unknown_method(self):
        """An unknown HTTP method raises `ValueError`."""
        with pytest.raises(ValueError, match='unknown HTTP method'):
            token_scopes(FETCH=[])

    def test_rejects_lowercase_method(self):
        """Method keys must be upper-case HTTP methods."""
        with pytest.raises(ValueError, match='unknown HTTP method'):
            token_scopes(get=[])

    def test_rejects_unknown_scope(self):
        """A scope outside the catalogue raises `ValueError`."""
        with pytest.raises(ValueError, match='unknown scopes'):
            token_scopes(GET=['npcs:delete'])

    def test_rejects_string_scopes(self):
        """A bare string instead of a list raises `ValueError`."""
        with pytest.raises(ValueError, match='must list scopes'):
            token_scopes(GET='npcs:read')

    def test_rejects_empty_declaration(self):
        """A declaration with no method raises `ValueError`."""
        with pytest.raises(ValueError, match='at least one method'):
            token_scopes()

    def test_rejects_method_not_served(self):
        """Declaring a method the view does not serve raises `ValueError`."""
        with pytest.raises(ValueError, match='does not serve'):
            token_scopes(POST=['npcs:write'])(_drf_view())

    def test_rejects_non_drf_view(self):
        """Applying it below `@api_view` (to a plain function) raises `ValueError`."""

        def view(request):
            """A plain function."""
            return HttpResponse(status=200)

        with pytest.raises(ValueError, match='@api_view'):
            token_scopes(GET=[])(view)
