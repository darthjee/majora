"""Tests for the statistics app's Django admin registration."""

from django.contrib import admin

from statistics.models import Session, Visit


class TestStatisticsAdmin:
    """Tests that statistics models are registered read-only with the admin site."""

    def test_session_registered(self):
        """Test that `Session` is registered."""
        assert Session in admin.site._registry

    def test_visit_registered(self):
        """Test that `Visit` is registered."""
        assert Visit in admin.site._registry

    def test_visit_admin_disallows_add(self):
        """Test that visits cannot be added through the admin."""
        assert admin.site._registry[Visit].has_add_permission(None) is False

    def test_visit_admin_disallows_change(self):
        """Test that visits cannot be edited through the admin."""
        assert admin.site._registry[Visit].has_change_permission(None) is False

    def test_visit_admin_disallows_delete(self):
        """Test that visits cannot be deleted through the admin."""
        assert admin.site._registry[Visit].has_delete_permission(None) is False
