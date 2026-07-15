"""Game detail serializer for the games app."""

from django.utils import timezone
from rest_framework import serializers

from games.models import Game
from games.serializers.games.game_photo import GamePhotoSerializer
from games.serializers.link import LinkSerializer


class GameDetailSerializer(serializers.ModelSerializer):
    """Serializer for game detail view including links and photos."""

    links = LinkSerializer(many=True, read_only=True)
    photos = GamePhotoSerializer(many=True, read_only=True)
    cover_photo_path = serializers.CharField(
        source='cover_photo.path', default=None, read_only=True
    )
    next_session = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the GameDetailSerializer."""

        model = Game
        fields = [
            'name',
            'game_slug',
            'description',
            'links',
            'photos',
            'cover_photo_path',
            'next_session',
        ]

    def get_next_session(self, obj):
        """Return `{'title', 'date'}` for the game's next session, or None.

        The next session is the earliest-dated session with `date >= today`. If no session
        has a date at all, falls back to the first session by id. If the game has no sessions,
        or every dated session is already in the past with no unscheduled session, returns None.
        """
        session = self._find_next_session(obj)
        if session is None:
            return None
        return {'title': session.title, 'date': session.date}

    def _find_next_session(self, obj):
        """Return the session instance to use as the "next session", or None."""
        today = timezone.now().date()
        upcoming = obj.sessions.filter(date__gte=today).order_by('date', 'id').first()
        if upcoming is not None:
            return upcoming
        if not obj.sessions.filter(date__isnull=False).exists():
            return obj.sessions.order_by('id').first()
        return None
