"""Shared mixin exposing available_units/max_units fields derived from a context game."""

from rest_framework import serializers

from games.models import GameTreasure


def resolve_game_treasure(context, treasure):
    """Return the GameTreasure row linking `treasure` to the context game, or None."""
    game = context.get('game')
    if game is None:
        return None
    prefetched = context.get('game_treasures_by_treasure_id')
    if prefetched is not None:
        return prefetched.get(treasure.id)
    return GameTreasure.objects.filter(game=game, treasure=treasure).first()


def resolve_treasure_value(context, treasure):
    """Return `treasure`'s value in the context game, falling back to its default value."""
    game_treasure = resolve_game_treasure(context, treasure)
    return treasure.value if game_treasure is None else game_treasure.value


class GameTreasureFieldsMixin(serializers.Serializer):
    """Adds `available_units`/`max_units`/`value` fields computed from a `game` in context."""

    available_units = serializers.SerializerMethodField()
    max_units = serializers.SerializerMethodField()
    value = serializers.SerializerMethodField()

    def get_available_units(self, treasure):
        """Return the treasure's available units within the context game, or None."""
        game_treasure = self._game_treasure(treasure)
        return None if game_treasure is None else game_treasure.available_units

    def get_max_units(self, treasure):
        """Return the treasure's max units within the context game, or None."""
        game_treasure = self._game_treasure(treasure)
        return None if game_treasure is None else game_treasure.max_units

    def get_value(self, treasure):
        """Return the treasure's value in the context game, falling back to its default value."""
        return resolve_treasure_value(self.context, treasure)

    def _game_treasure(self, treasure):
        """Return the GameTreasure row linking `treasure` to the context game, or None."""
        return resolve_game_treasure(self.context, treasure)
