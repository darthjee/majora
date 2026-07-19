"""Tests for AdminOrStaffCache."""

import pytest

from games.caches import AdminOrStaffCache
from games.tests.factories import SuperUserFactory, UserFactory
from majora_project.cache import memory_cache


@pytest.mark.django_db
class TestAdminOrStaffCache:
    """Tests for AdminOrStaffCache.is_admin_or_staff()."""

    def setup_method(self):
        """Clear the shared memory cache before each test for isolation."""
        memory_cache.clear()

    def test_returns_true_for_staff_user(self):
        """Test that a staff user is reported as admin-or-staff."""
        user = UserFactory(is_staff=True)
        assert AdminOrStaffCache.is_admin_or_staff(user) is True

    def test_returns_true_for_superuser(self):
        """Test that a superuser is reported as admin-or-staff."""
        user = SuperUserFactory()
        assert AdminOrStaffCache.is_admin_or_staff(user) is True

    def test_returns_false_for_regular_user(self):
        """Test that a regular user is reported as not admin-or-staff."""
        user = UserFactory()
        assert AdminOrStaffCache.is_admin_or_staff(user) is False

    def test_populates_the_cache_on_miss(self):
        """Test that a cache miss stores the computed result keyed by the user's id."""
        user = UserFactory(is_staff=True)
        AdminOrStaffCache.is_admin_or_staff(user)
        assert memory_cache.get(AdminOrStaffCache.CACHE_TYPE, user.id) is True

    def test_serves_from_cache_on_hit_even_if_the_live_user_state_changes(self):
        """Test that a cached result is served without re-checking the live user state."""
        user = UserFactory()
        assert AdminOrStaffCache.is_admin_or_staff(user) is False

        user.is_staff = True
        user.save()

        assert AdminOrStaffCache.is_admin_or_staff(user) is False

    def test_cache_key_is_scoped_by_user_id(self):
        """Test that two different users get independent cache entries."""
        staff_user = UserFactory(is_staff=True)
        regular_user = UserFactory()
        assert AdminOrStaffCache.is_admin_or_staff(staff_user) is True
        assert AdminOrStaffCache.is_admin_or_staff(regular_user) is False
