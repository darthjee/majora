"""GameFaction update serializer for the games app."""

from rest_framework import serializers

from games.models import GameFaction


class GameFactionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the limited set of fields that may be edited on a faction.

    `name` has no fallback target, so it stays required and non-blank via the default
    `CharField` behavior; `required: False` here only governs PATCH's partial semantics.
    """

    class Meta:
        """Metadata for the GameFactionUpdateSerializer."""

        model = GameFaction
        fields = ['name']
        extra_kwargs = {field: {'required': False} for field in fields}

    def validate_name(self, value):
        """Reject a name already used by another faction in the same game.

        `game` isn't a serializer field (only `name` is editable), so DRF can't derive an
        automatic `UniqueTogetherValidator` from `GameFaction`'s `unique_faction_name_per_game`
        constraint — checked explicitly here instead, turning what would otherwise be an
        unhandled `IntegrityError` into a normal 400.
        """
        game_id = self.instance.game_id
        clashing = GameFaction.objects.filter(game_id=game_id, name=value).exclude(
            pk=self.instance.pk,
        )
        if clashing.exists():
            raise serializers.ValidationError('faction_name_taken', code='faction_name_taken')
        return value
