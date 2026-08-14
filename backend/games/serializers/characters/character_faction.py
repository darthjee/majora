"""CharacterFaction serializer for the games app."""

from rest_framework import serializers

from games.models import CharacterFaction
from games.serializers.hidden_field_mixin import HiddenFieldMixin


class CharacterFactionSerializer(serializers.ModelSerializer):
    """Serializer for a character's faction membership.

    `CharacterFaction` is a thin join — `name`/`photo_path` are sourced straight from the
    linked `GameFaction`, with no override/fallback logic left to resolve. No `description`
    field, unlike `CharacterDocumentSerializer` — `GameFaction` has none.
    """

    game_faction_id = serializers.IntegerField(source='game_faction.id', read_only=True)
    name = serializers.CharField(source='game_faction.name', read_only=True)
    photo_path = serializers.CharField(
        source='game_faction.photo.path', default=None, read_only=True,
    )

    class Meta:
        """Metadata for the CharacterFactionSerializer."""

        model = CharacterFaction
        fields = ['id', 'game_faction_id', 'name', 'photo_path']


class CharacterFactionAllSerializer(HiddenFieldMixin, CharacterFactionSerializer):
    """Serializer for a character's faction membership, including hidden ones (DM-only).

    Used by the `/factions/all.json` and `/factions/:id/full.json` variants — adds `hidden`
    on top of everything `CharacterFactionSerializer` already exposes; the regular,
    player-facing faction endpoints keep omitting it entirely.
    """

    class Meta(CharacterFactionSerializer.Meta):
        """Metadata for the CharacterFactionAllSerializer."""

        fields = CharacterFactionSerializer.Meta.fields + ['hidden']
