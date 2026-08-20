"""Tests for the GET /domain/config.json endpoint."""

import json

import pytest
from django.test import override_settings

from domains.tests.factories import DomainConfigurationFactory, DomainFactory


@pytest.mark.django_db
class TestDomainConfigView:
    """Tests for the domain config endpoint."""

    def test_returns_configured_values_for_a_known_domain_group(self, client):
        """Test that a fully-configured DomainGroup's values are all reflected."""
        domain = DomainFactory(domain='testserver')
        DomainConfigurationFactory(
            domain_group=domain.domain_group,
            favicon='/domain/favicon.ico',
            title='Custom Title',
            sub_title='Custom Sub Title',
        )

        response = client.get('/domain/config.json')

        assert response.status_code == 200
        assert json.loads(response.content) == {
            'favicon': '/domain/favicon.ico',
            'title': 'Custom Title',
            'sub_title': 'Custom Sub Title',
        }

    def test_returns_defaults_when_domain_group_has_no_configuration(self, client):
        """Test that a known DomainGroup without a DomainConfiguration gets full defaults."""
        DomainFactory(domain='testserver')

        response = client.get('/domain/config.json')

        assert response.status_code == 200
        assert json.loads(response.content) == {
            'favicon': None,
            'title': 'Majora',
            'sub_title': 'RPG',
        }

    @override_settings(ALLOWED_HOSTS=['*'])
    def test_returns_defaults_for_an_unrecognized_host(self, client):
        """Test that an unregistered host gets full defaults instead of a 404."""
        response = client.get('/domain/config.json', HTTP_HOST='unknown.example.com')

        assert response.status_code == 200
        assert json.loads(response.content) == {
            'favicon': None,
            'title': 'Majora',
            'sub_title': 'RPG',
        }

    def test_blank_title_and_sub_title_are_returned_as_empty_strings(self, client):
        """Test that explicit '' on title/sub_title is shown empty, not coerced to default."""
        domain = DomainFactory(domain='testserver')
        DomainConfigurationFactory(domain_group=domain.domain_group, title='', sub_title='')

        response = client.get('/domain/config.json')

        data = json.loads(response.content)
        assert data['title'] == ''
        assert data['sub_title'] == ''

    def test_does_not_set_skip_cache_header(self, client):
        """Test that the response does not opt out of caching."""
        DomainFactory(domain='testserver')

        response = client.get('/domain/config.json')

        assert 'X-Skip-Cache' not in response
