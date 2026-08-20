"""Tests for the DomainConfiguration model."""

import pytest

from domains.models import DomainConfiguration, DomainGroup


@pytest.mark.django_db
class TestDomainConfiguration:
    """Tests for the DomainConfiguration model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.group = DomainGroup.objects.create(name='Majora Brand')

    def test_creation_with_all_fields_null_by_default(self):
        """Test that favicon/title/sub_title default to None when not given."""
        configuration = DomainConfiguration.objects.create(domain_group=self.group)

        assert configuration.favicon is None
        assert configuration.title is None
        assert configuration.sub_title is None

    def test_creation_with_explicit_values(self):
        """Test that explicit favicon/title/sub_title values are stored and read back."""
        configuration = DomainConfiguration.objects.create(
            domain_group=self.group,
            favicon='/domain/favicon.ico',
            title='Custom Title',
            sub_title='Custom Sub Title',
        )
        configuration.refresh_from_db()

        assert configuration.favicon == '/domain/favicon.ico'
        assert configuration.title == 'Custom Title'
        assert configuration.sub_title == 'Custom Sub Title'

    def test_creation_with_explicit_blank_values(self):
        """Test that title/sub_title distinguish an explicit empty string from None."""
        configuration = DomainConfiguration.objects.create(
            domain_group=self.group, title='', sub_title='',
        )
        configuration.refresh_from_db()

        assert configuration.title == ''
        assert configuration.sub_title == ''

    def test_one_configuration_per_domain_group(self):
        """Test that domain_group's reverse configuration accessor returns this row."""
        configuration = DomainConfiguration.objects.create(domain_group=self.group)

        assert self.group.configuration == configuration

    def test_str(self):
        """Test string representation of a configuration."""
        configuration = DomainConfiguration(domain_group=self.group)

        assert str(configuration) == 'Configuration for Majora Brand'
