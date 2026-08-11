"""Tests for the CollectionCreateSerializer."""

import pytest

from miniatures.serializers import CollectionCreateSerializer
from miniatures.tests.factories import CollectionFactory


@pytest.mark.django_db
class TestCollectionCreateSerializer:
    """Tests for the CollectionCreateSerializer."""

    def test_valid_with_name_only(self):
        """Test that a payload with only a name is valid."""
        serializer = CollectionCreateSerializer(data={'name': 'Monster Pack'})
        assert serializer.is_valid()

    def test_valid_with_name_and_url(self):
        """Test that a payload with a name and url is valid."""
        serializer = CollectionCreateSerializer(
            data={'name': 'Monster Pack', 'url': 'https://example.com/pack'}
        )
        assert serializer.is_valid()

    def test_missing_name_returns_error(self):
        """Test that a missing name is invalid."""
        serializer = CollectionCreateSerializer(data={})
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_duplicate_name_returns_error(self):
        """Test that a duplicate name is rejected via DRF's automatic UniqueValidator."""
        CollectionFactory(name='Monster Pack')
        serializer = CollectionCreateSerializer(data={'name': 'Monster Pack'})
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_duplicate_url_returns_error(self):
        """Test that a duplicate url is rejected via DRF's automatic UniqueValidator."""
        CollectionFactory(name='Monster Pack', url='https://example.com/pack')
        serializer = CollectionCreateSerializer(
            data={'name': 'Terrain Set', 'url': 'https://example.com/pack'}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_two_collections_with_no_url_are_both_valid(self):
        """Test that omitting url never collides via UniqueValidator, even with existing rows."""
        CollectionFactory(name='Monster Pack')
        serializer = CollectionCreateSerializer(data={'name': 'Terrain Set'})
        assert serializer.is_valid()

    def test_create_persists_name_and_url(self):
        """Test that create() persists the given name and url."""
        serializer = CollectionCreateSerializer(
            data={'name': 'Monster Pack', 'url': 'https://example.com/pack'}
        )
        serializer.is_valid()
        collection = serializer.save()
        assert collection.name == 'Monster Pack'
        assert collection.url == 'https://example.com/pack'

    def test_create_with_no_url_defaults_to_none(self):
        """Test that create() with no url leaves the collection's url as None."""
        serializer = CollectionCreateSerializer(data={'name': 'Monster Pack'})
        serializer.is_valid()
        collection = serializer.save()
        assert collection.url is None

    def test_create_starts_with_no_source(self):
        """Test that create() always leaves source unset -- it is not an accepted field."""
        serializer = CollectionCreateSerializer(
            data={'name': 'Monster Pack', 'source': 'ignored'}
        )
        serializer.is_valid()
        collection = serializer.save()
        assert collection.source is None

    def test_javascript_scheme_url_is_rejected(self):
        """Test that a `javascript:` scheme url is rejected."""
        serializer = CollectionCreateSerializer(
            data={'name': 'Monster Pack', 'url': 'javascript:alert(1)'}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_data_scheme_url_is_rejected(self):
        """Test that a `data:` scheme url is rejected."""
        serializer = CollectionCreateSerializer(
            data={'name': 'Monster Pack', 'url': 'data:text/html,<script>alert(1)</script>'}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_vbscript_scheme_url_is_rejected(self):
        """Test that a `vbscript:` scheme url is rejected."""
        serializer = CollectionCreateSerializer(
            data={'name': 'Monster Pack', 'url': 'vbscript:msgbox(1)'}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_dangerous_scheme_url_rejected_case_insensitively_with_whitespace(self):
        """Test that a dangerous scheme is rejected regardless of case or surrounding spaces."""
        serializer = CollectionCreateSerializer(
            data={'name': 'Monster Pack', 'url': '  JavaScript:alert(1)  '}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_tab_obfuscated_javascript_scheme_url_is_rejected(self):
        """Test that a `javascript:` scheme url obfuscated with an embedded tab is rejected."""
        serializer = CollectionCreateSerializer(
            data={'name': 'Monster Pack', 'url': 'java\tscript:alert(1)'}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_newline_obfuscated_javascript_scheme_url_is_rejected(self):
        """Test that a `javascript:` scheme url obfuscated with an embedded newline is rejected."""
        serializer = CollectionCreateSerializer(
            data={'name': 'Monster Pack', 'url': 'java\nscript:alert(1)'}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_carriage_return_obfuscated_javascript_scheme_url_is_rejected(self):
        """Test that a `javascript:` scheme url with an embedded carriage return is rejected."""
        serializer = CollectionCreateSerializer(
            data={'name': 'Monster Pack', 'url': 'java\rscript:alert(1)'}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_bare_domain_url_is_accepted(self):
        """Test that a bare-domain url (no scheme) is still accepted."""
        serializer = CollectionCreateSerializer(
            data={'name': 'Monster Pack', 'url': 'example.com/pack'}
        )
        assert serializer.is_valid()

    def test_relative_path_url_is_accepted(self):
        """Test that a relative-path-like url (no scheme) is still accepted."""
        serializer = CollectionCreateSerializer(
            data={'name': 'Monster Pack', 'url': '/some/relative/path'}
        )
        assert serializer.is_valid()

    def test_blank_url_is_accepted(self):
        """Test that a blank url is still accepted."""
        serializer = CollectionCreateSerializer(data={'name': 'Monster Pack', 'url': ''})
        assert serializer.is_valid()

    def test_explicit_null_url_is_accepted(self):
        """Test that an explicit null url is accepted (skips the UniqueValidator)."""
        serializer = CollectionCreateSerializer(data={'name': 'Monster Pack', 'url': None})
        assert serializer.is_valid()

    def test_http_scheme_url_is_accepted(self):
        """Test that a legitimate `http:` scheme url is accepted."""
        serializer = CollectionCreateSerializer(
            data={'name': 'Monster Pack', 'url': 'http://example.com'}
        )
        assert serializer.is_valid()

    def test_https_scheme_url_is_accepted(self):
        """Test that a legitimate `https:` scheme url is accepted."""
        serializer = CollectionCreateSerializer(
            data={'name': 'Monster Pack', 'url': 'https://example.com'}
        )
        assert serializer.is_valid()

    def test_control_char_prefixed_javascript_scheme_url_is_rejected(self):
        """Test that a `javascript:` scheme url prefixed with a C0 control char is rejected."""
        serializer = CollectionCreateSerializer(
            data={'name': 'Monster Pack', 'url': '\x01javascript:alert(1)'}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_null_byte_prefixed_javascript_scheme_url_is_rejected(self):
        """Test that a `javascript:` scheme url prefixed with a null byte is rejected."""
        serializer = CollectionCreateSerializer(
            data={'name': 'Monster Pack', 'url': '\x00javascript:alert(1)'}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors
