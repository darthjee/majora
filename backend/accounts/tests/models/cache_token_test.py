"""Tests for the CacheToken model."""

from django.test import TestCase

from accounts.models import CacheToken
from games.tests.factories import UserFactory


class TestCacheToken(TestCase):
    """Tests for the CacheToken model."""

    @classmethod
    def setUpTestData(cls):
        """Set up a user to own created cache tokens."""
        cls.user = UserFactory(username='alice', password='secret-password')

    def test_key_is_generated_automatically(self):
        """Test that a new cache token gets a non-empty key without one being supplied."""
        instance = CacheToken.objects.create(user=self.user)
        assert instance.key
        assert len(instance.key) == 40

    def test_two_users_get_different_keys(self):
        """Test that two different users' cache tokens don't share a key."""
        other_user = UserFactory(username='bob', password='secret-password')
        instance = CacheToken.objects.create(user=self.user)
        other_instance = CacheToken.objects.create(user=other_user)
        assert instance.key != other_instance.key

    def test_get_or_create_is_idempotent_per_user(self):
        """Test that repeated get_or_create calls for the same user return the same key."""
        first, created_first = CacheToken.objects.get_or_create(user=self.user)
        second, created_second = CacheToken.objects.get_or_create(user=self.user)

        assert created_first is True
        assert created_second is False
        assert first.key == second.key
        assert CacheToken.objects.filter(user=self.user).count() == 1

    def test_cache_token_str(self):
        """Test string representation of a cache token."""
        instance = CacheToken(user=self.user)
        assert str(instance) == 'CacheToken(user=alice)'
