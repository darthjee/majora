"""Tests for the Domain model."""

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from domains.models import Domain, DomainGroup


@pytest.mark.django_db
class TestDomain:
    """Tests for the Domain model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.group = DomainGroup.objects.create(name='Majora Brand')

    def test_domain_creation(self):
        """Test that a domain can be created with a group FK."""
        domain = Domain.objects.create(
            domain='foo.majora.app', domain_group=self.group
        )
        assert domain.pk is not None
        assert domain.domain_group == self.group

    def test_domain_str(self):
        """Test string representation of a domain."""
        domain = Domain(domain='foo.majora.app', domain_group=self.group)
        assert str(domain) == 'foo.majora.app'

    def test_domain_uniqueness(self):
        """Test that a duplicate domain is rejected within the same group."""
        Domain.objects.create(domain='foo.majora.app', domain_group=self.group)
        with pytest.raises(IntegrityError):
            Domain.objects.create(domain='foo.majora.app', domain_group=self.group)

    def test_domain_rejected_across_different_groups(self):
        """Test that the same domain string is rejected across two different groups."""
        other_group = DomainGroup.objects.create(name='Other Brand')
        Domain.objects.create(domain='foo.majora.app', domain_group=self.group)
        with pytest.raises(IntegrityError):
            Domain.objects.create(domain='foo.majora.app', domain_group=other_group)

    def test_domain_is_normalized_to_lowercase(self):
        """Test that a mixed-case domain is stored and read back as lowercase."""
        domain = Domain.objects.create(
            domain='Foo.Majora.App', domain_group=self.group
        )
        domain.refresh_from_db()
        assert domain.domain == 'foo.majora.app'

    def test_domain_requires_group(self):
        """Test that a domain cannot be saved without a domain_group."""
        with pytest.raises(IntegrityError):
            Domain.objects.create(domain='foo.majora.app', domain_group=None)

    @pytest.mark.parametrize('domain', ['foo.majora.app', 'example.com'])
    def test_domain_accepts_valid_hostnames(self, domain):
        """Test that plausible hostnames pass validation."""
        game_domain = Domain(domain=domain, domain_group=self.group)
        game_domain.full_clean()

    @pytest.mark.parametrize(
        'domain',
        ['example .com', 'example\tcom', '*.evil.com', 'example.com\n', 'exa\x00mple.com'],
    )
    def test_domain_rejects_invalid_hostnames(self, domain):
        """Test that whitespace, control characters and wildcards fail validation."""
        game_domain = Domain(domain=domain, domain_group=self.group)
        with pytest.raises(ValidationError):
            game_domain.full_clean()

    def test_schemes_defaults_to_https(self):
        """Test that schemes defaults to 'https' when not given."""
        domain = Domain.objects.create(
            domain='foo.majora.app', domain_group=self.group
        )
        assert domain.schemes == 'https'

    @pytest.mark.parametrize('schemes', ['https', 'http', 'http,https', 'https,http'])
    def test_schemes_accepts_valid_tokens(self, schemes):
        """Test that valid comma-separated http/https combinations pass validation."""
        domain = Domain(
            domain='foo.majora.app', domain_group=self.group, schemes=schemes
        )
        domain.full_clean()

    @pytest.mark.parametrize('schemes', ['ftp', 'https,ftp', 'HTTPS', '', 'https,'])
    def test_schemes_rejects_invalid_tokens(self, schemes):
        """Test that anything other than http/https tokens fails validation."""
        domain = Domain(
            domain='foo.majora.app', domain_group=self.group, schemes=schemes
        )
        with pytest.raises(ValidationError):
            domain.full_clean()

    def test_origins_for_single_scheme(self):
        """Test that origins returns one scheme://domain entry for a single scheme."""
        domain = Domain(
            domain='foo.majora.app', domain_group=self.group, schemes='https'
        )
        assert domain.origins == ['https://foo.majora.app']

    def test_origins_for_multiple_schemes(self):
        """Test that origins returns one entry per configured scheme."""
        domain = Domain(
            domain='foo.majora.app', domain_group=self.group, schemes='http,https'
        )
        assert domain.origins == ['http://foo.majora.app', 'https://foo.majora.app']


class TestDomainGroupCascade(TestCase):
    """Tests for the on_delete=CASCADE behavior between Domain and DomainGroup."""

    @classmethod
    def setUpTestData(cls):
        """Set up a group and a domain."""
        cls.group = DomainGroup.objects.create(name='Majora Brand')
        cls.domain = Domain.objects.create(
            domain='foo.majora.app', domain_group=cls.group
        )

    def test_deleting_group_deletes_domain(self):
        """Test that deleting a group cascades and deletes its domains."""
        self.group.delete()
        assert not Domain.objects.filter(pk=self.domain.pk).exists()
