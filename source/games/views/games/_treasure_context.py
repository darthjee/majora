"""Shared helper for building the GameTreasure lookup context used by treasure serializers."""

from ...models import GameTreasure


def game_treasures_context(game):
    """Return serializer context with `game` and its GameTreasure rows keyed by treasure id.

    Prefetching the rows once here avoids per-item N+1 queries in list serializers.
    """
    game_treasures_by_id = {
        game_treasure.treasure_id: game_treasure
        for game_treasure in GameTreasure.objects.filter(game=game)
    }
    return {'game': game, 'game_treasures_by_treasure_id': game_treasures_by_id}
