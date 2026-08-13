"""CharacterPossession serializer for the games app."""

from rest_framework import serializers

from games.models import CharacterPossession
from games.serializers.hidden_field_mixin import HiddenFieldMixin


class CharacterPossessionSerializer(serializers.ModelSerializer):
    """Serializer for a character's possession assignment.

    `CharacterPossession` is a thin join — `name`/`description`/`photo_path` are sourced
    straight from the linked `GamePossession`, with no override/fallback logic left to
    resolve.
    """

    game_possession_id = serializers.IntegerField(source='game_possession.id', read_only=True)
    name = serializers.CharField(source='game_possession.name', read_only=True)
    description = serializers.CharField(source='game_possession.description', read_only=True)
    photo_path = serializers.CharField(
        source='game_possession.photo.path', default=None, read_only=True,
    )

    class Meta:
        """Metadata for the CharacterPossessionSerializer."""

        model = CharacterPossession
        fields = ['id', 'game_possession_id', 'name', 'description', 'photo_path']


class CharacterPossessionAllSerializer(HiddenFieldMixin, CharacterPossessionSerializer):
    """Serializer for a character's possession assignment, including hidden ones (DM-only).

    Used by the `/possessions/all.json` and `/possessions/:id/full.json` variants — adds
    `hidden` on top of everything `CharacterPossessionSerializer` already exposes; the
    regular, player-facing possession endpoints keep omitting it entirely.
    """

    class Meta(CharacterPossessionSerializer.Meta):
        """Metadata for the CharacterPossessionAllSerializer."""

        fields = CharacterPossessionSerializer.Meta.fields + ['hidden']
