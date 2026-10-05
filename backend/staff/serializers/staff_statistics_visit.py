"""Visit row serializer for the staff access statistics visit list."""

from datetime import timedelta

from rest_framework import serializers

from statistics.aggregation import StatisticsFilters, metrics
from statistics.models import Visit
from statistics.settings import Settings

from .statistics_user_identity import StatisticsUserIdentitySerializer


class StaffStatisticsVisitSerializer(serializers.ModelSerializer):
    """Serializes one visit of the staff visit list; reads the request's `now` from context.

    The session token is never exposed: only the session id, IP, domain and user are read.
    """

    UNKNOWN_DOMAIN = {'id': StatisticsFilters.UNKNOWN_DOMAIN, 'domain': None}

    started_at = serializers.SerializerMethodField()
    last_seen_at = serializers.SerializerMethodField()
    duration_seconds = serializers.SerializerMethodField()
    ongoing = serializers.SerializerMethodField()
    ip = serializers.CharField(source='session.ip', read_only=True)
    domain = serializers.SerializerMethodField()
    session_id = serializers.IntegerField(read_only=True)
    user = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the StaffStatisticsVisitSerializer."""

        model = Visit
        fields = [
            'id', 'started_at', 'last_seen_at', 'duration_seconds', 'hits', 'ongoing',
            'ip', 'domain', 'session_id', 'user',
        ]

    def get_started_at(self, visit):
        """Return the visit start as an ISO 8601 UTC timestamp."""
        return metrics.iso_utc(visit.started_at)

    def get_last_seen_at(self, visit):
        """Return the visit's last hit as an ISO 8601 UTC timestamp."""
        return metrics.iso_utc(visit.last_seen_at)

    def get_duration_seconds(self, visit):
        """Return the whole-second duration of the visit (`0` for a single hit)."""
        return metrics.duration_seconds(visit.started_at, visit.last_seen_at)

    def get_ongoing(self, visit):
        """Return whether the visit's last hit is still inside the inactivity window."""
        return self.context['now'] - visit.last_seen_at < self._inactivity_window()

    def get_domain(self, visit):
        """Return the session's `{id, domain}`, or the unknown entry when it has none."""
        domain = visit.session.domain
        if domain is None:
            return dict(self.UNKNOWN_DOMAIN)
        return {'id': domain.id, 'domain': domain.domain}

    def get_user(self, visit):
        """Return the session user's identity, or `None` for anonymous visits."""
        user = visit.session.user
        if user is None:
            return None
        return StatisticsUserIdentitySerializer(user).data

    @staticmethod
    def _inactivity_window():
        """Return the inactivity window after which a visit is closed."""
        return timedelta(seconds=Settings.visit_inactivity_seconds())
