"""Staff copy game serializer: one game of the staff copies game picker."""

from rest_framework import serializers

from games.models import Game


class StaffCopyGameSerializer(serializers.ModelSerializer):
    """Serializer for a game of `GET staff/copies/games.json`, with its domain group names."""

    slug = serializers.CharField(source='game_slug')
    domain_groups = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the StaffCopyGameSerializer."""

        model = Game
        fields = ['slug', 'name', 'domain_groups']

    def get_domain_groups(self, obj):
        """Return the names of the game's domain groups, ordered by name."""
        return sorted(group.name for group in obj.game_domain_groups.all())
