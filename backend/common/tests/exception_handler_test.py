"""Tests for the project DRF exception handler."""

import pytest
from rest_framework.exceptions import NotFound, PermissionDenied

from accounts.authentication import ApiTokenNotAllowed, GameNotAllowed, ScopeMissing
from common.exception_handler import exception_handler


class TestExceptionHandler:
    """Tests for `exception_handler`."""

    @pytest.mark.parametrize(
        ('exc', 'code'),
        [
            (ApiTokenNotAllowed(), 'token_not_allowed'),
            (ScopeMissing(), 'scope_missing'),
            (GameNotAllowed(), 'game_not_allowed'),
        ],
    )
    def test_token_errors_use_project_body(self, exc, code):
        """Token 403s render as `{"errors": {"detail": [code]}}`."""
        response = exception_handler(exc, {})
        assert response.status_code == 403
        assert response.data == {'errors': {'detail': [code]}}

    def test_other_permission_denied_unchanged(self):
        """A plain `PermissionDenied` keeps DRF's default body."""
        response = exception_handler(PermissionDenied(), {})
        assert response.data['detail'].code == 'permission_denied'

    def test_not_found_unchanged(self):
        """A 404 keeps DRF's default body (no masking)."""
        response = exception_handler(NotFound(), {})
        assert response.status_code == 404
        assert response.data['detail'].code == 'not_found'

    def test_non_api_exception_returns_none(self):
        """Non-DRF exceptions are left to Django."""
        assert exception_handler(ValueError('boom'), {}) is None
