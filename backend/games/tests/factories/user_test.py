"""Tests for `UserFactory`, `SuperUserFactory` and `UserProfileFactory`."""

from django.test import TestCase

from accounts.models import UserProfile
from games.tests.factories import SuperUserFactory, UserFactory, UserProfileFactory


class TestUserFactoryProfile(TestCase):
    """Tests for the `with_profile` parameter."""

    def test_default_creates_approved_profile(self):
        """Test that the default creates exactly one approved profile."""
        user = UserFactory()
        profiles = UserProfile.objects.filter(user_id=user.pk)
        assert profiles.count() == 1
        assert profiles.get().status == UserProfile.STATUS_APPROVED

    def test_without_profile(self):
        """Test that with_profile=False creates the user and no profile row."""
        user = UserFactory(with_profile=False)
        assert user.pk is not None
        assert not UserProfile.objects.filter(user_id=user.pk).exists()

    def test_superuser_without_profile(self):
        """Test that SuperUserFactory honors with_profile=False."""
        user = SuperUserFactory(with_profile=False)
        assert user.is_superuser
        assert not UserProfile.objects.filter(user_id=user.pk).exists()

    def test_superuser_default_has_profile(self):
        """Test that SuperUserFactory still creates a profile by default."""
        user = SuperUserFactory()
        assert UserProfile.objects.filter(user_id=user.pk).exists()

    def test_profile_factory_on_profileless_user(self):
        """Test that UserProfileFactory creates the profile with the given status."""
        user = UserFactory(with_profile=False)
        UserProfileFactory(user=user, status=UserProfile.STATUS_PENDING)
        assert UserProfile.objects.get(user_id=user.pk).status == UserProfile.STATUS_PENDING

    def test_flag_does_not_leak_to_user(self):
        """Test that with_profile never reaches create_user nor the user instance."""
        user = UserFactory(with_profile=False)
        assert not hasattr(user, 'with_profile')
