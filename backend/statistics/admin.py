"""Statistics app admin configuration.

Registers `Session` as a read-only entry in Django Admin, so collected statistics can be
inspected without allowing hand-edits — this data is collected automatically, same rationale
as `versioning/admin.py`'s historical-model registrations.
"""

from django.contrib import admin

from statistics.models import Session


class ReadOnlySessionAdmin(admin.ModelAdmin):
    """Admin configuration exposing statistics sessions for inspection only, never editing."""

    def has_add_permission(self, request):
        """Disallow creating sessions through the admin."""
        return False

    def has_change_permission(self, request, obj=None):
        """Disallow editing sessions through the admin."""
        return False

    def has_delete_permission(self, request, obj=None):
        """Disallow deleting sessions through the admin."""
        return False


admin.site.register(Session, ReadOnlySessionAdmin)
