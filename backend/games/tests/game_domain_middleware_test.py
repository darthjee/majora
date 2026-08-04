"""Tests for GameDomainCsrfOriginsMiddleware."""

from unittest.mock import patch

import pytest
from django.conf import settings
from django.db.utils import OperationalError
from django.test import override_settings

from games.middleware import GameDomainCsrfOriginsMiddleware
from games.tests.factories import GameDomainFactory


def _build_middleware():
    """Instantiate the middleware, exercising its `__init__`-time DB query."""
    return GameDomainCsrfOriginsMiddleware(get_response=lambda r: None)


@pytest.mark.django_db
class TestGameDomainCsrfOriginsMiddleware:
    """`CSRF_TRUSTED_ORIGINS` is extended with origins derived from `GameDomain` rows."""

    def test_adds_origin_for_single_scheme_domain(self):
        """A domain with a single scheme contributes one origin."""
        GameDomainFactory(domain='example.com', schemes='https')
        with override_settings(CSRF_TRUSTED_ORIGINS=[]):
            _build_middleware()
            assert settings.CSRF_TRUSTED_ORIGINS == ['https://example.com']

    def test_adds_multiple_origins_for_multiple_schemes(self):
        """A domain with several schemes contributes one origin per scheme."""
        GameDomainFactory(domain='local.example.com', schemes='http,https')
        with override_settings(CSRF_TRUSTED_ORIGINS=[]):
            _build_middleware()
            assert settings.CSRF_TRUSTED_ORIGINS == [
                'http://local.example.com',
                'https://local.example.com',
            ]

    def test_includes_all_domains(self):
        """Every `GameDomain` row contributes its origins."""
        GameDomainFactory(domain='one.example.com', schemes='https')
        GameDomainFactory(domain='two.example.com', schemes='https')
        with override_settings(CSRF_TRUSTED_ORIGINS=[]):
            _build_middleware()
            assert settings.CSRF_TRUSTED_ORIGINS == [
                'https://one.example.com',
                'https://two.example.com',
            ]

    def test_preserves_env_based_origins(self):
        """Existing env-var-based origins are preserved alongside the new ones."""
        GameDomainFactory(domain='example.com', schemes='https')
        with override_settings(CSRF_TRUSTED_ORIGINS=['https://env-configured.example.com']):
            _build_middleware()
            assert settings.CSRF_TRUSTED_ORIGINS == [
                'https://env-configured.example.com',
                'https://example.com',
            ]

    def test_db_error_falls_back_to_env_only_origins(self):
        """A DB error while querying `GameDomain` is swallowed, leaving env-only origins."""
        GameDomainFactory(domain='example.com', schemes='https')
        with override_settings(CSRF_TRUSTED_ORIGINS=['https://env-configured.example.com']):
            with patch('games.models.GameDomain.objects.all', side_effect=OperationalError):
                _build_middleware()
            assert settings.CSRF_TRUSTED_ORIGINS == ['https://env-configured.example.com']

    def test_call_delegates_to_get_response(self):
        """`__call__` simply delegates to the wrapped `get_response`."""
        with override_settings(CSRF_TRUSTED_ORIGINS=[]):
            middleware = GameDomainCsrfOriginsMiddleware(get_response=lambda r: f'handled-{r}')
            assert middleware('request') == 'handled-request'
