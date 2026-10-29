"""Session serializer for the staff access statistics raw export."""

from rest_framework import serializers

from statistics.aggregation import SessionExportVisits, StatisticsFilters, metrics
from statistics.models import Session

from .staff_statistics_export_visit import StaffStatisticsExportVisitSerializer


class StaffStatisticsExportSessionSerializer(serializers.ModelSerializer):
    """Serializes one exported session with its in-range visits, capped per session.

    Reads the page's batched visits from `context['visits']` (`{session_id: [visit, ...]}`,
    up to the cap + 1). Also carries the session tracking fields: `first_path` (a route
    pattern, never a raw path), `first_seen_logged` and the raw `creation_reason` value.
    Never exposes the session `token` nor any user data beyond the id.
    """

    UNKNOWN_DOMAIN = {'id': StatisticsFilters.UNKNOWN_DOMAIN, 'domain': None}
    MAX_VISITS = SessionExportVisits.MAX_PER_SESSION

    domain = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(read_only=True)
    created_at = serializers.SerializerMethodField()
    last_seen_at = serializers.SerializerMethodField()
    visits = serializers.SerializerMethodField()
    visits_truncated = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the StaffStatisticsExportSessionSerializer."""

        model = Session
        fields = [
            'id', 'ip', 'domain', 'user_id', 'created_at', 'last_seen_at',
            'visits', 'visits_truncated', 'first_path', 'first_seen_logged', 'creation_reason',
        ]

    def get_domain(self, session):
        """Return the session's `{id, domain}`, or the unknown entry when it has none."""
        domain = session.domain
        if domain is None:
            return dict(self.UNKNOWN_DOMAIN)
        return {'id': domain.id, 'domain': domain.domain}

    def get_created_at(self, session):
        """Return the session creation as an ISO 8601 UTC timestamp."""
        return metrics.iso_utc(session.created_at)

    def get_last_seen_at(self, session):
        """Return the session's last activity as an ISO 8601 UTC timestamp."""
        return metrics.iso_utc(session.last_seen_at)

    def get_visits(self, session):
        """Return the session's in-range visits, earliest first, at most `MAX_VISITS`."""
        visits = self._loaded_visits(session)[:self.MAX_VISITS]
        return StaffStatisticsExportVisitSerializer(visits, many=True).data

    def get_visits_truncated(self, session):
        """Return whether the session has more in-range visits than `MAX_VISITS`."""
        return len(self._loaded_visits(session)) > self.MAX_VISITS

    def _loaded_visits(self, session):
        """Return the batched visits of `session` from the context (empty when none)."""
        return self.context['visits'].get(session.id, [])
