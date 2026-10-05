"""Tests for the StatisticsUserIdentitySerializer."""

from django.contrib.auth.models import User
from django.test import TestCase

from accounts.models import UserProfile
from games.tests.factories import UserFactory, UserProfileFactory
from staff.serializers import StatisticsUserIdentitySerializer


class TestStatisticsUserIdentitySerializer(TestCase):
    """Tests for the StatisticsUserIdentitySerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up a user with a display name."""
        cls.user = UserFactory(username='aria', email='aria@example.com')
        UserProfileFactory(user=cls.user, display_name='Aria Stormwind')

    def _data(self):
        """Serialize a freshly loaded copy of the user."""
        user = User.objects.select_related('profile').get(pk=self.user.pk)
        return StatisticsUserIdentitySerializer(user).data

    def test_serializes_all_keys(self):
        """Test that exactly the identity keys are serialized, with their values."""
        assert self._data() == {
            'id': self.user.id,
            'name': 'aria',
            'display_name': 'Aria Stormwind',
            'email': 'aria@example.com',
        }

    def test_blank_display_name_is_none(self):
        """Test that a null display name gives `None`."""
        UserProfile.objects.filter(user=self.user).update(display_name=None)
        assert self._data()['display_name'] is None

    def test_empty_display_name_is_none(self):
        """Test that an empty display name gives `None`."""
        UserProfile.objects.filter(user=self.user).update(display_name='')
        assert self._data()['display_name'] is None

    def test_missing_profile_display_name_is_none(self):
        """Test that a user without a profile gives a `None` display name."""
        UserProfile.objects.filter(user=self.user).delete()
        assert self._data()['display_name'] is None
