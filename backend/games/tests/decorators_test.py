"""Tests for games.decorators."""

from django.http import HttpResponse

from games.decorators import regular, restricted


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


class TestRegular:
    """Tests for the `@regular` decorator."""

    def test_returns_the_same_callable(self):
        """`@regular` is a no-op: it returns the exact same callable it received."""

        def view(request):
            """A view function."""
            return HttpResponse(status=200)

        assert regular(view) is view
