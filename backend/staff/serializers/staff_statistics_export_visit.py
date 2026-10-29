"""Visit serializer for the staff access statistics raw export."""

from rest_framework import serializers

from statistics.aggregation import metrics
from statistics.models import Visit


class StaffStatisticsExportVisitSerializer(serializers.ModelSerializer):
    """Serializes one visit of an exported session: its start, last hit and hit count."""

    started_at = serializers.SerializerMethodField()
    last_seen_at = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the StaffStatisticsExportVisitSerializer."""

        model = Visit
        fields = ['started_at', 'last_seen_at', 'hits']

    def get_started_at(self, visit):
        """Return the visit start as an ISO 8601 UTC timestamp."""
        return metrics.iso_utc(visit.started_at)

    def get_last_seen_at(self, visit):
        """Return the visit's last hit as an ISO 8601 UTC timestamp."""
        return metrics.iso_utc(visit.last_seen_at)
