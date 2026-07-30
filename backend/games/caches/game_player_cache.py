"""Cache wrapper for the Game DM/player boolean permission check."""

from .boolean_check_cache import _BooleanCheckCache


class GamePlayerCache(_BooleanCheckCache):
    """Cache whether a user is a player (optionally a DM) of a game.

    Keyed by user id, game id, and the `is_dm` filter, since `Game.has_player` is called
    both without a filter (any player or DM) and with `is_dm=True` (DM only), and those two
    calls must not share a cached result.
    """

    CACHE_TYPE = 'game_player'

    @classmethod
    def has_player(cls, game, user, is_dm=None):
        """Return whether `user` is a player of `game`, using the shared memory cache."""
        key = (user.id, game.id, is_dm)
        return cls._get_or_compute(cls.CACHE_TYPE, key, lambda: cls._query(game, user, is_dm))

    @classmethod
    def _query(cls, game, user, is_dm):
        """Run the underlying database query backing the DM/player check."""
        filters = {'user': user}
        if is_dm is not None:
            filters['is_dm'] = is_dm
        return game.players.filter(**filters).exists()
