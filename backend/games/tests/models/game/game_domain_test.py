"""Tests for the GameDomain model."""

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from games.models import GameDomain, GameDomainGroup


@pytest.mark.django_db
class TestGameDomain:
    """Tests for the GameDomain model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.group = GameDomainGroup.objects.create(name='Majora Brand')

    def test_domain_creation(self):
        """Test that a domain can be created with a group FK."""
        domain = GameDomain.objects.create(
            domain='foo.majora.app', game_domain_group=self.group
        )
        assert domain.pk is not None
        assert domain.game_domain_group == self.group

    def test_domain_str(self):
        """Test string representation of a domain."""
        domain = GameDomain(domain='foo.majora.app', game_domain_group=self.group)
        assert str(domain) == 'foo.majora.app'

    def test_domain_uniqueness(self):
        """Test that domain must be globally unique."""
        GameDomain.objects.create(domain='foo.majora.app', game_domain_group=self.group)
        with pytest.raises(IntegrityError):
            GameDomain.objects.create(domain='foo.majora.app', game_domain_group=self.group)

    def test_domain_requires_group(self):
        """Test that a domain cannot be saved without a game_domain_group."""
        with pytest.raises(IntegrityError):
            GameDomain.objects.create(domain='foo.majora.app', game_domain_group=None)

    @pytest.mark.parametrize('domain', ['foo.majora.app', 'example.com'])
    def test_domain_accepts_valid_hostnames(self, domain):
        """Test that plausible hostnames pass validation."""
        game_domain = GameDomain(domain=domain, game_domain_group=self.group)
        game_domain.full_clean()

    @pytest.mark.parametrize(
        'domain',
        ['example .com', 'example\tcom', '*.evil.com', 'example.com\n', 'exa\x00mple.com'],
    )
    def test_domain_rejects_invalid_hostnames(self, domain):
        """Test that whitespace, control characters and wildcards fail validation."""
        game_domain = GameDomain(domain=domain, game_domain_group=self.group)
        with pytest.raises(ValidationError):
            game_domain.full_clean()

    def test_schemes_defaults_to_https(self):
        """Test that schemes defaults to 'https' when not given."""
        domain = GameDomain.objects.create(
            domain='foo.majora.app', game_domain_group=self.group
        )
        assert domain.schemes == 'https'

    @pytest.mark.parametrize('schemes', ['https', 'http', 'http,https', 'https,http'])
    def test_schemes_accepts_valid_tokens(self, schemes):
        """Test that valid comma-separated http/https combinations pass validation."""
        domain = GameDomain(
            domain='foo.majora.app', game_domain_group=self.group, schemes=schemes
        )
        domain.full_clean()

    @pytest.mark.parametrize('schemes', ['ftp', 'https,ftp', 'HTTPS', '', 'https,'])
    def test_schemes_rejects_invalid_tokens(self, schemes):
        """Test that anything other than http/https tokens fails validation."""
        domain = GameDomain(
            domain='foo.majora.app', game_domain_group=self.group, schemes=schemes
        )
        with pytest.raises(ValidationError):
            domain.full_clean()

    def test_origins_for_single_scheme(self):
        """Test that origins returns one scheme://domain entry for a single scheme."""
        domain = GameDomain(
            domain='foo.majora.app', game_domain_group=self.group, schemes='https'
        )
        assert domain.origins == ['https://foo.majora.app']

    def test_origins_for_multiple_schemes(self):
        """Test that origins returns one entry per configured scheme."""
        domain = GameDomain(
            domain='foo.majora.app', game_domain_group=self.group, schemes='http,https'
        )
        assert domain.origins == ['http://foo.majora.app', 'https://foo.majora.app']


class TestGameDomainGroupCascade(TestCase):
    """Tests for the on_delete=CASCADE behavior between GameDomain and GameDomainGroup."""

    @classmethod
    def setUpTestData(cls):
        """Set up a group and a domain."""
        cls.group = GameDomainGroup.objects.create(name='Majora Brand')
        cls.domain = GameDomain.objects.create(
            domain='foo.majora.app', game_domain_group=cls.group
        )

    def test_deleting_group_deletes_domain(self):
        """Test that deleting a group cascades and deletes its domains."""
        self.group.delete()
        assert not GameDomain.objects.filter(pk=self.domain.pk).exists()
