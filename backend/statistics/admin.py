"""Statistics app admin configuration.

Registers `Session` and `Visit` as read-only entries in Django Admin, so collected statistics
can be inspected without allowing hand-edits — this data is collected automatically, same
rationale as `versioning/admin.py`'s historical-model registrations.
"""

from django.contrib import admin

from statistics.models import Session, Visit


class ReadOnlyStatisticsAdmin(admin.ModelAdmin):
    """Admin configuration exposing statistics records for inspection only, never editing."""

    def has_add_permission(self, request):
        """Disallow creating statistics records through the admin."""
        return False

    def has_change_permission(self, request, obj=None):
        """Disallow editing statistics records through the admin."""
        return False

    def has_delete_permission(self, request, obj=None):
        """Disallow deleting statistics records through the admin."""
        return False


admin.site.register(Session, ReadOnlyStatisticsAdmin)
admin.site.register(Visit, ReadOnlyStatisticsAdmin)
