"""Tests for the SourceCreateSerializer."""

import pytest

from miniatures.serializers import SourceCreateSerializer
from miniatures.tests.factories import SourceFactory


@pytest.mark.django_db
class TestSourceCreateSerializer:
    """Tests for the SourceCreateSerializer."""

    def test_valid_with_name_only(self):
        """Test that a payload with only a name is valid."""
        serializer = SourceCreateSerializer(data={'name': 'MyMiniFactory'})
        assert serializer.is_valid()

    def test_valid_with_name_and_url(self):
        """Test that a payload with a name and url is valid."""
        serializer = SourceCreateSerializer(
            data={'name': 'MyMiniFactory', 'url': 'https://mymminifactory.com'}
        )
        assert serializer.is_valid()

    def test_missing_name_returns_error(self):
        """Test that a missing name is invalid."""
        serializer = SourceCreateSerializer(data={})
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_duplicate_name_returns_error(self):
        """Test that a duplicate name is rejected via DRF's automatic UniqueValidator."""
        SourceFactory(name='MyMiniFactory')
        serializer = SourceCreateSerializer(data={'name': 'MyMiniFactory'})
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_create_persists_name_and_url(self):
        """Test that create() persists the given name and url."""
        serializer = SourceCreateSerializer(
            data={'name': 'MyMiniFactory', 'url': 'https://mymminifactory.com'}
        )
        serializer.is_valid()
        source = serializer.save()
        assert source.name == 'MyMiniFactory'
        assert source.url == 'https://mymminifactory.com'

    def test_create_with_no_url_defaults_to_blank(self):
        """Test that create() with no url leaves the source's url blank."""
        serializer = SourceCreateSerializer(data={'name': 'MyMiniFactory'})
        serializer.is_valid()
        source = serializer.save()
        assert source.url == ''

    def test_javascript_scheme_url_is_rejected(self):
        """Test that a `javascript:` scheme url is rejected."""
        serializer = SourceCreateSerializer(
            data={'name': 'MyMiniFactory', 'url': 'javascript:alert(1)'}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_data_scheme_url_is_rejected(self):
        """Test that a `data:` scheme url is rejected."""
        serializer = SourceCreateSerializer(
            data={'name': 'MyMiniFactory', 'url': 'data:text/html,<script>alert(1)</script>'}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_vbscript_scheme_url_is_rejected(self):
        """Test that a `vbscript:` scheme url is rejected."""
        serializer = SourceCreateSerializer(
            data={'name': 'MyMiniFactory', 'url': 'vbscript:msgbox(1)'}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_dangerous_scheme_url_rejected_case_insensitively_with_whitespace(self):
        """Test that a dangerous scheme is rejected regardless of case or surrounding spaces."""
        serializer = SourceCreateSerializer(
            data={'name': 'MyMiniFactory', 'url': '  JavaScript:alert(1)  '}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_tab_obfuscated_javascript_scheme_url_is_rejected(self):
        """Test that a `javascript:` scheme url obfuscated with an embedded tab is rejected."""
        serializer = SourceCreateSerializer(
            data={'name': 'MyMiniFactory', 'url': 'java\tscript:alert(1)'}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_newline_obfuscated_javascript_scheme_url_is_rejected(self):
        """Test that a `javascript:` scheme url obfuscated with an embedded newline is rejected."""
        serializer = SourceCreateSerializer(
            data={'name': 'MyMiniFactory', 'url': 'java\nscript:alert(1)'}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_carriage_return_obfuscated_javascript_scheme_url_is_rejected(self):
        """Test that a `javascript:` scheme url with an embedded carriage return is rejected."""
        serializer = SourceCreateSerializer(
            data={'name': 'MyMiniFactory', 'url': 'java\rscript:alert(1)'}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_bare_domain_url_is_accepted(self):
        """Test that a bare-domain url (no scheme) is still accepted."""
        serializer = SourceCreateSerializer(
            data={'name': 'MyMiniFactory', 'url': 'mymminifactory.com'}
        )
        assert serializer.is_valid()

    def test_blank_url_is_accepted(self):
        """Test that a blank url is still accepted."""
        serializer = SourceCreateSerializer(data={'name': 'MyMiniFactory', 'url': ''})
        assert serializer.is_valid()
