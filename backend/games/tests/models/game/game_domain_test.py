"""Tests for the GameDomain model."""

import pytest
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
