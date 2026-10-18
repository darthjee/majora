"""Project-wide DRF exception handler."""

from rest_framework.views import exception_handler as drf_exception_handler

from accounts.authentication import ApiTokenForbidden


def exception_handler(exc, context):
    """Render scoped-token 403s as `{"errors": {"detail": [code]}}`; defer the rest to DRF."""
    response = drf_exception_handler(exc, context)
    if response is not None and isinstance(exc, ApiTokenForbidden):
        response.data = {'errors': {'detail': [exc.default_code]}}
    return response
